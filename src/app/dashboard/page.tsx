"use client";


import {
useEffect,
useMemo,
useState
} from "react";


import {
collection,
onSnapshot,
orderBy,
query
} from "firebase/firestore";


import {
onAuthStateChanged,
signOut
} from "firebase/auth";


import {
db,
auth
} from "@/lib/firebase";


import {
useRouter
} from "next/navigation";


import {
Users,
Clock,
CheckCircle,
Flame,
LogOut,
Search,
BriefcaseBusiness,
PhoneCall
} from "lucide-react";


import StatsCard from "@/components/CRM/StatsCard";

import LeadTable from "@/components/CRM/LeadTable";

import LeadDrawer from "@/components/CRM/LeadDrawer";

import PipelineOverview from "@/components/CRM/PipelineOverview";

import {
Lead
} from "@/types/crm";






export default function Dashboard(){



const router = useRouter();



const [leads,setLeads]=useState<Lead[]>([]);

const [loading,setLoading]=useState(true);

const [checkingAuth,setCheckingAuth]=useState(true);


const [search,setSearch]=useState("");

const [filter,setFilter]=useState("all");


const [selectedLead,setSelectedLead]
=
useState<Lead|null>(null);








// AUTH

useEffect(()=>{


const unsubscribe =
onAuthStateChanged(

auth,

(user)=>{


if(!user){

router.replace("/login");

return;

}


setCheckingAuth(false);


}

);



return ()=>unsubscribe();


},[router]);









// FIRESTORE

useEffect(()=>{


if(checkingAuth) return;



const q=query(

collection(
db,
"consultations"
),

orderBy(
"createdAt",
"desc"
)

);




const unsubscribe =
onSnapshot(

q,

(snapshot)=>{


const data:Lead[] =

snapshot.docs.map((doc)=>{


const item:any = doc.data();



return {


id:doc.id,


firstName:item.firstName ?? "",

lastName:item.lastName ?? "",

email:item.email ?? "",

phone:item.phone ?? "",


organization:item.organization ?? "",


specialty:item.specialty ?? "",


npi:item.npi ?? "",



claimsVolume:item.claimsVolume ?? 0,

estimatedRevenue:item.estimatedRevenue ?? 0,

currentBillingMethod:item.currentBillingMethod ?? "unknown",

ehrSystem:item.ehrSystem ?? "",

denialRate:item.denialRate ?? 0,

monthlyClaims:item.monthlyClaims ?? 0,

practiceSize:item.practiceSize ?? "",



status:item.status ?? "new_inquiry",


priority:item.priority ?? "standard",



leadScore:item.leadScore ?? 0,

opportunityScore:item.opportunityScore ?? 0,



message:item.message ?? "",


challenges:item.challenges ?? [],


nextAction:item.nextAction ?? "Review provider inquiry",


assignedTo:item.assignedTo ?? null,


source:item.source ?? "website",



createdAt:item.createdAt ?? null,

updatedAt:item.updatedAt ?? null



};


});



setLeads(data);

setLoading(false);


}

);



return ()=>unsubscribe();



},[checkingAuth]);











// LOGOUT

const handleLogout=async()=>{


await signOut(auth);


router.replace("/login");


};










// KPI

const totalLeads =
leads.length;



const newInquiry =

leads.filter(

l=>l.status==="new_inquiry"

).length;



const activeClients =

leads.filter(

l=>l.status==="active_client"

).length;



const priorityLeads =

leads.filter(

l=>

l.priority==="critical"

||

l.priority==="high"

).length;











const filteredLeads =
useMemo(()=>{


return leads.filter((lead)=>{


const text =

`

${lead.firstName}

${lead.lastName}

${lead.organization}

${lead.specialty}

${lead.email}

`

.toLowerCase();



const matchesSearch =

text.includes(
search.toLowerCase()
);



const matchesFilter =

filter==="all"

||

lead.status===filter;



return matchesSearch && matchesFilter;



});


},[
leads,
search,
filter
]);









if(checkingAuth){


return (

<div

className="
min-h-screen
flex
items-center
justify-center
bg-slate-50
"

>

Checking authentication...

</div>

);

}









return (

<main

className="
min-h-screen
bg-slate-50
p-8
"

>


<div

className="
mx-auto
max-w-7xl
"

>









<div

className="
flex
justify-between
items-center
"

>


<div>


<h1

className="
text-4xl
font-bold
text-slate-900
"

>

WiseMedBilling CRM

</h1>


<p

className="
mt-2
text-slate-600
"

>

Healthcare Revenue Cycle Management Platform

</p>


</div>





<button

onClick={handleLogout}

className="
flex
items-center
gap-2
rounded-xl
bg-red-600
px-5
py-3
font-semibold
text-white
"

>


<LogOut size={18}/>

Logout


</button>


</div>









<div

className="
mt-10
grid
gap-6
lg:grid-cols-4
"

>


<StatsCard

title="Total Providers"

value={totalLeads}

icon={Users}

description="Healthcare inquiries"

/>



<StatsCard

title="New Inquiries"

value={newInquiry}

icon={Clock}

description="Needs qualification"

/>



<StatsCard

title="Active Clients"

value={activeClients}

icon={BriefcaseBusiness}

description="Managed accounts"

/>



<StatsCard

title="Priority Opportunities"

value={priorityLeads}

icon={Flame}

description="Needs attention"

/>


</div>










<div

className="
mt-12
flex
gap-4
"

>


<div

className="
flex-1
flex
items-center
gap-3
rounded-xl
border
bg-white
px-4
"

>

<Search size={20}/>


<input

value={search}

onChange={
e=>setSearch(e.target.value)
}

placeholder="Search providers, practices..."

className="
w-full
py-3
outline-none
"

/>


</div>






<select

value={filter}

onChange={
e=>setFilter(e.target.value)
}

className="
rounded-xl
border
bg-white
px-4
"

>


<option value="all">

All Pipeline

</option>


<option value="new_inquiry">

New Inquiry

</option>


<option value="discovery_scheduled">

Discovery Scheduled

</option>


<option value="proposal_sent">

Proposal Sent

</option>


<option value="active_client">

Active Client

</option>


</select>



</div>









<PipelineOverview

leads={filteredLeads}

/>









{

loading

?


<p className="mt-6">

Loading providers...

</p>


:


<LeadTable

leads={filteredLeads}

onSelect={
(lead)=>setSelectedLead(lead)
}

/>


}





</div>









<LeadDrawer

lead={selectedLead}

onClose={()=>
setSelectedLead(null)
}

/>






</main>

);


}