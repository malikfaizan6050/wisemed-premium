"use client";


import {
X,
Mail,
Phone,
Building2,
Calendar,
TrendingUp,
ShieldCheck,
Activity,
ClipboardCheck,
Save,
Clock,
DollarSign,
PhoneCall,
FileText,
CheckCircle2
} from "lucide-react";


import {
motion,
AnimatePresence
} from "framer-motion";


import {
doc,
updateDoc,
serverTimestamp
} from "firebase/firestore";


import {
db
} from "@/lib/firebase";


import {
Lead
} from "@/types/crm";


import {
useState
} from "react";





interface Props {

lead:Lead|null;

onClose:()=>void;

onUpdated?:()=>void;

}







const statusOptions=[

["new_inquiry","New Inquiry"],

["initial_review","Initial Review"],

["discovery_scheduled","Discovery Call Scheduled"],

["requirements_collected","Requirements Collected"],

["proposal_sent","Proposal Sent"],

["contract_review","Contract Review"],

["onboarding","Onboarding"],

["active_client","Active Client"],

["lost","Lost Opportunity"]

];






const priorityOptions=[

["critical","Critical"],

["high","High"],

["standard","Standard"]

];







const formatStatus=(status:string)=>{


return status
.replaceAll("_"," ")
.replace(/\b\w/g,
letter=>letter.toUpperCase()
);


};








export default function LeadDrawer({

lead,

onClose,

onUpdated

}:Props){



const [notes,setNotes]=useState("");

const [saving,setSaving]=useState(false);






if(!lead){

return null;

}









const updateField=async(

field:string,

value:string

)=>{


try{


await updateDoc(

doc(
db,
"consultations",
lead.id
),

{


[field]:value,


updatedAt:
serverTimestamp()


}


);



onUpdated?.();


}

catch(error){


console.error(
"Update failed:",
error
);


}



};










const saveNote=async()=>{


if(!notes.trim()) return;


setSaving(true);



try{


await updateDoc(

doc(
db,
"consultations",
lead.id
),

{


notes,


updatedAt:
serverTimestamp()


}


);



setNotes("");

onUpdated?.();


}


finally{


setSaving(false);


}



};










return (


<AnimatePresence>



{

lead &&

<>


{/* BACKDROP */}


<motion.div


initial={{
opacity:0
}}


animate={{
opacity:1
}}


exit={{
opacity:0
}}


onClick={onClose}


className="
fixed
inset-0
z-40
bg-slate-950/40
backdrop-blur-sm
"

/>







{/* DRAWER */}



<motion.aside


initial={{
x:"100%"
}}


animate={{
x:0
}}


exit={{
x:"100%"
}}


transition={{

type:"spring",

stiffness:260,

damping:30

}}



className="
fixed
right-0
top-0
z-50
h-screen
w-full
max-w-xl
overflow-y-auto
bg-white
shadow-2xl
"


>









{/* HEADER */}


<div


className="
sticky
top-0
z-20
border-b
bg-white/90
backdrop-blur
p-6
"


>


<div

className="
flex
items-start
justify-between
"


>


<div

className="
flex
gap-4
items-center
"

>


<div

className="
flex
h-14
w-14
items-center
justify-center
rounded-2xl
bg-blue-600
text-xl
font-bold
text-white
"

>


{
lead.firstName?.charAt(0)
}

{
lead.lastName?.charAt(0)
}


</div>





<div>


<h2

className="
text-2xl
font-bold
text-slate-900
"

>


{lead.firstName} {lead.lastName}


</h2>



<p

className="
mt-1
font-medium
text-blue-600
"

>


{lead.organization}


</p>


</div>



</div>







<button


onClick={onClose}


className="
rounded-full
p-2
transition
hover:bg-slate-100
"


>


<X size={22}/>


</button>




</div>



</div>









<div

className="
space-y-8
p-6
"

>









{/* PIPELINE CONTROL */}



<div>


<h3

className="
mb-3
text-sm
font-semibold
uppercase
tracking-wide
text-slate-500
"

>


RCM Pipeline


</h3>





<select


defaultValue={lead.status}


onChange={(e)=>

updateField(

"status",

e.target.value

)

}


className="
w-full
rounded-xl
border
border-slate-200
bg-white
px-4
py-3
font-medium
"


>


{

statusOptions.map(
(option)=>(


<option

key={option[0]}

value={option[0]}

>


{option[1]}


</option>


)

)


}


</select>



</div>









{/* PRIORITY */}



<div>


<h3

className="
mb-3
text-sm
font-semibold
uppercase
tracking-wide
text-slate-500
"

>


Opportunity Priority


</h3>




<select


defaultValue={lead.priority}


onChange={(e)=>

updateField(

"priority",

e.target.value

)

}


className="
w-full
rounded-xl
border
px-4
py-3
font-medium
"


>


{

priorityOptions.map(
(option)=>(


<option

key={option[0]}

value={option[0]}

>


{option[1]}


</option>


)

)

}



</select>



</div>

{/* OPPORTUNITY SCORE */}


<div

className="
rounded-3xl
border
border-blue-100
bg-gradient-to-br
from-blue-50
via-white
to-blue-100
p-6
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

{lead.leadScore}

</span>


<span

className="
mb-2
text-slate-400
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

<ShieldCheck size={32}/>

</div>



</div>







<div

className="
mt-5
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
"

style={{

width:`${lead.leadScore}%`

}}

/>


</div>



</div>









{/* PROVIDER CONTACT */}



<div>


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


<div className="flex items-center gap-3 text-sm">

<Mail size={17}/>

{lead.email}

</div>



<div className="flex items-center gap-3 text-sm">

<Phone size={17}/>

{lead.phone || "No phone"}

</div>



<div className="flex items-center gap-3 text-sm">

<Building2 size={17}/>

{lead.specialty || "Medical Practice"}

</div>



</div>



</div>









{/* RCM BUSINESS INTELLIGENCE */}



<div>


<h3

className="
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
mt-4
grid
gap-4
sm:grid-cols-2
"

>




<div

className="
rounded-2xl
bg-slate-50
p-4
"

>


<p className="text-xs text-slate-500">

Monthly Claims

</p>


<p className="mt-1 font-bold">

{

lead.monthlyClaims ||

lead.claimsVolume ||

"Not provided"

}


</p>


</div>







<div

className="
rounded-2xl
bg-slate-50
p-4
"

>


<p className="text-xs text-slate-500">

Estimated Revenue

</p>


<p className="mt-1 flex items-center gap-1 font-bold">

<DollarSign size={15}/>


{

lead.estimatedRevenue

?

lead.estimatedRevenue

:

"Not provided"

}


</p>


</div>







<div

className="
rounded-2xl
bg-slate-50
p-4
"

>


<p className="text-xs text-slate-500">

Billing Method

</p>


<p className="mt-1 font-bold capitalize">

{

lead.currentBillingMethod
?

lead.currentBillingMethod.replace("_"," ")

:

"Unknown"

}


</p>


</div>







<div

className="
rounded-2xl
bg-slate-50
p-4
"

>


<p className="text-xs text-slate-500">

EHR System

</p>


<p className="mt-1 font-bold">

{

lead.ehrSystem ||

"Unknown"

}


</p>


</div>



</div>


</div>









{/* QUICK ACTIONS */}



<div

className="
rounded-3xl
border
border-blue-100
bg-blue-50
p-5
"

>


<h3

className="
font-bold
text-slate-900
"

>

Quick Actions

</h3>




<div

className="
mt-4
grid
gap-3
"

>



<button

onClick={()=>updateField(

"status",

"discovery_scheduled"

)}

className="
flex
items-center
justify-center
gap-2
rounded-xl
bg-white
px-4
py-3
font-semibold
text-blue-700
shadow-sm
hover:bg-blue-100
"

>


<PhoneCall size={18}/>

Schedule Discovery Call


</button>







<button

onClick={()=>updateField(

"status",

"proposal_sent"

)}

className="
flex
items-center
justify-center
gap-2
rounded-xl
bg-white
px-4
py-3
font-semibold
text-blue-700
shadow-sm
hover:bg-blue-100
"

>


<FileText size={18}/>

Send Proposal


</button>







<button

onClick={()=>updateField(

"status",

"onboarding"

)}

className="
flex
items-center
justify-center
gap-2
rounded-xl
bg-white
px-4
py-3
font-semibold
text-blue-700
shadow-sm
hover:bg-blue-100
"

>


<CheckCircle2 size={18}/>

Start Onboarding


</button>




</div>


</div>









{/* MESSAGE */}



<div>


<h3

className="
flex
items-center
gap-2
font-bold
"

>


<ClipboardCheck size={18}/>

Provider Requirements


</h3>



<p

className="
mt-3
rounded-2xl
bg-slate-50
p-5
leading-relaxed
text-slate-700
"

>


{

lead.message ||

"No message submitted"

}


</p>


</div>









{/* NOTES */}



<div>


<h3

className="
mb-3
font-bold
"

>

Internal Notes

</h3>



<textarea


value={notes}


onChange={(e)=>

setNotes(e.target.value)

}


placeholder="

Add sales notes...

"


className="
h-28
w-full
rounded-xl
border
border-slate-200
p-4
outline-none
focus:border-blue-600
"

/>





<button


onClick={saveNote}


disabled={saving}


className="
mt-3
flex
items-center
gap-2
rounded-xl
bg-blue-600
px-5
py-3
font-semibold
text-white
hover:bg-blue-700
disabled:opacity-50
"


>


<Save size={17}/>


{

saving

?

"Saving..."

:

"Save Note"

}


</button>



</div>









{/* ACTIVITY */}



<div>


<h3

className="
flex
items-center
gap-2
font-bold
"

>


<Clock size={18}/>

Activity Timeline


</h3>




<div

className="
mt-4
space-y-4
rounded-2xl
bg-slate-50
p-5
text-sm
text-slate-600
"

>


<div>

<span className="
mr-2
inline-block
h-2
w-2
rounded-full
bg-blue-600
"

/>

Lead submitted

</div>




<div>

<span className="
mr-2
inline-block
h-2
w-2
rounded-full
bg-green-600
"

/>

RCM assessment started

</div>



</div>


</div>









{/* CREATED */}



<div

className="
flex
items-center
gap-2
text-sm
text-slate-500
"

>


<Calendar size={16}/>


Created:

{

lead.createdAt?.toDate

?

lead.createdAt.toDate().toLocaleDateString()

:

"Recently"

}



</div>





</div>


</motion.aside>


</>

}


</AnimatePresence>


);


}