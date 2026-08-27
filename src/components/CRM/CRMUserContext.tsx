"use client";

import { createContext,useContext,useEffect,useMemo,useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc,getDoc } from "firebase/firestore";
import { auth,db } from "@/lib/firebase";
import { validatePermissions,type Permission } from "@/lib/permissions";

interface CRMUserContextValue {
    displayName:string;
    roleName:string;
    permissions:Permission[];
    loading:boolean;
    hasPermission:(permission:Permission)=>boolean;
}

const CRMUserContext = createContext<CRMUserContextValue | null>(null);

export function CRMUserProvider({ children }:{ children:React.ReactNode }) {
    const [displayName,setDisplayName] = useState("");
    const [roleName,setRoleName] = useState("");
    const [permissions,setPermissions] = useState<Permission[]>([]);
    const [loading,setLoading] = useState(true);

    useEffect(()=>onAuthStateChanged(auth,async(firebaseUser)=>{
        setLoading(true);
        setPermissions([]);

        if(!firebaseUser){
            setDisplayName("");
            setRoleName("");
            setLoading(false);
            return;
        }

        try {
            const profileSnapshot = await getDoc(doc(db,"users",firebaseUser.uid));
            const profile = profileSnapshot.data();
            if(!profile || profile.status !== "active" || typeof profile.roleId !== "string"){
                setDisplayName(firebaseUser.displayName ?? firebaseUser.email ?? "CRM User");
                setRoleName("");
                return;
            }

            const roleSnapshot = await getDoc(doc(db,"roles",profile.roleId));
            const role = roleSnapshot.data();
            const validatedPermissions = role?.status === "active"
                ? validatePermissions(role.permissions)
                : null;

            setDisplayName(
                typeof profile.displayName === "string" && profile.displayName
                    ? profile.displayName
                    : firebaseUser.displayName ?? firebaseUser.email ?? "CRM User"
            );
            setRoleName(typeof role?.name === "string" ? role.name : "");
            setPermissions(validatedPermissions ?? []);
        }
        catch {
            setDisplayName(firebaseUser.displayName ?? firebaseUser.email ?? "CRM User");
            setRoleName("");
            setPermissions([]);
        }
        finally {
            setLoading(false);
        }
    }),[]);

    const value = useMemo<CRMUserContextValue>(()=>({
        displayName,
        roleName,
        permissions,
        loading,
        hasPermission:(permission)=>permissions.includes(permission)
    }),[displayName,roleName,permissions,loading]);

    return <CRMUserContext.Provider value={value}>{children}</CRMUserContext.Provider>;
}

export function useCRMUser() {
    const context = useContext(CRMUserContext);
    if(!context) throw new Error("useCRMUser must be used inside CRMUserProvider");
    return context;
}
