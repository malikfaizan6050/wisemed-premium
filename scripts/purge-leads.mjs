// Removes every CRM lead, after writing a local backup.
//
// Intended for clearing seed or demo data before a real import. It is a hard
// delete, not the recoverable soft delete the CRM's own Delete button performs,
// so the backup is written first and the script refuses to delete without
// --confirm.
//
//   Dry run (default, changes nothing, lists what would go):
//     node --env-file=.env.local scripts/purge-leads.mjs
//
//   Delete for real:
//     node --env-file=.env.local scripts/purge-leads.mjs --confirm
//
//   Keep leads that came from the live website, delete the rest:
//     node --env-file=.env.local scripts/purge-leads.mjs --confirm --keep-source=website
//
// The backup lands in ./lead-backups/ as JSON. Restoring is a manual job, so
// keep it somewhere safe until the new data is verified.
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { mkdir, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const confirmed = args.includes("--confirm");
const alsoDeleted = args.includes("--include-soft-deleted");
const keepSources = args
    .filter((argument) => argument.startsWith("--keep-source="))
    .map((argument) => argument.slice("--keep-source=".length).trim())
    .filter(Boolean);

for (const name of ["FIREBASE_ADMIN_PROJECT_ID", "FIREBASE_ADMIN_CLIENT_EMAIL", "FIREBASE_ADMIN_PRIVATE_KEY"]) {
    if (!process.env[name]) throw new Error(`Missing ${name}`);
}

initializeApp({
    credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\n/g, "\n")
    })
});

const db = getFirestore();
const project = process.env.FIREBASE_ADMIN_PROJECT_ID;
console.log(`Project: ${project}`);
console.log(confirmed ? "Mode:    DELETE\n" : "Mode:    dry run, nothing will be changed\n");

function leadDate(value) {
    if (value?.toDate) return value.toDate();
    if (value instanceof Date) return value;
    return null;
}

const snapshot = await db.collection("crm_leads").get();
if (snapshot.empty) {
    console.log("crm_leads is already empty. Nothing to do.");
    process.exit(0);
}

const all = snapshot.docs.map((document) => ({ id: document.id, data: document.data() }));
const doomed = all.filter(({ data }) => !keepSources.includes(String(data.source ?? "")));
const spared = all.length - doomed.length;

// Printed so the collection can be eyeballed before anything is destroyed. If a
// row here looks like a genuine enquiry, stop: the public site is live and has
// been accepting real consultation submissions.
const bySource = new Map();
for (const { data } of all) {
    const source = String(data.source ?? "(none)");
    bySource.set(source, (bySource.get(source) ?? 0) + 1);
}
console.log(`crm_leads holds ${all.length} lead(s).`);
console.log("By source:");
for (const [source, count] of [...bySource].sort((a, b) => b[1] - a[1])) {
    const kept = keepSources.includes(source) ? "  <- kept" : "";
    console.log(`  ${String(count).padStart(5)}  ${source}${kept}`);
}

console.log("\nLeads in scope (newest first):");
const rows = doomed
    .map(({ id, data }) => ({
        id,
        when: leadDate(data.createdAt)?.toISOString().slice(0, 10) ?? "??????????",
        who: `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || "(no name)",
        org: String(data.organization ?? ""),
        email: String(data.email ?? ""),
        source: String(data.source ?? "")
    }))
    .sort((first, second) => second.when.localeCompare(first.when));
for (const row of rows) {
    console.log(`  ${row.when}  ${row.source.padEnd(11)}  ${row.who.padEnd(22)}  ${row.org.padEnd(24)}  ${row.email}`);
}

if (spared) console.log(`\n${spared} lead(s) kept by --keep-source.`);
if (!doomed.length) {
    console.log("\nNothing in scope. Nothing to do.");
    process.exit(0);
}

// Notifications and audit entries point at leads by id, so anything left behind
// would reference a record that no longer exists. Counted here and removed with
// the leads, so the new import starts against a clean audit trail.
const doomedIds = new Set(doomed.map(({ id }) => id));
const orphans = [];
for (const collection of ["notifications", "employee_activities"]) {
    const related = await db.collection(collection).get();
    for (const document of related.docs) {
        const data = document.data();
        const target = typeof data.leadId === "string" ? data.leadId
            : data.entityType === "lead" && typeof data.entityId === "string" ? data.entityId
            : null;
        if (target && doomedIds.has(target)) orphans.push(document.ref);
    }
}
console.log(`\nRelated records pointing at those leads: ${orphans.length}`);

let softDeleted = [];
if (alsoDeleted) {
    const archive = await db.collection("crm_leads_deleted").get();
    softDeleted = archive.docs.map((document) => ({ id: document.id, data: document.data() }));
    console.log(`Soft-deleted archive (crm_leads_deleted): ${softDeleted.length}`);
}

await mkdir("lead-backups", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = `lead-backups/crm_leads-${stamp}.json`;
await writeFile(backupPath, JSON.stringify({
    project,
    exportedAt: new Date().toISOString(),
    crm_leads: doomed,
    crm_leads_deleted: softDeleted
}, null, 2), "utf8");
console.log(`\nBackup written: ${backupPath}`);

if (!confirmed) {
    console.log("\nDry run. Re-run with --confirm to delete.");
    process.exit(0);
}

// Chunked: Firestore rejects a batch of more than 500 operations.
async function deleteRefs(refs, label) {
    let done = 0;
    for (let index = 0; index < refs.length; index += 450) {
        const batch = db.batch();
        for (const ref of refs.slice(index, index + 450)) batch.delete(ref);
        await batch.commit();
        done += Math.min(450, refs.length - index);
    }
    if (refs.length) console.log(`Deleted ${done} ${label}.`);
}

await deleteRefs(doomed.map(({ id }) => db.collection("crm_leads").doc(id)), "lead(s)");
await deleteRefs(orphans, "related notification/activity record(s)");
if (alsoDeleted) await deleteRefs(softDeleted.map(({ id }) => db.collection("crm_leads_deleted").doc(id)), "archived lead(s)");

const remaining = await db.collection("crm_leads").get();
console.log(`\nDone. crm_leads now holds ${remaining.size} lead(s).`);
console.log(`Backup kept at ${backupPath} - keep it until the new import is verified.`);
