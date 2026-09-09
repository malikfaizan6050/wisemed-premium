import { NextResponse } from "next/server";
import { getCurrentCRMUser } from "@/lib/apiAuth";
import { adminAuth,db } from "@/lib/firebase-admin";
import { isPermission } from "@/lib/permissions";
import { getCRMUserById } from "@/lib/crmUserRepository";
import { isExpired } from "@/services/userService";

export async function GET(request:Request) {
    const authorization = request.headers.get("authorization");
    if(authorization?.startsWith("Bearer ")){
        try {
            const decoded = await adminAuth.verifyIdToken(authorization.slice(7),true);
            const pendingUser = await getCRMUserById(decoded.uid);
            if(pendingUser?.status === "active" && pendingUser.mustChangePassword){
                if(isExpired(pendingUser.temporaryPasswordExpiresAt)){
                    return NextResponse.json({
                        error:"Temporary password has expired. Ask an administrator to regenerate it.",
                        code:"temporary_password_expired"
                    },{ status:403 });
                }
                return NextResponse.json({
                    error:"You must create a personal password before accessing the CRM.",
                    code:"password_change_required",
                    user:{ uid:pendingUser.uid,email:pendingUser.email,displayName:pendingUser.displayName,mustChangePassword:true }
                },{ status:428 });
            }
        }
        catch {
            // The normal authentication response below handles invalid or revoked tokens.
        }
    }

    let developmentTrace:Record<string,unknown>|null=null;
    if(process.env.NODE_ENV === "development"){
        const authorization = request.headers.get("authorization");
        developmentTrace={ authorizationReceived:Boolean(authorization),decodedUid:null,userDocumentPath:null,userDocumentExists:false,userDocumentData:null,roleId:null,roleDocumentPath:null,roleDocumentExists:false,roleData:null,finalResponse:null,rejectionReason:null };
        if(authorization?.startsWith("Bearer ")){
            try{
                const decoded = await adminAuth.verifyIdToken(authorization.slice(7),true);
                const firestorePath = `users/${decoded.uid}`;
                const snapshot = await db.collection("users").doc(decoded.uid).get();
                const userData=snapshot.data();
                const roleId=typeof userData?.roleId === "string" ? userData.roleId : null;
                const rolePath=roleId ? `roles/${roleId}` : null;
                const roleSnapshot=roleId ? await db.collection("roles").doc(roleId).get() : null;
                const roleData=roleSnapshot?.data();
                developmentTrace={...developmentTrace,decodedUid:decoded.uid,userDocumentPath:firestorePath,userDocumentExists:snapshot.exists,userDocumentData:userData??null,roleId,roleDocumentPath:rolePath,roleDocumentExists:roleSnapshot?.exists??false,roleData:roleData??null};
                if(!snapshot.exists) developmentTrace.rejectionReason="user_document_missing";
                else if(userData?.status !== "active") developmentTrace.rejectionReason="user_status_not_active";
                else if(!roleId) developmentTrace.rejectionReason="role_id_missing";
                else if(!roleSnapshot?.exists) developmentTrace.rejectionReason="role_document_missing";
                else if(roleData?.status !== undefined && roleData.status !== "active") developmentTrace.rejectionReason="role_status_not_active";
                else if(!Array.isArray(roleData?.permissions)) developmentTrace.rejectionReason="permissions_missing_or_not_array";
                else if(!roleData.permissions.some(isPermission)) developmentTrace.rejectionReason="no_recognized_permissions";
            }
            catch{
                developmentTrace.rejectionReason="firebase_token_invalid";
            }
        }
        else{
            developmentTrace.rejectionReason="authorization_bearer_missing";
        }
    }

    const user = await getCurrentCRMUser(request);
    if(!user){
        if(developmentTrace){
            developmentTrace.finalResponse={ status:401,code:"unauthenticated" };
            developmentTrace.rejectionReason=developmentTrace.rejectionReason??"get_current_crm_user_returned_null";
            console.info("[/api/users/me] Authentication trace",developmentTrace);
        }
        return NextResponse.json(
            { error:"Active CRM user profile required",code:"unauthenticated" },
            { status:401 }
        );
    }

    if(developmentTrace){
        developmentTrace.finalResponse={ status:200,userUid:user.uid,roleId:user.roleId,permissionCount:user.permissions.length };
        developmentTrace.rejectionReason=null;
        console.info("[/api/users/me] Authentication trace",developmentTrace);
    }

    return NextResponse.json({
        user:{
            uid:user.uid,
            email:user.email,
            displayName:user.displayName,
            roleId:user.roleId,
            status:user.status
        },
        role:{ id:user.role.id,name:user.role.name },
        permissions:user.permissions
    });
}
