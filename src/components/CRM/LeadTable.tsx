"use client";


import {
  TrendingUp,
  ChevronRight,
  Building2,
  Activity,
  Flame
} from "lucide-react";


import {
  Lead
} from "@/types/crm";

import { isLeadOverdue, toLeadDate } from "@/lib/leadDates";

import { getLeadStageLabel, isLeadStage, getLeadStage } from "@/lib/leadStages";



interface Props {

  leads: Lead[];

  onSelect: (lead: Lead) => void;

}





// Colours only. The labels and the stage list itself come from lib/leadStages,
// which is the single source of truth: this file used to carry its own copy of
// both, so a stage renamed there kept its old name here, `contract_review` was
// tinted a different colour from the pipeline board, and a lead sitting in a
// retired stage showed the raw database key instead of a readable label.
const stageStyles: Record<string,string> = {

  blue:
    "bg-blue-50 text-blue-700 border-blue-100",

  indigo:
    "bg-indigo-50 text-indigo-700 border-indigo-100",

  purple:
    "bg-purple-50 text-purple-700 border-purple-100",

  cyan:
    "bg-cyan-50 text-cyan-700 border-cyan-100",

  orange:
    "bg-orange-50 text-orange-700 border-orange-100",

  amber:
    "bg-amber-50 text-amber-700 border-amber-100",

  green:
    "bg-green-50 text-green-700 border-green-100",

  emerald:
    "bg-emerald-50 text-emerald-700 border-emerald-100",

  red:
    "bg-red-50 text-red-700 border-red-100"

};


const unknownStageStyle =
  "bg-slate-100 text-slate-600 border-slate-200";


const priorityStyles: Record<string,string> = {


  critical:
    "bg-red-50 text-red-700",


  high:
    "bg-orange-50 text-orange-700",


  standard:
    "bg-slate-100 text-slate-600"

};







export default function LeadTable({

  leads,

  onSelect

}: Props) {



// overflow-x-auto plus a min-width on the rows lets the table scroll
// sideways on narrow screens instead of crushing eight columns into a
// phone's width, matching how CRMTable handles the same problem.
return (

<div
className="
mt-6
overflow-x-auto
rounded-3xl
border
border-slate-200
bg-white
shadow-sm
"
>



<div

className="
grid
grid-cols-8
min-w-[960px]
items-center
border-b
bg-slate-50
px-6
py-4
text-xs
font-semibold
uppercase
tracking-wider
text-slate-500
"

>


<div>Provider</div>

<div>Practice</div>

<div>Specialty</div>

<div>Pipeline</div>

<div>Score</div>

<div>Claims</div>

<div>Priority</div>

<div></div>


</div>






{
leads.map((lead)=>{


const status =
lead.status ?? "new_inquiry";


const priority =
lead.priority ?? "standard";


const score =
lead.opportunityScore ??
lead.leadScore ??
0;


const claims =
lead.monthlyClaims ??
lead.claimsVolume;

const overdue = isLeadOverdue(lead.dueDate,status);

const dueDate = toLeadDate(lead.dueDate);



return (

<button


key={lead.id}


onClick={()=>onSelect(lead)}


className="
group
grid
grid-cols-8
w-full
min-w-[960px]
items-center
border-b
px-6
py-5
text-left
transition-all
hover:bg-blue-50/40
"



>



{/* PROVIDER */}

<div>

<span
className="
block
font-semibold
text-slate-900
"
>

{
`${lead.firstName} ${lead.lastName}`.trim() ||
"Healthcare Provider"
}

</span>


<span
className="
mt-1
block
text-xs
text-slate-500
"
>

{lead.ownerSnapshot?.displayName ? `Owner: ${lead.ownerSnapshot.displayName}` : "Unassigned"}

</span>


</div>






{/* PRACTICE */}


<div className="text-sm font-medium text-blue-600">


<span className="flex items-center gap-2">

<Building2 size={15}/>

<span className="truncate max-w-[150px]">

{
lead.organization ||
"Medical Practice"
}

</span>

</span>

{lead.nextAction &&
<span className="mt-1 block max-w-[150px] truncate text-xs text-slate-500">
{lead.nextAction}
</span>
}


</div>






{/* SPECIALTY */}


<div
className="
text-sm
text-slate-600
"
>

{
lead.specialty ||
"General Practice"
}


</div>






{/* PIPELINE */}


<div>


<span

className={`
inline-flex
rounded-full
border
px-3
py-1
text-xs
font-semibold
${isLeadStage(status) ? stageStyles[getLeadStage(status).color] : unknownStageStyle}
`}

>


{
getLeadStageLabel(status)
}


</span>

{overdue &&
<span className="mt-1 block text-xs font-semibold text-red-600">
Overdue{dueDate ? ` · ${dueDate.toLocaleDateString()}` : ""}
</span>
}


</div>







{/* SCORE */}


<div

className="
flex
items-center
gap-2
"

>


<div>


<span

className="
block
font-bold
text-blue-600
"

>

{
score
}


</span>



<div

className="
mt-1
h-1.5
w-16
rounded-full
bg-slate-100
overflow-hidden
"

>


<div

className="
h-full
rounded-full
bg-blue-600
"

style={{

width:`${Math.max(0,Math.min(100,Number(score) || 0))}%`

}}

/>


</div>


</div>



<TrendingUp

size={15}

className="text-blue-600"

/>



</div>








{/* CLAIMS */}


<div

className="
flex
items-center
gap-2
text-sm
text-slate-600
"

>


<Activity size={15}/>


{

claims !== undefined && claims !== null
? `${claims}/mo`
: "Not added"

}



</div>









{/* PRIORITY */}


<div>


<span

className={`
inline-flex
items-center
gap-1
rounded-full
px-3
py-1
text-xs
font-semibold
${priorityStyles[priority] || priorityStyles.standard}
`

}


>



{
priority==="critical" &&
<Flame size={12}/>
}



{
priority
}



</span>


</div>









{/* ACTION */}



<div

className="
flex
justify-end
"

>


<ChevronRight

size={20}

className="
text-slate-400
transition-all
group-hover:translate-x-1
group-hover:text-blue-600
"

/>


</div>





</button>


)

})

}





{
leads.length===0 &&


<div

className="
px-6
py-12
text-center
"

>


<Activity

className="
mx-auto
text-slate-300
"

size={40}

/>


<p

className="
mt-3
text-slate-500
"

>

No healthcare providers found.

</p>


</div>


}





</div>


);


}
