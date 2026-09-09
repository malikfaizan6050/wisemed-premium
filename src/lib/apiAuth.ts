import "server-only";

import { timingSafeEqual } from "node:crypto";
import { adminAuth } from "@/lib/firebase-admin";
import { getCRMUserById } from "@/lib/crmUserRepository";
import { getRoleById } from "@/repositories/roleRepository";
import { activateInvitedUser } from "@/repositories/userRepository";
import type { CRMUser,CurrentCRMUser,Permission,Role } from "@/types/crm-auth";
import { NextResponse } from "next/server";
import { canCreateLead,hasPermission as hasAssignedPermission } from "@/lib/permissions";

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

export async function getCurrentCRMUser(request:Request):Promise<CurrentCRMUser | null> {
    if(matchesServiceApiKey(request)) return getServiceUser();

    const authorization = request.headers.get("authorization");
    if(process.env.NODE_ENV === "development"){
        console.info("[CRM auth] Authorization header received",{
            received:Boolean(authorization),
            bearer:authorization?.startsWith("Bearer ") === true
        });
    }
    if(!authorization?.startsWith("Bearer ")) return null;

    try {
        const decoded = await adminAuth.verifyIdToken(authorization.slice(7),true);
        if(process.env.NODE_ENV === "development"){
            console.info("[CRM auth] Firebase token decoded",{ uid:decoded.uid });
        }
        let profile = await getCRMUserById(decoded.uid);
        if(process.env.NODE_ENV === "development"){
            console.info("[CRM auth] CRM user profile lookup",{
                uid:decoded.uid,
                found:Boolean(profile),
                status:profile?.status ?? null,
                roleId:profile?.roleId ?? null
            });
        }
        if(profile?.status === "invited"){
            await activateInvitedUser(decoded.uid);
            profile = await getCRMUserById(decoded.uid);
        }
        if(!profile || profile.status !== "active") return null;
        if(profile.mustChangePassword) return null;

        const role = await getRoleById(profile.roleId);
        if(!role || role.status !== "active") return null;

        return {
            ...profile,
            email:profile.email || decoded.email || "",
            permissions:role.permissions,
            role,
            authType:"firebase"
        };
    }
    catch {
        return null;
    }
}

export function hasPermission(user:CurrentCRMUser,permission:Permission) {
    if(user.status !== "active") return false;
    if(user.role.id === "admin") return true;
    if(permission === "leads.create") return canCreateLead(user.role.id,user.permissions,user.role.name);
    return hasAssignedPermission(user.permissions,permission);
}

export async function requirePermission(
    request:Request,
    permission:Permission
):Promise<PermissionResult> {
    const user = await getCurrentCRMUser(request);

    if(!user){
        return {
            ok:false,
            response:NextResponse.json(
                { error:"Active CRM user profile required",code:"unauthenticated" },
                { status:401 }
            )
        };
    }

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
