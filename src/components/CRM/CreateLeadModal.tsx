"use client";


import {
useState
} from "react";


import {
X,
Save
} from "lucide-react";


import {
collection,
addDoc,
serverTimestamp
} from "firebase/firestore";


import {
db
} from "@/lib/firebase";



interface Props {

open:boolean;

onClose:()=>void;

}




export default function CreateLeadModal({

open,

onClose

}:Props){



const [loading,setLoading]=useState(false);



const [form,setForm]=useState({

firstName:"",

lastName:"",

email:"",

phone:"",

organization:"",

specialty:"",

npi:"",

monthlyClaims:"",

monthlyCollections:"",

providerCount:"",

practiceSize:"",

ehrSystem:"",

billingSetup:"",

billingChallenge:"",

interestedService:"",

preferredContactMethod:"",

notes:""

});





if(!open) return null;





const update=(

field:string,

value:string

)=>{


setForm({

...form,

[field]:value

});


};






const createLead=async()=>{


try{


setLoading(true);



const claims =
Number(form.monthlyClaims || 0);



const providers =
Number(form.providerCount || 0);




let score = 0;



if(claims > 500){

score += 30;

}

else if(claims > 200){

score += 20;

}

else if(claims > 50){

score += 10;

}





if(providers >= 10){

score += 20;

}

else if(providers >= 5){

score += 10;

}





if(form.billingSetup==="outsourced"){

score += 20;

}





if(form.billingChallenge){

score += 15;

}





let priority="standard";



if(score>=70){

priority="critical";

}

else if(score>=40){

priority="high";

}





await addDoc(

collection(

db,

"crm_leads"

),

{


...form,


monthlyClaims:claims,


monthlyCollections:

Number(
form.monthlyCollections || 0
),


providerCount:providers,


leadScore:score,


opportunityScore:score,


priority,


status:"new_inquiry",


source:"manual",


assignedTo:null,


activity:[],


createdAt:
serverTimestamp(),


updatedAt:
serverTimestamp()


}

);



alert("Lead created successfully");


onClose();


}

catch(error){


console.error(error);


alert("Failed creating lead");


}

finally{


setLoading(false);


}


};





return (

<div

className="
fixed
inset-0
z-50
flex
items-center
justify-center
bg-black/40
p-4
"

>


<div

className="
w-full
max-w-4xl
max-h-[90vh]
overflow-y-auto
rounded-3xl
bg-white
p-8
"

>


<div

className="
flex
justify-between
items-center
mb-6
"

>


<h2

className="
text-2xl
font-bold
"

>

Create New Lead

</h2>


<button

onClick={onClose}

>

<X/>

</button>


</div>

<div

className="
grid
grid-cols-1
md:grid-cols-2
gap-4
"

>


<input

placeholder="First Name"

value={form.firstName}

onChange={(e)=>
update(
"firstName",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="Last Name"

value={form.lastName}

onChange={(e)=>
update(
"lastName",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="Email"

value={form.email}

onChange={(e)=>
update(
"email",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="Phone"

value={form.phone}

onChange={(e)=>
update(
"phone",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="Practice Name"

value={form.organization}

onChange={(e)=>
update(
"organization",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="Specialty"

value={form.specialty}

onChange={(e)=>
update(
"specialty",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="NPI"

value={form.npi}

onChange={(e)=>
update(
"npi",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="Number of Providers"

value={form.providerCount}

onChange={(e)=>
update(
"providerCount",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="Practice Size"

value={form.practiceSize}

onChange={(e)=>
update(
"practiceSize",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="Monthly Claims"

value={form.monthlyClaims}

onChange={(e)=>
update(
"monthlyClaims",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="Monthly Collections"

value={form.monthlyCollections}

onChange={(e)=>
update(
"monthlyCollections",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<input

placeholder="EHR System"

value={form.ehrSystem}

onChange={(e)=>
update(
"ehrSystem",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<select

value={form.billingSetup}

onChange={(e)=>
update(
"billingSetup",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

>

<option value="">

Billing Setup

</option>


<option value="in_house">

In House

</option>


<option value="outsourced">

Outsourced

</option>


<option value="hybrid">

Hybrid

</option>


</select>



<input

placeholder="Interested Service"

value={form.interestedService}

onChange={(e)=>
update(
"interestedService",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<textarea

placeholder="Billing Challenges"

value={form.billingChallenge}

onChange={(e)=>
update(
"billingChallenge",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>



<select

value={form.preferredContactMethod}

onChange={(e)=>
update(
"preferredContactMethod",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

>

<option value="">

Preferred Contact

</option>


<option value="phone">

Phone

</option>


<option value="email">

Email

</option>


<option value="whatsapp">

WhatsApp

</option>


</select>



<textarea

placeholder="CRM Notes"

value={form.notes}

onChange={(e)=>
update(
"notes",
e.target.value
)
}

className="
border
rounded-xl
p-3
"

/>

<button

disabled={loading}

onClick={createLead}

className="
md:col-span-2
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
hover:bg-blue-700
disabled:opacity-50
"

>


<Save size={18}/>


{

loading

?

"Saving..."

:

"Create Lead"

}


</button>



</div>


</div>


</div>


);


}