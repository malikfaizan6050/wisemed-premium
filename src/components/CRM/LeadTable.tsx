"use client";


import {
  TrendingUp,
  ChevronRight,
  Building2,
  Activity,
  DollarSign,
  Flame
} from "lucide-react";


import {
  Lead
} from "@/types/crm";



interface Props {

  leads:Lead[];

  onSelect:(lead:Lead)=>void;

}




const stageLabels:any={


new_inquiry:
"New Inquiry",


initial_review:
"Initial Review",


discovery_scheduled:
"Discovery Scheduled",


requirements_collected:
"Requirements Collected",


proposal_sent:
"Proposal Sent",


contract_review:
"Contract Review",


onboarding:
"Onboarding",


active_client:
"Active Client",


lost:
"Lost Opportunity"


};





const stageStyles:any={


new_inquiry:
"bg-blue-50 text-blue-700 border-blue-100",


initial_review:
"bg-indigo-50 text-indigo-700 border-indigo-100",


discovery_scheduled:
"bg-purple-50 text-purple-700 border-purple-100",


requirements_collected:
"bg-cyan-50 text-cyan-700 border-cyan-100",


proposal_sent:
"bg-orange-50 text-orange-700 border-orange-100",


contract_review:
"bg-yellow-50 text-yellow-700 border-yellow-100",


onboarding:
"bg-green-50 text-green-700 border-green-100",


active_client:
"bg-emerald-50 text-emerald-700 border-emerald-100",


lost:
"bg-red-50 text-red-700 border-red-100"


};






const priorityStyles:any={


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

}:Props){



return (


<div

className="
mt-6
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
shadow-sm
"

>


{/* HEADER */}



<div

className="
grid
grid-cols-7
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


<div>
Provider
</div>


<div>
Practice
</div>


<div>
Specialty
</div>


<div>
Pipeline
</div>


<div>
Score
</div>


<div>
Claims
</div>


<div>
Priority
</div>


<div></div>


</div>







{
leads.map((lead)=>(


<button


key={lead.id}


onClick={()=>onSelect(lead)}


className="

group

grid

grid-cols-7

w-full

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


<p

className="
font-semibold
text-slate-900
"

>

{lead.firstName} {lead.lastName}

</p>


<p

className="
mt-1
text-xs
text-slate-500
"

>

Healthcare Provider

</p>


</div>







{/* PRACTICE */}



<div

className="
flex
items-center
gap-2
text-sm
font-medium
text-blue-600
"

>


<Building2 size={15}/>


<span className="truncate max-w-[150px]">

{
lead.organization || 
"Medical Practice"
}

</span>


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

${stageStyles[lead.status]}

`}

>

{
stageLabels[lead.status] ||
lead.status
}

</span>


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


<p

className="
font-bold
text-blue-600
"

>

{
lead.leadScore
}

</p>


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
width:`${lead.leadScore}%`
}}

/>


</div>


</div>




<TrendingUp

size={15}

className="
text-blue-600
"

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

lead.monthlyClaims

?

`${lead.monthlyClaims}/mo`

:

lead.claimsVolume

?

`${lead.claimsVolume}/mo`

:

"Not added"

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

${priorityStyles[lead.priority]}

`}

>


{
lead.priority==="critical" &&
<Flame size={12}/>
}


{
lead.priority
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


))

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