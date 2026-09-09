import type { ImportLeadField,ImportLeadRecord } from "@/types/crm-import";

export const importLeadFields:readonly { value:ImportLeadField;label:string;aliases:string[] }[] = [
    { value:"firstName",label:"First Name",aliases:["first name","firstname","provider name","provider"] },
    { value:"lastName",label:"Last Name",aliases:["last name","lastname"] },
    { value:"email",label:"Email",aliases:["email","email address"] },
    { value:"phone",label:"Phone",aliases:["phone","phone number","telephone","mobile"] },
    { value:"organization",label:"Organization",aliases:["organization","organisation","practice","practice name","clinic"] },
    { value:"specialty",label:"Specialty",aliases:["specialty","medical specialty"] },
    { value:"monthlyClaims",label:"Monthly Claims",aliases:["monthly claims","claims","claims volume","monthly claims volume"] },
    { value:"monthlyCollections",label:"Monthly Collections",aliases:["monthly collections","collections","monthly revenue"] }
];

export function normalizeImportHeader(value:string):string {
    return value.trim().toLowerCase().replace(/[_-]+/g," ").replace(/\s+/g," ");
}

export function suggestImportField(header:string):ImportLeadField | "" {
    const normalized=normalizeImportHeader(header);
    return importLeadFields.find((field)=>field.aliases.includes(normalized))?.value ?? "";
}

export function emptyImportRecord():ImportLeadRecord {
    return { firstName:"",lastName:"",email:"",phone:"",organization:"",specialty:"",monthlyClaims:"",monthlyCollections:"" };
}

export function validateImportRecord(record:ImportLeadRecord):string[] {
    const errors:string[]=[];
    if(!record.firstName.trim()) errors.push("First Name is required");
    if(!record.organization.trim()) errors.push("Organization is required");
    if(!record.email.trim()&&!record.phone.trim()) errors.push("Email or Phone is required");
    if(record.email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email.trim())) errors.push("Email is invalid");
    for(const [label,value] of [["Monthly Claims",record.monthlyClaims],["Monthly Collections",record.monthlyCollections]] as const){
        if(String(value).trim() && !Number.isFinite(Number(String(value).replace(/[$,\s]/g,"")))) errors.push(`${label} must be numeric`);
    }
    return errors;
}
