import type { Lead } from "@/types/crm";

export interface LeadFormValues {
    firstName:string;
    lastName:string;
    email:string;
    phone:string;
    organization:string;
    specialty:string;
    npi:string;
    monthlyClaims:string;
    monthlyCollections:string;
    providerCount:string;
    practiceSize:string;
    ehrSystem:string;
    billingSetup:string;
    billingChallenge:string;
    interestedService:string;
    preferredContactMethod:string;
    notes:string;
}

export interface ValidationResult<T> {
    success:boolean;
    data:T;
    errors:Partial<Record<keyof T,string>>;
}

export function createLeadFormValues(lead?:Lead | null):LeadFormValues {
    return {
        firstName:lead?.firstName ?? "",
        lastName:lead?.lastName ?? "",
        email:lead?.email ?? "",
        phone:lead?.phone ?? "",
        organization:lead?.organization ?? "",
        specialty:lead?.specialty ?? "",
        npi:lead?.npi ?? "",
        monthlyClaims:String(lead?.monthlyClaims ?? lead?.claimsVolume ?? ""),
        monthlyCollections:String(lead?.monthlyCollections ?? lead?.estimatedRevenue ?? ""),
        providerCount:String(lead?.providerCount ?? ""),
        practiceSize:lead?.practiceSize ?? "",
        ehrSystem:lead?.ehrSystem ?? "",
        billingSetup:lead?.billingSetup ?? lead?.currentBillingMethod ?? "",
        billingChallenge:lead?.billingChallenge ?? lead?.challenges?.join(", ") ?? "",
        interestedService:lead?.interestedService ?? "",
        preferredContactMethod:lead?.preferredContactMethod ?? "",
        notes:lead?.notes ?? ""
    };
}

export const leadFormSchema = {
    validate(values:LeadFormValues):ValidationResult<LeadFormValues> {
        const data = Object.fromEntries(
            Object.entries(values).map(([key,value]) => [key,value.trim()])
        ) as unknown as LeadFormValues;
        const errors:Partial<Record<keyof LeadFormValues,string>> = {};

        const contactError = getLeadContactError(data);
        if(contactError){
            errors.email = contactError;
            errors.phone = contactError;
        }

        return { success:Object.keys(errors).length === 0,data,errors };
    }
};

export function getLeadContactError(values:{ email?:string; phone?:string }) {
    return values.email?.trim() || values.phone?.trim()
        ? ""
        : "Email or phone is required";
}

export function getResponseError(result:unknown,fallback:string) {
    return result && typeof result === "object" && "error" in result &&
        typeof result.error === "string" ? result.error : fallback;
}
