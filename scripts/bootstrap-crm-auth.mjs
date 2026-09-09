// Run: node --env-file=.env.local scripts/bootstrap-crm-auth.mjs
// Optional initial admin assignment: add --email=admin@example.com
import { cert,initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue,getFirestore } from "firebase-admin/firestore";

for(const name of ["FIREBASE_ADMIN_PROJECT_ID","FIREBASE_ADMIN_CLIENT_EMAIL","FIREBASE_ADMIN_PRIVATE_KEY"]){
    if(!process.env[name]) throw new Error(`Missing ${name}`);
}

initializeApp({ credential:cert({
    projectId:process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail:process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey:process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g,"\n")
}) });

const firestore=getFirestore();
const now=FieldValue.serverTimestamp();
const systemRoles=[
    {
        id:"admin",name:"Administrator",description:"Full CRM administration access",
        permissions:["roles.read","roles.manage","users.read","users.manage","leads.read.all","leads.read.owned","leads.create","leads.update.all","leads.update.owned","leads.assign","activities.read.all","activities.read.own","analytics.read","import_leads"]
    },
    {
        id:"sales_manager",name:"Sales Manager",description:"Sales team and pipeline management access",
        permissions:["users.read","leads.read.all","leads.read.owned","leads.create","leads.update.all","leads.update.owned","leads.assign","activities.read.all","activities.read.own","analytics.read"]
    },
    {
        id:"sales",name:"Salesperson",description:"Ownership-scoped CRM sales access",
        permissions:["leads.read.owned","leads.update.owned","activities.read.own"]
    }
];

await firestore.runTransaction(async(transaction)=>{
    const references=systemRoles.map((definition)=>firestore.collection("roles").doc(definition.id));
    const snapshots=await Promise.all(references.map((reference)=>transaction.get(reference)));
    systemRoles.forEach((definition,index)=>{
        const reference=references[index];
        const snapshot=snapshots[index];
        const existing=snapshot.data()??{};
        transaction.set(reference,{
            ...existing,
            name:definition.name,
            description:definition.description,
            permissions:definition.permissions,
            isSystemRole:true,
            status:"active",
            createdById:typeof existing.createdById==="string"?existing.createdById:"system",
            updatedById:"system",
            createdAt:existing.createdAt??now,
            updatedAt:now
        });
    });
});

const emailArgument=process.argv.find((argument)=>argument.startsWith("--email="));
const email=emailArgument?.slice("--email=".length).trim();
if(email){
    const firebaseUser=await getAuth().getUserByEmail(email);
    const userReference=firestore.collection("users").doc(firebaseUser.uid);
    const userSnapshot=await userReference.get();
    const existing=userSnapshot.data()??{};
    await userReference.set({
        ...existing,
        email:firebaseUser.email??email,
        displayName:existing.displayName??firebaseUser.displayName??firebaseUser.email?.split("@")[0]??"Administrator",
        phone:existing.phone??firebaseUser.phoneNumber??"",
        jobTitle:existing.jobTitle??"Administrator",
        roleId:"admin",teamId:existing.teamId??null,managerId:existing.managerId??null,status:"active",
        createdAt:existing.createdAt??now,createdById:existing.createdById??"system",updatedAt:now,lastLoginAt:existing.lastLoginAt??null
    },{ merge:true });
}

const verifiedRoles=await Promise.all(systemRoles.map(async(definition)=>{
    const snapshot=await firestore.collection("roles").doc(definition.id).get();
    const data=snapshot.data();
    return { id:definition.id,exists:snapshot.exists,isSystemRole:data?.isSystemRole===true,status:data?.status,permissions:data?.permissions??[] };
}));
console.log("CRM system roles created or updated successfully.");
console.log(JSON.stringify(verifiedRoles,null,2));
