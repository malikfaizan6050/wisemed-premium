import { db } from "@/lib/firebase-admin";
import { LEADS_COLLECTION } from "@/lib/crmCollections";

export function normalizeEmail(value:string) {
    return value.trim().toLowerCase();
}

export function normalizePhone(value:string) {
    return value.replace(/\D/g,"");
}

export function normalizeNpi(value:string) {
    return value.replace(/\D/g,"");
}

// Trailing company forms carry no distinguishing information, so "Mercy Clinic
// LLC" and "Mercy Clinic, Inc." must compare equal.
const organizationSuffixes = /\b(llc|l\.l\.c|inc|incorporated|corp|corporation|co|company|pllc|pc|pa|ltd|limited|group|associates|assoc|practice|clinic|center|centre|medical)\b/g;

/**
 * Normalises a practice name for comparison: case, punctuation, company
 * suffixes and spacing are all discarded. Returns "" when nothing
 * distinguishing remains, so a generic name never matches everything.
 *
 * This is the one definition. The lead importer used to carry a second,
 * different one under the same field name (`organizationNormalized`), so the
 * importer and the API disagreed about which practices were the same.
 */
export function normalizeOrganization(value:string) {
    const cleaned = value
        .toLowerCase()
        .replace(/[.,'"&()-]/g," ")
        .replace(organizationSuffixes," ")
        .replace(/\s+/g," ")
        .trim();
    return cleaned.length >= 3 ? cleaned : "";
}

interface DuplicateInput {
    email:string;
    phone:string;
    npi:string;
    organization?:string;
}

export interface DuplicateMatch {
    id:string;
    matchingFields:string[];
}

/**
 * Finds an existing lead that is the same person.
 *
 * Identity means a shared email address, phone number or NPI. The practice
 * name is reported alongside those when it also matches, but never decides a
 * duplicate on its own: normalisation strips the words that distinguish most
 * practice names, so "Valley Medical Center" and "Valley Clinic" both reduce
 * to "valley", and two physicians at one hospital are not the same lead
 * either. Rejecting on the practice name alone meant genuine enquiries were
 * dropped — silently, on the public form, which answers duplicates with a
 * success message.
 *
 * Matching runs as indexed equality queries. It used to read every document in
 * the collection on every form submission and every lead edit, so the cost of
 * accepting one lead grew with the number of leads already stored.
 */
export async function findDuplicateLead(
    input:DuplicateInput,
    excludeId?:string
):Promise<DuplicateMatch | null> {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const npi = normalizeNpi(input.npi);
    const organization = normalizeOrganization(input.organization ?? "");

    if(!email && !phone && !npi) return null;

    // Both the normalised key and the raw value are queried: leads written
    // before the normalised keys existed, and those created by the WhatsApp
    // webhook, carry only the raw field.
    const lookups:Array<{ field:string; key:string; value:string }> = [];
    if(email) lookups.push({ field:"email",key:"emailNormalized",value:email });
    if(phone) lookups.push({ field:"phone",key:"phoneNormalized",value:phone });
    if(npi) lookups.push({ field:"NPI",key:"npiNormalized",value:npi });

    const results = await Promise.all(lookups.flatMap(({ field,key,value })=>[
        db.collection(LEADS_COLLECTION).where(key,"==",value).select("organization").limit(5).get()
            .then((snapshot)=>({ field,snapshot })),
        db.collection(LEADS_COLLECTION).where(field === "NPI" ? "npi" : field,"==",value).select("organization").limit(5).get()
            .then((snapshot)=>({ field,snapshot }))
    ]));

    const matchesById = new Map<string,{ fields:Set<string>; organization:string }>();
    for(const { field,snapshot } of results){
        for(const document of snapshot.docs){
            if(document.id === excludeId) continue;
            const existing = matchesById.get(document.id) ??
                { fields:new Set<string>(),organization:String(document.data().organization ?? "") };
            existing.fields.add(field);
            matchesById.set(document.id,existing);
        }
    }

    // The lead agreeing on the most fields is the one reported, so a record
    // sharing both the email and the phone number is preferred over one that
    // happens to share only a phone number.
    const best = Array.from(matchesById.entries())
        .sort((first,second)=>second[1].fields.size-first[1].fields.size)[0];
    if(!best) return null;

    const [id,match] = best;
    const matchingFields = Array.from(match.fields);
    if(organization && normalizeOrganization(match.organization) === organization){
        matchingFields.push("practice name");
    }

    return { id,matchingFields };
}
