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

export async function findDuplicateLead(
    input:DuplicateInput,
    excludeId?:string
) {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const npi = normalizeNpi(input.npi);
    const organization = normalizeOrganization(input.organization ?? "");

    if(!email && !phone && !npi && !organization) return null;

    const snapshot = await db
        .collection(LEADS_COLLECTION)
        .select("email","phone","npi","organization")
        .get();

    for(const document of snapshot.docs){
        if(document.id === excludeId) continue;

        const lead = document.data();
        const matchingFields:string[] = [];

        if(email && normalizeEmail(String(lead.email ?? "")) === email){
            matchingFields.push("email");
        }
        if(phone && normalizePhone(String(lead.phone ?? "")) === phone){
            matchingFields.push("phone");
        }
        if(npi && normalizeNpi(String(lead.npi ?? "")) === npi){
            matchingFields.push("NPI");
        }
        // Catches the same practice submitted with fresh contact details, which
        // the email/phone/NPI checks alone let through.
        if(organization && normalizeOrganization(String(lead.organization ?? "")) === organization){
            matchingFields.push("practice name");
        }

        if(matchingFields.length > 0){
            return {
                id:document.id,
                matchingFields
            };
        }
    }

    return null;
}
