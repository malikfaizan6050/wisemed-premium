import "server-only";

import { timingSafeEqual } from "node:crypto";
import { adminAuth,db,FirebaseAdminConfigurationError } from "@/lib/firebase-admin";
import { mapCRMUser } from "@/lib/crmUserRepository";
import { getRoleById } from "@/repositories/roleRepository";
import { activateInvitedUser } from "@/repositories/userRepository";
import type { CRMUser,CurrentCRMUser,Permission,Role } from "@/types/crm-auth";
import { NextResponse } from "next/server";
import { resolvePermission } from "@/lib/permissions";

type PermissionResult =
    | { ok:true; user:CurrentCRMUser }
    | { ok:false; response:NextResponse };

const servicePermissions:Permission[] = ["leads.create"];

function matchesServiceApiKey(request:Request) {
    const supplied = request.headers.get("x-crm-api-key");
    const configured = process.env.WISEMED_CRM_API_KEY;
    if(!supplied || !configured) return false;

    const suppliedBuffer = Buffer.from(supplied);
    const configuredBuffer = Buffer.from(configured);
    return suppliedBuffer.length === configuredBuffer.length &&
        timingSafeEqual(suppliedBuffer,configuredBuffer);
}

function getServiceUser():CurrentCRMUser {
    const now = new Date();
    const role:Role = {
        id:"crm-service",
        name:"CRM Integration Service",
        description:"Restricted server-to-server lead ingestion identity",
        permissions:servicePermissions,
        isSystemRole:true,
        status:"active",
        createdAt:now,
        updatedAt:now,
        createdById:"system",
        updatedById:"system"
    };
    const profile:CRMUser = {
        uid:"crm-service",
        email:"",
        displayName:"CRM Integration Service",
        phone:"",
        jobTitle:"Integration",
        roleId:role.id,
        teamId:null,
        managerId:null,
        status:"active",
        createdAt:now,
        createdById:"system",
        updatedAt:now,
        lastLoginAt:null,
        mustChangePassword:false,
        temporaryPasswordExpiresAt:null
    };
    return { ...profile,permissions:role.permissions,role,authType:"service" };
}

export type CRMAuthResult =
    | { ok:true; user:CurrentCRMUser }
    | { ok:false; status:number; code:string; error:string };

export async function authenticateCRMUser(request:Request,allowService=false):Promise<CRMAuthResult> {
    if(allowService && matchesServiceApiKey(request)) return { ok:true,user:getServiceUser() };
    let stage="token";
    const startedAt=Date.now();
    let safeSdkCode:string | number | null=null;
    const trace=(event:string,details:Record<string,boolean | number>={})=>{
        console.info("[CRM auth]",{ event,stage,elapsedMs:Date.now()-startedAt,...details });
    };
    const fail=(status:number,code:string,error:string):CRMAuthResult=>{
        // Only fixed diagnostic labels are logged; never SDK messages or user documents.
        console.warn("[CRM auth]",{ stage,status,code,sdkCode:safeSdkCode,elapsedMs:Date.now()-startedAt });
        return { ok:false,status,code,error };
    };
    const authorization=request.headers.get("authorization");
    if(!authorization) return fail(401,"auth_token_missing","Sign in to access the CRM.");
    const match=/^Bearer\s+(\S+)$/i.exec(authorization);
    if(!match) return fail(401,"auth_token_invalid","Your session is invalid. Sign in again.");
    try {
        trace("token_verification_started");
        const decoded=await adminAuth.verifyIdToken(match[1],true);
        trace("token_verified");
        stage="crm_user_lookup";
        const snapshot=await db.collection("users").doc(decoded.uid).get();
        trace("user_lookup_completed",{ exists:snapshot.exists });
        if(!snapshot.exists) return fail(404,"crm_user_not_found","Your Firebase account has no CRM profile. Ask an administrator to provision it.");
        const data=snapshot.data();
        if(!["active","invited"].includes(data?.status)) return fail(403,"crm_user_inactive","Your CRM account is inactive. Contact an administrator.");
        const profile=mapCRMUser(decoded.uid,data);
        if(!profile || profile.roleId.includes("/")) return fail(403,"crm_role_invalid","Your CRM profile has no valid role. Contact an administrator.");
        if(profile.mustChangePassword){
            const expiry=profile.temporaryPasswordExpiresAt;
            const expiryTime=expiry instanceof Date ? expiry.getTime() : expiry?.toDate().getTime();
            if(!expiryTime || !Number.isFinite(expiryTime) || expiryTime<=Date.now()) return fail(403,"temporary_password_expired","Temporary password expired. Ask an administrator to regenerate it.");
            return fail(428,"password_change_required","Create a personal password before accessing the CRM.");
        }
        stage="crm_role_lookup";
        const role=await getRoleById(profile.roleId);
        trace("role_lookup_completed",{ validRole:Boolean(role),permissionCount:role?.permissions.length ?? 0 });
        if(!role) return fail(403,"crm_role_invalid","Your CRM role is missing or invalid. Contact an administrator.");
        if(role.status!=="active") return fail(403,"crm_role_inactive","Your CRM role is disabled. Contact an administrator.");
        if(role.id!=="admin" && role.permissions.length===0) return fail(403,"crm_permissions_missing","Your CRM role has no recognized permissions. Contact an administrator.");
        if(profile.status==="invited"){
            stage="invitation_activation";
            await activateInvitedUser(decoded.uid);
            // Re-read to avoid accepting a concurrently suspended invitation.
            const current=await db.collection("users").doc(decoded.uid).get();
            const currentProfile=mapCRMUser(decoded.uid,current.data());
            if(currentProfile?.status!=="active" || currentProfile.roleId!==profile.roleId || currentProfile.mustChangePassword)
                return fail(403,"crm_user_inactive","Your CRM profile changed. Sign in again or contact an administrator.");
            profile.status="active";
        }
        trace("authentication_succeeded");
        return { ok:true,user:{ ...profile,email:profile.email || decoded.email || "",permissions:role.permissions,role,authType:"firebase" } };
    } catch(error) {
        const sdkCode=error && typeof error==="object" && "code" in error ? error.code : null;
        // Never log SDK messages, details, stacks, metadata or arbitrary codes.
        const allowedCodes:Array<string | number>=[
            "app/invalid-credential","auth/invalid-credential","auth/insufficient-permission",
            "app/invalid-app-options","auth/user-disabled","auth/argument-error",
            "auth/invalid-id-token","auth/id-token-expired","auth/id-token-revoked",
            "auth/user-not-found","auth/internal-error","app/network-error",
            "app/network-timeout","permission-denied","unauthenticated",
            "unavailable","deadline-exceeded",4,5,7,14,16
        ];
        safeSdkCode=allowedCodes.includes(sdkCode as string | number) ? sdkCode as string | number : null;
        if(sdkCode==="auth/insufficient-permission")
            return fail(503,"firebase_auth_access_denied","CRM server cannot access Firebase Authentication. Contact an administrator.");
        if(error instanceof FirebaseAdminConfigurationError || ["app/invalid-credential","auth/invalid-credential","app/invalid-app-options"].includes(String(sdkCode)))
            return fail(503,"firebase_admin_configuration_error","CRM server authentication is not configured correctly. Contact an administrator.");
        if(sdkCode==="auth/user-disabled") return fail(403,"crm_user_inactive","Your authentication account is disabled. Contact an administrator.");
        if(stage==="token" && ["auth/argument-error","auth/invalid-id-token","auth/id-token-expired","auth/id-token-revoked","auth/user-not-found"].includes(String(sdkCode)))
            return fail(401,"auth_token_invalid","Your session is invalid or expired. Sign in again.");
        if(stage!=="token" && [7,16,"permission-denied","unauthenticated"].includes(sdkCode as string | number))
            return fail(503,"crm_datastore_access_denied","CRM server cannot access its datastore. Contact an administrator.");
        return fail(500,"internal_server_error","CRM server could not complete sign-in. Try again or contact an administrator.");
    }
}

export async function getCurrentCRMUser(request:Request):Promise<CurrentCRMUser | null> {
    const result=await authenticateCRMUser(request,true);
    return result.ok ? result.user : null;
}

export function hasPermission(user:CurrentCRMUser,permission:Permission) {
    if(user.status !== "active") return false;
    return resolvePermission(user.role.id,user.role.name,user.permissions,permission);
}

export async function requirePermission(
    request:Request,
    permission:Permission
):Promise<PermissionResult> {
    const result = await authenticateCRMUser(request,true);

    if(!result.ok){
        return {
            ok:false,
            response:NextResponse.json(
                { error:result.error,code:result.code },
                { status:result.status }
            )
        };
    }

    const user=result.user;
    if(!hasPermission(user,permission)){
        return {
            ok:false,
            response:NextResponse.json(
                { error:"Insufficient permissions",code:"forbidden" },
                { status:403 }
            )
        };
    }

    return { ok:true,user };
}
