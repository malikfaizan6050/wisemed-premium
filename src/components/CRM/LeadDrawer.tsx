"use client";

import {
    useState
} from "react";


import {
    X,
    Mail,
    Phone,
    Building2,
    ClipboardCheck,
    Activity,
    Save,
    User,
    Calendar,
    FileText,
    TrendingUp
} from "lucide-react";


import {
    Lead
} from "@/types/crm";





interface Props {

    lead: Lead | null;

    onClose: () => void;

    onUpdated?: () => void;

}






const pipelineOptions = [

    ["new_inquiry","New Inquiry"],

    ["initial_review","Initial Review"],

    ["discovery_scheduled","Discovery Scheduled"],

    ["requirements_collected","Requirements Collected"],

    ["proposal_sent","Proposal Sent"],

    ["contract_review","Contract Review"],

    ["onboarding","Onboarding"],

    ["active_client","Active Client"],

    ["lost","Lost Opportunity"]

];






const priorityOptions = [

    ["critical","Critical"],

    ["high","High"],

    ["standard","Standard"]

];







export default function LeadDrawer({

    lead,

    onClose,

    onUpdated

}:Props){



    const [notes,setNotes] = useState("");

    const [saving,setSaving] = useState(false);

    const opportunityScore =
    Number(
        lead?.opportunityScore ??
        lead?.leadScore ??
        0
    );




    if(!lead){

        return null;

    }



    const fullName =

        `${lead.firstName || ""} ${lead.lastName || ""}`.trim()
        ||
        "Healthcare Provider";



    const claims =

        lead.monthlyClaims ||

        lead.claimsVolume ||

        0;



    const revenue =

        lead.monthlyCollections ||
        lead.estimatedRevenue ||

        0;



    const conversation =

        lead.conversationSummary ||

        lead.message ||

        "No conversation summary available";



    const billing =

        lead.billingChallenge ||

        lead.challenges?.join(", ") ||

        "No billing challenges recorded";

    const updateField = async (

        field:string,

        value:any

    ) => {


        try {


            setSaving(true);



            await fetch(
                `/api/leads/${lead.id}`,
                {

                    method:"PATCH",

                    headers:{

                        "Content-Type":
                        "application/json"

                    },


                    body:JSON.stringify({

                        [field]:value

                    })

                }
            );



            if(onUpdated){

                onUpdated();

            }



        }
        catch(error){

            console.error(
                "Update failed",
                error
            );

        }
        finally{

            setSaving(false);

        }

    };





return (

<div

className="
fixed
inset-0
z-50
flex
justify-end
"

>



<div

className="
absolute
inset-0
bg-black/40
"

onClick={onClose}

/>





<aside

className="
relative
h-full
w-full
max-w-xl
overflow-y-auto
bg-white
p-6
shadow-xl
"

>



<div

className="
flex
items-center
justify-between
border-b
pb-5
"

>

<div className="flex items-center justify-between">

  <div>
    <h2
      className="
      text-xl
      font-bold
      text-slate-900
      "
    >
      {fullName}
    </h2>

    <p
      className="
      text-sm
      text-slate-500
      "
    >
      CRM Lead Profile
    </p>
  </div>


  <button
    onClick={onClose}
    className="
    rounded-full
    p-2
    hover:bg-slate-100
    "
  >
    <X size={20}/>
  </button>

</div>

</div>



{/* PIPELINE */}


<div className="mt-6">


<label

className="
text-xs
font-semibold
text-slate-500
uppercase
"

>

RCM Pipeline

</label>



<select

value={lead.status}

onChange={(e)=>

updateField(
"status",
e.target.value
)

}

className="
mt-2
w-full
rounded-xl
border
px-4
py-3
"

>


{
pipelineOptions.map((item)=>(

<option

key={item[0]}

value={item[0]}

>

{item[1]}

</option>


))

}


</select>


</div>





{/* PRIORITY */}


<div className="mt-5">


<label

className="
text-xs
font-semibold
text-slate-500
uppercase
"

>

Opportunity Priority

</label>




<select

value={lead.priority}

onChange={(e)=>

updateField(
"priority",
e.target.value
)

}

className="
mt-2
w-full
rounded-xl
border
px-4
py-3
"

>


{
priorityOptions.map((item)=>(


<option

key={item[0]}

value={item[0]}

>

{item[1]}

</option>


))

}


</select>


</div>

{/* SCORE CARD */}

<div

className="
mt-6
rounded-3xl
border
border-blue-100
bg-blue-50
p-5
"

>


<div

className="
flex
items-center
justify-between
"

>


<div>

<p

className="
text-sm
font-medium
text-slate-500
"

>

RCM Opportunity Score

</p>


<div

className="
mt-2
flex
items-end
gap-2
"

>


<span

className="
text-5xl
font-bold
text-blue-600
"

>

{
opportunityScore
}

</span>


<span

className="
mb-2
text-slate-500
"

>

/100

</span>


</div>


</div>


<div

className="
rounded-2xl
bg-blue-600
p-4
text-white
"

>

<TrendingUp size={28}/>

</div>


</div>



<div

className="
mt-5
h-2
overflow-hidden
rounded-full
bg-white
"

>


<div

className="
h-full
rounded-full
bg-blue-600
"

style={{

width:`${opportunityScore}%`

}}

/>


</div>


</div>








{/* PROVIDER INFORMATION */}


<div className="mt-8">


<h3

className="
mb-4
flex
items-center
gap-2
font-bold
text-slate-900
"

>

<User size={18}/>

Provider Information

</h3>



<div

className="
space-y-3
rounded-3xl
bg-slate-50
p-5
"

>


<div

className="
flex
items-center
gap-3
text-sm
text-slate-700
"

>

<Mail size={17}/>

{

lead.email ||

"No email"

}


</div>




<div

className="
flex
items-center
gap-3
text-sm
text-slate-700
"

>

<Phone size={17}/>

{

lead.phone ||

"No phone"

}


</div>





<div

className="
flex
items-center
gap-3
text-sm
text-slate-700
"

>

<Building2 size={17}/>


{

lead.organization ||

"Medical Practice"

}


</div>





<div

className="
flex
items-center
gap-3
text-sm
text-slate-700
"

>

<ClipboardCheck size={17}/>


NPI:

{

lead.npi ||

"Not provided"

}


</div>



</div>


</div>

{/* PRACTICE INTELLIGENCE */}


<div className="mt-8">


<h3

className="
mb-4
flex
items-center
gap-2
font-bold
text-slate-900
"

>

<Activity size={18}/>

Practice Intelligence

</h3>





<div

className="
grid
grid-cols-2
gap-4
"

>


<div

className="
rounded-3xl
border
bg-white
p-5
"

>


<p

className="
text-xs
text-slate-500
"

>

Monthly Claims

</p>


<p

className="
mt-2
font-bold
text-slate-900
"

>

{

claims

?

`${claims} claims`

:

"Not provided"

}

</p>


</div>





<div

className="
rounded-3xl
border
bg-white
p-5
"

>


<p

className="
text-xs
text-slate-500
"

>

Estimated Revenue

</p>


<p

className="
mt-2
font-bold
text-slate-900
"

>

{

revenue

?

`$${revenue}`

:

"Not provided"

}

</p>


</div>




</div>


</div>








{/* BILLING INFORMATION */}



<div className="mt-8">


<h3

className="
mb-4
flex
items-center
gap-2
font-bold
text-slate-900
"

>


<FileText size={18}/>

Billing Information

</h3>





<div

className="
space-y-4
rounded-3xl
bg-slate-50
p-5
"

>



<div>

<p

className="
text-xs
font-semibold
uppercase
text-slate-500
"

>

Current Billing Method

</p>


<p

className="
mt-1
text-sm
font-medium
text-slate-800
"

>

{

lead.billingSetup ||
"Unknown"

}

</p>


</div>






<div>

<p

className="
text-xs
font-semibold
uppercase
text-slate-500
"

>

EHR System

</p>


<p

className="
mt-1
text-sm
font-medium
text-slate-800
"

>

{

lead.ehrSystem ||

"Not provided"

}

</p>


</div>






<div>

<p

className="
text-xs
font-semibold
uppercase
text-slate-500
"

>

Billing Challenges

</p>


<p

className="
mt-1
text-sm
font-medium
text-slate-800
"

>

{

billing

}

</p>


</div>




</div>


</div>

{/* ============================
    AI CONVERSATION
============================ */}


<div className="mt-8">


<h3

className="
mb-4
flex
items-center
gap-2
font-bold
text-slate-900
"

>

<Mail size={18}/>

AI Conversation Summary

</h3>



<div

className="
rounded-3xl
bg-slate-50
p-5
text-sm
leading-relaxed
text-slate-700
"

>

{conversation}

</div>


</div>







{/* ============================
    Notes
============================ */}



<div className="mt-8">


<h3

className="
mb-4
flex
items-center
gap-2
font-bold
text-slate-900
"

>

<FileText size={18}/>

CRM Notes

</h3>



<textarea


value={notes || lead.notes || ""}


onChange={(e)=>

setNotes(e.target.value)

}


placeholder="Add sales notes..."

className="
min-h-[120px]
w-full
rounded-3xl
border
p-4
text-sm
outline-none
focus:ring-2
focus:ring-blue-500
"

/>



<button


onClick={()=>


updateField(

"notes",

notes

)


}


disabled={saving}


className="
mt-4
flex
items-center
justify-center
gap-2
rounded-xl
bg-blue-600
px-5
py-3
font-semibold
text-white
disabled:opacity-50
"

>


<Save size={17}/>


{

saving

?

"Saving..."

:

"Save Notes"

}


</button>



</div>


{/* RECENT ACTIVITY */}

<div
  className="
  rounded-xl
  bg-slate-50
  p-4
  text-sm
  text-slate-500
  "
>
  No activity recorded yet.
</div>

</aside>

</div>

);

}
