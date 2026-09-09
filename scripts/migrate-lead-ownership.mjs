// Dry run:
// node --env-file=.env.local scripts/migrate-lead-ownership.mjs
// Apply migration:
// node --env-file=.env.local scripts/migrate-lead-ownership.mjs --commit

import { cert,initializeApp } from "firebase-admin/app";
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
const commit=process.argv.includes("--commit");
const normalize=(value)=>typeof value==="string"?value.trim().toLowerCase():"";

function canOwnLeads(role){
    if(!role||role.status!=="active"||role.id==="admin") return false;
    if(role.id==="sales"||role.id==="sales_manager") return true;
    if(role.isSystemRole===true) return false;
    return Array.isArray(role.permissions)&&role.permissions.some((permission)=>
        permission==="leads.read.owned"||permission==="leads.update.owned"
    );
}

const [leadSnapshot,userSnapshot,roleSnapshot]=await Promise.all([
    firestore.collection("crm_leads").get(),
    firestore.collection("users").get(),
    firestore.collection("roles").get()
]);

const roles=new Map(roleSnapshot.docs.map((document)=>[
    document.id,{ id:document.id,...document.data() }
]));
const owners=new Map();
const legacyMatches=new Map();

for(const document of userSnapshot.docs){
    const data=document.data();
    const role=roles.get(data.roleId);
    if(data.status!=="active"||!canOwnLeads(role)) continue;
    const owner={
        uid:document.id,
        displayName:typeof data.displayName==="string"?data.displayName.trim():"",
        email:typeof data.email==="string"?data.email.trim():""
    };
    owners.set(document.id,owner);
    for(const key of [normalize(owner.displayName),normalize(owner.email)].filter(Boolean)){
        const matches=legacyMatches.get(key)??[];
        matches.push(owner);
        legacyMatches.set(key,matches);
    }
}

const updates=[];
const summary={ total:leadSnapshot.size,alreadyOwned:0,matchedLegacyOwner:0,unassigned:0,invalidExistingOwner:0,ambiguousLegacyOwner:0,updated:0 };

for(const document of leadSnapshot.docs){
    const lead=document.data();
    const existingOwner=typeof lead.ownerId==="string"?owners.get(lead.ownerId):undefined;
    let owner=existingOwner;

    if(existingOwner){
        summary.alreadyOwned+=1;
    }
    else {
        if(typeof lead.ownerId==="string"&&lead.ownerId) summary.invalidExistingOwner+=1;
        const legacyKey=normalize(lead.assignedTo);
        const matches=legacyKey?legacyMatches.get(legacyKey)??[]:[];
        if(matches.length===1){
            owner=matches[0];
            summary.matchedLegacyOwner+=1;
        }
        else {
            if(matches.length>1) summary.ambiguousLegacyOwner+=1;
            summary.unassigned+=1;
        }
    }

    const ownership={
        ownerId:owner?.uid??null,
        ownerSnapshot:owner?{ displayName:owner.displayName,email:owner.email }:null,
        assignedTo:owner?.displayName??null,
        assignedById:owner?(typeof lead.assignedById==="string"?lead.assignedById:"system:ownership-migration"):null,
        assignedAt:owner?(lead.assignedAt??lead.updatedAt??lead.createdAt??FieldValue.serverTimestamp()):null
    };
    const snapshotMatches=lead.ownerSnapshot?.displayName===ownership.ownerSnapshot?.displayName&&
        lead.ownerSnapshot?.email===ownership.ownerSnapshot?.email;
    const alreadyNormalized=lead.ownerId===ownership.ownerId&&lead.assignedTo===ownership.assignedTo&&
        lead.assignedById===ownership.assignedById&&snapshotMatches&&
        ((ownership.assignedAt===null&&lead.assignedAt==null)||ownership.assignedAt===lead.assignedAt);
    if(!alreadyNormalized) updates.push({ reference:document.ref,ownership });
}

summary.updated=updates.length;
console.log(`${commit?"Applying":"Dry-running"} lead ownership migration.`);
console.log(JSON.stringify(summary,null,2));

if(commit){
    for(let index=0;index<updates.length;index+=450){
        const batch=firestore.batch();
        updates.slice(index,index+450).forEach(({ reference,ownership })=>batch.update(reference,ownership));
        await batch.commit();
    }
    console.log("Lead ownership migration completed successfully.");
}
else {
    console.log("No data was changed. Re-run with --commit after reviewing the summary.");
}
