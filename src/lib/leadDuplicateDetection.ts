import { db } from "@/lib/firebase-admin";

export function normalizeEmail(value:string) {
    return value.trim().toLowerCase();
}

export function normalizePhone(value:string) {
    return value.replace(/\D/g,"");
}

export function normalizeNpi(value:string) {
    return value.replace(/\D/g,"");
}

interface DuplicateInput {
    email:string;
    phone:string;
    npi:string;
}

export async function findDuplicateLead(
    input:DuplicateInput,
    excludeId?:string
) {
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    const npi = normalizeNpi(input.npi);

    if(!email && !phone && !npi) return null;

    const snapshot = await db
        .collection("crm_leads")
        .select("email","phone","npi")
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

        if(matchingFields.length > 0){
            return {
                id:document.id,
                matchingFields
            };
        }
    }

    return null;
}
