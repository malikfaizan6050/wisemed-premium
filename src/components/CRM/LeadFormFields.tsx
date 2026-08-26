import type { LeadFormValues } from "@/lib/leadValidation";

interface Props {
    values:LeadFormValues;
    errors:Partial<Record<keyof LeadFormValues,string>>;
    onChange:(field:keyof LeadFormValues,value:string)=>void;
}

const textFields:Array<{ field:keyof LeadFormValues; placeholder:string; type?:string }> = [
    { field:"firstName",placeholder:"First Name" },
    { field:"lastName",placeholder:"Last Name" },
    { field:"email",placeholder:"Email",type:"email" },
    { field:"phone",placeholder:"Phone",type:"tel" },
    { field:"organization",placeholder:"Practice Name" },
    { field:"specialty",placeholder:"Specialty" },
    { field:"npi",placeholder:"NPI" },
    { field:"providerCount",placeholder:"Number of Providers",type:"number" },
    { field:"practiceSize",placeholder:"Practice Size" },
    { field:"monthlyClaims",placeholder:"Monthly Claims",type:"number" },
    { field:"monthlyCollections",placeholder:"Monthly Collections",type:"number" },
    { field:"ehrSystem",placeholder:"EHR System" },
    { field:"interestedService",placeholder:"Interested Service" }
];

export default function LeadFormFields({ values,errors,onChange }:Props) {
    const fieldClass = "border rounded-xl p-3";

    return (
        <>
            {textFields.slice(0,12).map(({ field,placeholder,type }) => (
                <label key={field} className="grid gap-1">
                    <input
                        type={type ?? "text"}
                        min={type === "number" ? 0 : undefined}
                        placeholder={placeholder}
                        value={values[field]}
                        onChange={(event)=>onChange(field,event.target.value)}
                        aria-invalid={Boolean(errors[field])}
                        className={fieldClass}
                    />
                    {errors[field] && <span className="text-xs text-red-600">{errors[field]}</span>}
                </label>
            ))}

            <select value={values.billingSetup} onChange={(event)=>onChange("billingSetup",event.target.value)} className={fieldClass}>
                <option value="">Billing Setup</option>
                <option value="in_house">In House</option>
                <option value="outsourced">Outsourced</option>
                <option value="hybrid">Hybrid</option>
            </select>

            {textFields.slice(12).map(({ field,placeholder }) => (
                <input key={field} placeholder={placeholder} value={values[field]} onChange={(event)=>onChange(field,event.target.value)} className={fieldClass}/>
            ))}

            <textarea placeholder="Billing Challenges" value={values.billingChallenge} onChange={(event)=>onChange("billingChallenge",event.target.value)} className={fieldClass}/>

            <select value={values.preferredContactMethod} onChange={(event)=>onChange("preferredContactMethod",event.target.value)} className={fieldClass}>
                <option value="">Preferred Contact</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
            </select>

            <textarea placeholder="CRM Notes" value={values.notes} onChange={(event)=>onChange("notes",event.target.value)} className={fieldClass}/>
        </>
    );
}
