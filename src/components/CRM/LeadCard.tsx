"use client";


import {
  TrendingUp,
  ArrowRight,
  Building2,
  Activity
} from "lucide-react";


import {
  Lead
} from "@/types/crm";



interface Props {

  lead:Lead;

  onClick?:()=>void;

}




const statusStyles:any = {


  new_inquiry:
  "bg-blue-50 text-blue-700",


  initial_review:
  "bg-indigo-50 text-indigo-700",


  discovery_scheduled:
  "bg-purple-50 text-purple-700",


  requirements_collected:
  "bg-cyan-50 text-cyan-700",


  proposal_sent:
  "bg-orange-50 text-orange-700",


  contract_review:
  "bg-yellow-50 text-yellow-700",


  onboarding:
  "bg-green-50 text-green-700",


  active_client:
  "bg-emerald-50 text-emerald-700",


  lost:
  "bg-slate-100 text-slate-600"


};



const priorityStyles:any={


critical:
"bg-red-50 text-red-700",


high:
"bg-orange-50 text-orange-700",


standard:
"bg-slate-100 text-slate-600"


};







export default function LeadCard({

lead,
onClick

}:Props){



return (


<div


onClick={onClick}


className="

group

cursor-pointer

rounded-3xl

border

border-slate-200

bg-white

p-6

transition-all

duration-300

hover:border-blue-200

hover:shadow-xl

hover:-translate-y-1

"


>






{/* TOP SECTION */}


<div

className="
flex
items-start
justify-between
gap-4
"

>


<div>


<div

className="
flex
items-center
gap-2
"

>


<h3

className="
text-lg
font-bold
text-slate-900
"

>

{lead.firstName} {lead.lastName}

</h3>


</div>




<p

className="
mt-1
flex
items-center
gap-2
text-sm
font-medium
text-blue-600
"

>


<Building2 size={15}/>


{lead.organization}


</p>


</div>







<div

className="
flex
gap-2
"

>


<span

className={`
rounded-full
px-3
py-1
text-xs
font-semibold
${statusStyles[lead.status]}
`}

>


{
lead.status
.replaceAll("_"," ")
}


</span>





<span

className={`
rounded-full
px-3
py-1
text-xs
font-semibold
${priorityStyles[lead.priority]}
`}

>


{lead.priority}


</span>



</div>



</div>









{/* CRM INFORMATION */}


<div

className="
mt-6
grid
grid-cols-3
gap-4
"

>


<div>


<p

className="
text-xs
uppercase
tracking-wide
text-slate-400
"

>

Specialty

</p>


<p

className="
mt-1
text-sm
font-semibold
text-slate-700
"

>

{lead.specialty || "Medical Practice"}

</p>


</div>







<div>


<p

className="
text-xs
uppercase
tracking-wide
text-slate-400
"

>

Claims

</p>



<p

className="
mt-1
text-sm
font-semibold
text-slate-700
"

>


{
lead.monthlyClaims || "-"
}


</p>


</div>








<div>


<p

className="
text-xs
uppercase
tracking-wide
text-slate-400
"

>

Opportunity

</p>



<p

className="
mt-1
flex
items-center
gap-1
text-sm
font-semibold
text-blue-600
"

>


{lead.leadScore}



<TrendingUp size={14}/>


</p>


</div>




</div>









{/* SCORE BAR */}



<div

className="
mt-6
rounded-2xl
bg-slate-50
p-4
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
text-xs
text-slate-500
"

>

RCM Opportunity Score

</p>


<div

className="
mt-1
flex
items-center
gap-2
"

>


<span

className="
text-2xl
font-bold
text-blue-600
"

>

{lead.leadScore}

</span>


<span

className="
text-sm
text-slate-400
"

>

/100

</span>


</div>


</div>





<Activity

size={28}

className="
text-blue-600
"

/>


</div>






<div

className="
mt-3
h-2
overflow-hidden
rounded-full
bg-slate-200
"

>


<div

className="
h-full
rounded-full
bg-blue-600
transition-all
duration-500
"

style={{

width:`${lead.leadScore}%`

}}


/>


</div>



</div>










{/* ACTION */}


<div

className="
mt-5
flex
items-center
justify-between
text-sm
"

>


<p

className="
text-slate-400
"

>

Click to view provider profile

</p>



<div

className="
flex
items-center
gap-2
font-semibold
text-blue-600
transition
group-hover:gap-3
"

>

View Details

<ArrowRight size={16}/>


</div>


</div>







</div>


);


}