import { cert,initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue,getFirestore } from "firebase-admin/firestore";

const emailArgument = process.argv.find((argument)=>argument.startsWith("--email="));
const email = emailArgument?.slice("--email=".length).trim();

if(!email){
    throw new Error("Usage: node --env-file=.env.local scripts/bootstrap-crm-auth.mjs --email=admin@example.com");
}

for(const name of ["FIREBASE_ADMIN_PROJECT_ID","FIREBASE_ADMIN_CLIENT_EMAIL","FIREBASE_ADMIN_PRIVATE_KEY"]){
    if(!process.env[name]) throw new Error(`Missing ${name}`);
}

initializeApp({
    credential:cert({
        projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey:process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g,"\n")
    })
});

const admin = getAuth();
const firestore = getFirestore();
const firebaseUser = await admin.getUserByEmail(email);
const now = FieldValue.serverTimestamp();
const allPermissions = [
    "leads.read.all","leads.read.owned","leads.create","leads.update.all",
    "leads.update.owned","leads.assign","users.read","users.manage",
    "roles.read","roles.manage","activities.read.all","activities.read.own",
    "system.migrate","system.diagnostics"
];
const salesPermissions = [
    "leads.read.all","leads.create","leads.update.all","leads.assign",
    "activities.read.own"
];

await firestore.runTransaction(async(transaction)=>{
    const adminRoleRef = firestore.collection("roles").doc("admin");
    const salesRoleRef = firestore.collection("roles").doc("sales");
    const userRef = firestore.collection("users").doc(firebaseUser.uid);
    const [adminRole,salesRole,userProfile] = await Promise.all([
        transaction.get(adminRoleRef),
        transaction.get(salesRoleRef),
        transaction.get(userRef)
    ]);

    transaction.set(adminRoleRef,{
        name:"Administrator",
        description:"Full CRM administration access",
        permissions:allPermissions,
        isSystemRole:true,
        status:"active",
        createdById:"system",
        updatedById:"system",
        createdAt:adminRole.exists ? adminRole.data()?.createdAt ?? now : now,
        updatedAt:now
    });
    transaction.set(salesRoleRef,{
        name:"Sales",
        description:"CRM lead management access",
        permissions:salesPermissions,
        isSystemRole:true,
        status:"active",
        createdById:"system",
        updatedById:"system",
        createdAt:salesRole.exists ? salesRole.data()?.createdAt ?? now : now,
        updatedAt:now
    });
    transaction.set(userRef,{
        email:firebaseUser.email ?? email,
        displayName:firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "Administrator",
        phone:firebaseUser.phoneNumber ?? "",
        jobTitle:"Administrator",
        roleId:"admin",
        teamId:null,
        managerId:null,
        status:"active",
        createdAt:userProfile.exists ? userProfile.data()?.createdAt ?? now : now,
        createdById:userProfile.exists ? userProfile.data()?.createdById ?? "system" : "system",
        updatedAt:now,
        lastLoginAt:null
    });
});

console.log("CRM roles and initial administrator profile created successfully.");
