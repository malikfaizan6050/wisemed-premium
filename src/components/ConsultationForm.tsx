"use client";

import { motion } from "framer-motion";

import {
ShieldCheck,
Clock,
Activity,
CheckCircle2,
ChevronDown
} from "lucide-react";

import {
useState
} from "react";

import {
useGoogleReCaptcha
} from "react-google-recaptcha-v3";

import { track } from "@vercel/analytics";

import {
calculateLeadScore,
getLeadPriority
} from "@/lib/leadScoring";



const initialForm = {

firstName:"",
lastName:"",
email:"",
phone:"",
organization:"",
npi:"",
specialty:"",

claimsVolume:"",

currentBillingMethod:"",

ehrSystem:"",

message:"",

};



// `required` drives both the asterisk shown to the visitor and the browser's own
// validation. The server enforces the same four fields independently.
const contactFields = [

["firstName","First Name",true],

["lastName","Last Name",false],

["email","Email",true],

["phone","Phone Number",false],

["organization","Practice / Organization",true],

["npi","NPI Number",false],

["specialty","Medical Specialty",true]

] as const;



const billingChallenges = [

"Claim Denials",

"Slow Payments",

"AR Aging",

"Insurance Follow-up",

"Coding Issues",

"Prior Authorization Issues",

"Eligibility Verification",

"Poor Reporting"

];





export default function ConsultationForm(){


const [formData,setFormData]=useState(initialForm);


const [contactConsent,setContactConsent]=useState(false);


const [selectedChallenges,setSelectedChallenges]
=
useState<string[]>([]);



const [challengeOpen,setChallengeOpen]
=
useState(false);



const [loading,setLoading]=useState(false);


const [success,setSuccess]=useState(false);


const [error,setError]=useState("");



const {
executeRecaptcha
}=useGoogleReCaptcha();






const handleChange=(

e:
React.ChangeEvent<
HTMLInputElement |
HTMLTextAreaElement |
HTMLSelectElement
>

)=>{


setFormData({

...formData,

[e.target.name]:e.target.value

});


};





const toggleChallenge=(item:string)=>{


setSelectedChallenges((prev)=>


prev.includes(item)

?

prev.filter(
(challenge)=>challenge!==item
)

:

[
...prev,
item
]


);


};








const validateForm=()=>{


if(!formData.firstName)
return "First name is required";


if(!formData.email)
return "Email is required";


if(!formData.organization)
return "Practice organization is required";


if(!formData.specialty)
return "Medical specialty is required";


if(!contactConsent)
return "Please agree to be contacted before submitting";


return "";


};








const handleSubmit=async(

e:React.FormEvent

)=>{


e.preventDefault();



setError("");

setSuccess(false);




const validationError =
validateForm();



if(validationError){

setError(validationError);

return;

}





if(!executeRecaptcha){

setError(
"Security verification loading..."
);

return;

}





try{


setLoading(true);




const captchaToken =
await executeRecaptcha(
"consultation_form"
);




const score =
calculateLeadScore({
...formData,
billingChallenges:selectedChallenges
});




const priority =
getLeadPriority(score);








const response = await fetch("/api/consultation",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({


...formData,


billingChallenges:selectedChallenges,



// RCM PIPELINE

status:"new_inquiry",

priority,

leadScore:score,

opportunityScore:score,


assignedTo:null,



// HEALTHCARE DATA


claimsVolume:
Number(formData.claimsVolume),


estimatedRevenue:0,


denialRate:0,



// SOURCE

source:"website",


contactConsent,


captchaToken,



})
});

if(!response.ok){
throw new Error("Consultation submission failed");
}






// Marks this visitor as converted, so traffic sources can be measured
// against leads rather than page views alone.
track("consultation_submitted",{
specialty:formData.specialty,
claimsVolume:formData.claimsVolume || "unspecified",
leadPriority:priority
});


setSuccess(true);


setFormData(initialForm);


setContactConsent(false);


setSelectedChallenges([]);



}


catch{


setError(
"Something went wrong. Please try again."
);


}


finally{


setLoading(false);


}


};









return (

<section

className="
relative
overflow-hidden
bg-gradient-to-br
from-blue-50
via-white
to-blue-100
py-24
"

>


<div

className="
mx-auto
grid
max-w-7xl
gap-14
px-6
lg:grid-cols-2
lg:px-8
"

>






{/* LEFT */}

<motion.div

initial={{
opacity:0,
x:-40
}}

animate={{
opacity:1,
x:0
}}

transition={{
duration:.7
}}

>


<p className="
text-sm
font-semibold
tracking-[0.3em]
text-blue-600
">

REQUEST RCM ASSESSMENT

</p>



<h1 className="
mt-6
text-5xl
font-bold
leading-tight
text-slate-900
">

Optimize Your Healthcare Revenue Cycle

</h1>



<p className="
mt-6
max-w-lg
text-lg
text-slate-600
">

Connect with WiseMedBilling experts and discover opportunities to reduce denials, improve collections, and optimize your billing workflow.

</p>





<div className="
mt-8
space-y-4
text-slate-700
">


<div className="flex items-center gap-3">

<ShieldCheck className="text-blue-600"/>

HIPAA Focused Workflows

</div>


<div className="flex items-center gap-3">

<Activity className="text-blue-600"/>

Revenue Cycle Specialists

</div>



<div className="flex items-center gap-3">

<Clock className="text-blue-600"/>

Faster Reimbursement Recovery

</div>


</div>



</motion.div>









{/* FORM */}



<motion.form

onSubmit={handleSubmit}


initial={{
opacity:0,
x:40
}}

animate={{
opacity:1,
x:0
}}


transition={{
duration:.7
}}



className="
rounded-[32px]
bg-white
p-8
shadow-xl
"

>





<div className="
grid
gap-5
sm:grid-cols-2
">


{

contactFields.map(([name,label,isRequired])=>(


<label key={name} className="flex flex-col gap-1">


<span className="text-sm font-medium text-slate-700">

{label}

{
isRequired &&
<span className="ml-1 text-red-600" aria-hidden="true">*</span>
}

</span>


<input

name={name}

type={name === "email" ? "email" : name === "phone" ? "tel" : "text"}

required={isRequired}

aria-required={isRequired}

value={
formData[
name as keyof typeof formData
]
}

onChange={handleChange}

placeholder={label}

className="
rounded-xl
border
border-slate-200
px-5
py-4
outline-none
focus:border-blue-600
"

/>


</label>


))


}


</div>









<div className="
mt-5
grid
gap-5
sm:grid-cols-2
">



<select

name="claimsVolume"

value={formData.claimsVolume}

onChange={handleChange}

className="
rounded-xl
border
px-5
py-4
"

>

<option value="">
Monthly Claims Volume
</option>

<option value="500">
0-500 Claims
</option>

<option value="1500">
500-2000 Claims
</option>

<option value="2500">
2000+ Claims
</option>


</select>






<select

name="currentBillingMethod"

value={formData.currentBillingMethod}

onChange={handleChange}

className="
rounded-xl
border
px-5
py-4
"

>

<option value="">
Current Billing Method
</option>

<option value="in_house">
In-house Team
</option>

<option value="outsourced">
Outsourced Billing
</option>

<option value="hybrid">
Hybrid
</option>


</select>







<select

name="ehrSystem"

value={formData.ehrSystem}

onChange={handleChange}

className="
rounded-xl
border
px-5
py-4
"

>

<option value="">
EHR System
</option>

<option>
Epic
</option>

<option>
Athenahealth
</option>

<option>
eClinicalWorks
</option>

<option>
NextGen
</option>

<option>
Other
</option>


</select>






{/* MULTI SELECT */}


<div className="relative">


<button

type="button"

onClick={()=>
setChallengeOpen(!challengeOpen)
}

className="
flex
w-full
items-center
justify-between
rounded-xl
border
px-5
py-4
text-left
"

>


<span>

{
selectedChallenges.length
?

`${selectedChallenges.length} challenges selected`

:

"Main Billing Challenges"

}

</span>


<ChevronDown size={18}/>


</button>





{

challengeOpen &&


<div className="
absolute
z-20
mt-2
w-full
rounded-xl
border
bg-white
p-3
shadow-xl
">


{
billingChallenges.map((item)=>(


<label

key={item}

className="
flex
items-center
gap-3
rounded-lg
p-2
hover:bg-slate-50
cursor-pointer
"

>


<input

type="checkbox"

checked={
selectedChallenges.includes(item)
}

onChange={()=>
toggleChallenge(item)
}

/>


{item}


</label>


))


}



</div>


}



</div>




</div>










<textarea

name="message"

value={formData.message}

onChange={handleChange}

placeholder="
Tell us about your current billing challenges
"

className="
mt-5
h-32
w-full
rounded-xl
border
p-5
outline-none
focus:border-blue-600
"

/>






<label className="
mt-6
flex
items-start
gap-3
rounded-xl
bg-slate-50
p-4
text-sm
text-slate-600
cursor-pointer
">


<input

type="checkbox"

name="contactConsent"

required

aria-required="true"

checked={contactConsent}

onChange={(event)=>setContactConsent(event.target.checked)}

className="mt-1 h-4 w-4 shrink-0"

/>


<span>

I agree that WiseMedBilling may store the details above and contact me
about my enquiry.
{" "}
<span className="text-red-600" aria-hidden="true">*</span>
{" "}
Please do not include patient information in this form.

</span>


</label>




<p className="mt-4 text-xs text-slate-500">

<span className="text-red-600" aria-hidden="true">*</span>
{" "}
Required field.

</p>




<button

disabled={loading}

className="
mt-4
w-full
rounded-full
bg-blue-600
py-4
font-semibold
text-white
hover:bg-blue-700
disabled:opacity-50
"

>


{

loading

?

"Submitting..."

:

"Request RCM Assessment"

}


</button>







{
error &&

<div className="
mt-5
rounded-xl
bg-red-50
p-4
text-center
text-red-600
">

{error}

</div>

}






{
success &&

<div className="
mt-5
flex
items-center
justify-center
gap-2
rounded-xl
bg-green-50
p-4
text-green-700
">


<CheckCircle2 size={20}/>


Thank you! Our RCM team will contact you soon.


</div>


}



</motion.form>





</div>


</section>


);


}
