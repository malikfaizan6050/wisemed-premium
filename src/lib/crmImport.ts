import type { ImportLeadField,ImportLeadRecord } from "@/types/crm-import";

/**
 * The columns a spreadsheet can be mapped onto.
 *
 * `aliases` drive the automatic guess on the mapping screen and are matched
 * against the normalised header, so they must be lower case with single spaces.
 * A header that matches nothing simply starts unmapped.
 */
export const importLeadFields:readonly { value:ImportLeadField;label:string;aliases:string[] }[] = [
    // Provider
    { value:"fullName",label:"Full Name (split automatically)",aliases:["dr name","doctor name","full name","name","provider name","provider","physician","physician name","contact name"] },
    { value:"firstName",label:"First Name",aliases:["first name","firstname","fname"] },
    { value:"lastName",label:"Last Name",aliases:["last name","lastname","surname","lname"] },
    { value:"specialty",label:"Specialty",aliases:["specialty","speciality","specialist","medical specialty"] },

    // Practice
    { value:"organization",label:"Organization / Clinic",aliases:["organization","organisation","practice","practice name","clinic","clinic name","facility","hospital"] },
    { value:"practiceLocation",label:"Address / Location",aliases:["address","location","practice location","street","city","full address"] },
    { value:"website",label:"Website",aliases:["website","web site","url","site","web"] },

    // Contact routes
    { value:"email",label:"Email",aliases:["email","email address","e mail"] },
    { value:"phone",label:"Phone",aliases:["phone","phone 1","phone1","phone number","telephone","mobile","primary phone","contact number"] },
    { value:"alternatePhone",label:"Phone 2 / Alternate",aliases:["phone 2","phone2","alternate phone","secondary phone","other phone","alt phone","cell"] },
    { value:"fax",label:"Fax",aliases:["fax","fax number","fax no"] },

    // Call desk
    { value:"callStatus",label:"Call Status",aliases:["call status","status of call","outcome","call outcome","disposition"] },
    { value:"callDate",label:"Date of Call",aliases:["date of call","call date","dated","date"] },
    { value:"callTime",label:"Time of Call",aliases:["time of call","call time","time"] },
    { value:"receptionistName",label:"Receptionist Name",aliases:["receptionist name","receptionist","front desk"] },
    { value:"officeManagerName",label:"Office Manager Name",aliases:["office manager name","office manager","practice manager"] },
    { value:"authorization",label:"Authorization",aliases:["authorization","authorisation","auth"] },
    { value:"faxConfirmed",label:"Faxed Number Confirmed",aliases:["faxed number confirmed","fax confirmed","fax verified"] },
    { value:"willDoctorJoin",label:"Will Doctor Join?",aliases:["will doctor join","will doctor join?","doctor joining","will join","interested"] },
    { value:"callRemarks",label:"Call Remarks",aliases:["call remarks","remarks 2","follow up remarks","call notes","comments"] },

    // Notes and follow-up
    { value:"notes",label:"Remarks / Notes",aliases:["remarks","notes","note","observation"] },
    { value:"nextAction",label:"Follow Up / Next Action",aliases:["follow up","followup","follow-up","next action","next step","action"] },
    { value:"conversationSummary",label:"Transcript / Conversation",aliases:["transcripts","transcript","conversation","conversation summary","script","call transcript"] },

    // Business figures
    { value:"monthlyClaims",label:"Monthly Claims",aliases:["monthly claims","claims","claims volume","monthly claims volume"] },
    { value:"monthlyCollections",label:"Monthly Collections",aliases:["monthly collections","collections","monthly revenue","revenue"] },

    // Bookkeeping
    { value:"sourceReference",label:"Row Reference (Ser / ID)",aliases:["ser","ser no","serial","serial no","sr","sr no","s no","id","ref","reference","#"] }
];

const importLeadFieldValues = importLeadFields.map((field)=>field.value);

export function normalizeImportHeader(value:string):string {
    return value.trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ");
}

export function suggestImportField(header:string):ImportLeadField | "" {
    const normalized=normalizeImportHeader(header);
    return importLeadFields.find((field)=>field.aliases.includes(normalized))?.value ?? "";
}

export function emptyImportRecord():ImportLeadRecord {
    return Object.fromEntries(importLeadFieldValues.map((field)=>[field,""])) as ImportLeadRecord;
}

/**
 * Splits a single name column into first and last.
 *
 * A calling list records one "Dr Name" cell, but the CRM stores the two parts
 * separately and every screen builds a display name from them. Without this the
 * whole name landed in the first-name field and every lead read "Dr. Jane
 * Smith " with an empty surname. Titles are dropped so they do not become the
 * first name; a single remaining word is treated as a surname, since that is
 * what a clinic list normally holds.
 */
const nameTitles = new Set(["dr","doctor","mr","mrs","ms","miss","prof","professor"]);

// Clinical credentials trail a provider's name in every calling list and are
// not part of it. Compared after punctuation is stripped, so "M.D.", "MD." and
// "md" are one entry.
const nameSuffixes = new Set([
    "md","do","dds","dmd","dc","dpm","od","dvm","pharmd",
    "np","pa","pac","aprn","pmhnp","fnpc","fnp","crna","rn","lvn","bsn","msn","msm","mha","mph","mba","bba","bs","ba","ms",
    "phd","edd","rd","rdn","lcsw","lpc",
    "facs","facp","facc","faap","faan","fase","fccp",
    "jr","sr","ii","iii","iv"
]);

/** Lower-cases and drops the punctuation credentials are written with. */
function nameToken(value:string) {
    return value.toLowerCase().replace(/[.,'"()-]/g,"");
}

function isDroppableNamePart(part:string) {
    const token = nameToken(part);
    return token === "" || nameTitles.has(token) || nameSuffixes.has(token);
}

export function splitFullName(value:string):{ firstName:string;lastName:string } {
    const cleaned = value.replace(/\s+/g," ").trim();
    if(!cleaned) return { firstName:"",lastName:"" };

    // A comma in a provider's name nearly always introduces credentials
    // ("Mohammad Ahmad, MD"), not a surname-first listing ("Smith, Jane").
    // Telling them apart by the comma alone read the whole name as the
    // surname. What distinguishes them is how much real name sits in front of
    // the comma: one word means surname-first, more means the comma is only
    // fencing off letters after the name.
    const [beforeComma,...afterComma] = cleaned.split(",");
    const leading = meaningfulParts(beforeComma,false);
    const trailing = meaningfulParts(afterComma.join(" "),true);

    if(leading.length === 1 && trailing.length > 0){
        return { firstName:trailing.join(" "),lastName:leading[0] };
    }

    const parts = leading.length ? [...leading,...trailing] : trailing;
    if(parts.length === 0) return { firstName:"",lastName:"" };
    // One word is a surname, which is what a clinic list usually records.
    if(parts.length === 1) return { firstName:"",lastName:parts[0] };
    return { firstName:parts[0],lastName:parts.slice(1).join(" ") };
}

/**
 * The parts of a name fragment that are actually the name: titles,
 * credentials, parenthetical nicknames and blanks removed.
 *
 * `dropInitials` applies only after a comma, where a lone letter is the tail
 * of a credential typed with a space ("PA C" for PA-C). Before the comma the
 * same letter is a middle initial and has to survive, or "Kota J, Reddy MD."
 * loses the J and then looks like a surname-first listing.
 */
function meaningfulParts(value:string,dropInitials:boolean):string[] {
    return value.split(" ")
        .filter((part)=>part.trim() && !/^\(.*\)$/.test(part.trim()))
        .filter((part)=>!isDroppableNamePart(part))
        .filter((part)=>!dropInitials || nameToken(part).length > 1);
}

/**
 * Checks one mapped row.
 *
 * A lead needs a way to be contacted and something to call it. It does not
 * need both a person and a practice: a calling list routinely holds a clinic
 * with no named doctor ("Modern Foot & Ankle") and a doctor with no listed
 * practice, and both are real leads worth working. Requiring a personal name
 * and an organization together rejected about half of a real list. Everything
 * else is optional, since such a sheet is always part-filled.
 */
export function validateImportRecord(record:ImportLeadRecord):string[] {
    const errors:string[]=[];
    // The resolved name is checked, not the raw cell. A cell holding only a
    // title ("Dr.") is non-empty but splits to nothing.
    const split = splitFullName(record.fullName ?? "");
    const firstName = record.firstName?.trim() || split.firstName;
    const lastName = record.lastName?.trim() || split.lastName;
    if(!firstName && !lastName && !record.organization.trim()) errors.push("A provider name or an organization is required");
    if(!record.email.trim()&&!record.phone.trim()) errors.push("Email or Phone is required");
    if(record.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email.trim())) errors.push("Email is invalid");
    for(const [label,value] of [["Monthly Claims",record.monthlyClaims],["Monthly Collections",record.monthlyCollections]] as const){
        if(String(value).trim() && !Number.isFinite(Number(String(value).replace(/[$,\s]/g,"")))) errors.push(`${label} must be numeric`);
    }
    return errors;
}
