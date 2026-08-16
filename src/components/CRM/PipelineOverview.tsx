"use client";


import {
  CheckCircle2,
  Clock,
  FileText,
  Handshake,
  Rocket,
  Search,
  Users,
  XCircle
} from "lucide-react";


import {
  Lead
} from "@/types/crm";



interface Props {

  leads:Lead[];

}




const stages = [

{
key:"new_inquiry",
label:"New Inquiry",
icon:Users,
color:"blue"
},


{
key:"initial_review",
label:"Initial Review",
icon:Search,
color:"indigo"
},


{
key:"discovery_scheduled",
label:"Discovery",
icon:Clock,
color:"purple"
},


{
key:"requirements_collected",
label:"Requirements",
icon:FileText,
color:"cyan"
},


{
key:"proposal_sent",
label:"Proposal",
icon:Handshake,
color:"orange"
},


{
key:"onboarding",
label:"Onboarding",
icon:Rocket,
color:"green"
},


{
key:"active_client",
label:"Active Client",
icon:CheckCircle2,
color:"emerald"
},


{
key:"lost",
label:"Lost",
icon:XCircle,
color:"red"
}


];








const colorMap:any = {


blue:
"bg-blue-50 text-blue-700 border-blue-200",


indigo:
"bg-indigo-50 text-indigo-700 border-indigo-200",


purple:
"bg-purple-50 text-purple-700 border-purple-200",


cyan:
"bg-cyan-50 text-cyan-700 border-cyan-200",


orange:
"bg-orange-50 text-orange-700 border-orange-200",


green:
"bg-green-50 text-green-700 border-green-200",


emerald:
"bg-emerald-50 text-emerald-700 border-emerald-200",


red:
"bg-red-50 text-red-700 border-red-200"


};









export default function PipelineOverview({

leads

}:Props){





return (

<div

className="
mt-10
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-sm
"

>



<div

className="
flex
items-center
justify-between
mb-6
"

>


<div>


<h2

className="
text-xl
font-bold
text-slate-900
"

>

RCM Sales Pipeline

</h2>


<p

className="
mt-1
text-sm
text-slate-500
"

>

Healthcare provider acquisition workflow

</p>


</div>



<div

className="
rounded-full
bg-blue-50
px-4
py-2
text-sm
font-semibold
text-blue-700
"

>

{leads.length} Opportunities

</div>



</div>









<div

className="
grid
gap-4
md:grid-cols-4
lg:grid-cols-8
"

>



{

stages.map((stage)=>{


const Icon = stage.icon;



const count = leads.filter(

lead=>

lead.status===stage.key

).length;





return (

<div

key={stage.key}

className={`

rounded-2xl

border

p-4

transition

hover:-translate-y-1

hover:shadow-md

${colorMap[stage.color]}

`}

>


<div

className="
flex
items-center
justify-between
"

>


<Icon

size={20}

/>


<span

className="
text-2xl
font-bold
"

>

{count}

</span>



</div>



<p

className="
mt-3
text-xs
font-semibold
"

>

{stage.label}

</p>



</div>


)


})


}



</div>









{/* PROGRESS BAR */}


<div

className="
mt-8
"

>


<div

className="
mb-2
flex
justify-between
text-xs
font-medium
text-slate-500
"

>


<span>
Pipeline Progress
</span>


<span>
{
leads.length
?
Math.round(
(
leads.filter(
l=>l.status==="active_client"
).length
/
leads.length
)
*
100
)
:
0
}% Converted
</span>


</div>





<div

className="
h-3
overflow-hidden
rounded-full
bg-slate-100
"

>


<div

className="
h-full
rounded-full
bg-blue-600
transition-all
duration-700
"

style={{

width:
`${

leads.length
?
(
leads.filter(
l=>l.status==="active_client"
).length
/
leads.length
)
*
100
:
0

}%`

}}


/>


</div>


</div>







</div>


);


}