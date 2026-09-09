"use client";

import { createContext,useCallback,useContext,useEffect,useMemo,useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { canCreateLead,hasPermission as userHasPermission,validatePermissions,type Permission } from "@/lib/permissions";
import { authenticatedFetch } from "@/lib/authenticatedFetch";

interface CRMUserContextValue {
    displayName:string;
    roleId:string;
    roleName:string;
    permissions:Permission[];
    loading:boolean;
    accessDeniedMessage:string;
    hasPermission:(permission:Permission)=>boolean;
    reportAccessDenied:()=>void;
}

const CRMUserContext = createContext<CRMUserContextValue | null>(null);

export function CRMUserProvider({ children }:{ children:React.ReactNode }) {
    const [displayName,setDisplayName] = useState("");
    const [roleId,setRoleId] = useState("");
    const [roleName,setRoleName] = useState("");
    const [permissions,setPermissions] = useState<Permission[]>([]);
    const [loading,setLoading] = useState(true);
    const [accessDeniedMessage,setAccessDeniedMessage] = useState("");

    useEffect(()=>onAuthStateChanged(auth,async(firebaseUser)=>{
        setLoading(true);
        setPermissions([]);

        if(!firebaseUser){
            setDisplayName("");
            setRoleId("");
            setRoleName("");
            setLoading(false);
            return;
        }

        try {
            const response = await authenticatedFetch("/api/users/me");
            const result:unknown = await response.json().catch(()=>null);
            const responseCode=result&&typeof result==="object"&&"code" in result?result.code:null;
            if(responseCode==="password_change_required"){
                window.location.replace("/change-password");
                return;
            }
            if(process.env.NODE_ENV === "development"){
                console.info("[CRMUserContext] Profile response",{
                    firebaseUserUid:firebaseUser.uid,
                    apiResponseStatus:response.status,
                    apiResponseBody:result,
                    crmUserState:{ displayName:"",roleName:"",permissions:[] }
                });
            }
            if(!response.ok || !result || typeof result !== "object"){
                setDisplayName(firebaseUser.displayName ?? firebaseUser.email ?? "CRM User");
                setRoleId("");
                setRoleName("");
                return;
            }
            const profile = "user" in result && result.user && typeof result.user === "object"
                ? result.user as Record<string,unknown>
                : null;
            const role = "role" in result && result.role && typeof result.role === "object"
                ? result.role as Record<string,unknown>
                : null;
            const validatedPermissions = "permissions" in result
                ? validatePermissions(result.permissions)
                : null;

            setDisplayName(
                profile && typeof profile.displayName === "string" && profile.displayName
                    ? profile.displayName
                    : firebaseUser.displayName ?? firebaseUser.email ?? "CRM User"
            );
            setRoleName(typeof role?.name === "string" ? role.name : "");
            setRoleId(profile && typeof profile.roleId === "string" ? profile.roleId : "");
            setPermissions(validatedPermissions ?? []);
            if(process.env.NODE_ENV === "development"){
                console.info("[CRMUserContext] State resolved",{
                    firebaseUserUid:firebaseUser.uid,
                    apiResponseStatus:response.status,
                    apiResponseBody:result,
                    crmUserState:{
                        displayName:profile && typeof profile.displayName === "string" ? profile.displayName : "",
                        roleName:typeof role?.name === "string" ? role.name : "",
                        permissions:validatedPermissions ?? []
                    }
                });
            }
        }
        catch {
            setDisplayName(firebaseUser.displayName ?? firebaseUser.email ?? "CRM User");
            setRoleName("");
            setRoleId("");
            setPermissions([]);
        }
        finally {
            setLoading(false);
        }
    }),[]);

    const hasPermission=useCallback((permission:Permission)=>roleId === "admin" ? true : permission === "leads.create"
        ? canCreateLead(roleId,permissions,roleName)
        : userHasPermission(permissions,permission),[permissions,roleId,roleName]);
    const reportAccessDenied=useCallback(()=>setAccessDeniedMessage("You do not have permission to access this page."),[]);

    const value = useMemo<CRMUserContextValue>(()=>({
        displayName,
        roleId,
        roleName,
        permissions,
        loading,
        accessDeniedMessage,
        hasPermission,
        reportAccessDenied
    }),[displayName,roleId,roleName,permissions,loading,accessDeniedMessage,hasPermission,reportAccessDenied]);

    return <CRMUserContext.Provider value={value}>{children}</CRMUserContext.Provider>;
}

export function useCRMUser() {
    const context = useContext(CRMUserContext);
    if(!context) throw new Error("useCRMUser must be used inside CRMUserProvider");
    return context;
}
