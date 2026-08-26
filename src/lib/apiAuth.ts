import "server-only";

import { timingSafeEqual } from "node:crypto";
import { adminAuth } from "@/lib/firebase-admin";
import { getCRMUserById } from "@/lib/crmUserRepository";
import { getRoleById } from "@/repositories/roleRepository";
import type { CRMUser,CurrentCRMUser,Permission,Role } from "@/types/crm-auth";
import { NextResponse } from "next/server";

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
        lastLoginAt:null
    };
    return { ...profile,permissions:role.permissions,role,authType:"service" };
}

export async function getCurrentCRMUser(request:Request):Promise<CurrentCRMUser | null> {
    if(matchesServiceApiKey(request)) return getServiceUser();

    const authorization = request.headers.get("authorization");
    if(!authorization?.startsWith("Bearer ")) return null;

    try {
        const decoded = await adminAuth.verifyIdToken(authorization.slice(7),true);
        const profile = await getCRMUserById(decoded.uid);
        if(!profile || profile.status !== "active") return null;

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
    return user.status === "active" && user.permissions.includes(permission);
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
                { error:"Active CRM user profile required" },
                { status:401 }
            )
        };
    }

    if(!hasPermission(user,permission)){
        return {
            ok:false,
            response:NextResponse.json(
                { error:"Insufficient permissions" },
                { status:403 }
            )
        };
    }

    return { ok:true,user };
}
