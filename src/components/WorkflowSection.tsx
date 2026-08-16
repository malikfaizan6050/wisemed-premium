"use client";

import { motion } from "framer-motion";
import {
  ClipboardCheck,
  FileCheck,
  DollarSign,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    number: "01",
    icon: ClipboardCheck,
    label: "PATIENT DATA",
    title: "Patient Verification",
    description:
      "We verify patient information, insurance eligibility, and coverage details before billing.",
  },

  {
    number: "02",
    icon: FileCheck,
    label: "CLAIM PROCESSING",
    title: "Claims Management",
    description:
      "We submit accurate claims, monitor payer responses, and reduce claim denials.",
  },

  {
    number: "03",
    icon: DollarSign,
    label: "REVENUE RECOVERY",
    title: "Payment Recovery",
    description:
      "We improve collections, speed up reimbursements, and maximize revenue performance.",
  },
];


export default function WorkflowSection() {

return (

<section
className="
relative
overflow-hidden
pt-36
pb-24
bg-gradient-to-b
from-white
via-blue-50/30
to-white
"
>


{/* Background Glow */}

<div
className="
absolute
left-1/2
top-20
h-[450px]
w-[450px]
-translate-x-1/2
rounded-full
bg-blue-100/40
blur-[140px]
"
/>



{/* Heading */}

<motion.div

initial={{
opacity:0,
y:30
}}

whileInView={{
opacity:1,
y:0
}}

viewport={{
once:true
}}

className="
relative
mx-auto
max-w-3xl
text-center
"

>


<p
className="
text-sm
font-bold
tracking-widest
text-blue-600
"
>
HOW IT WORKS
</p>


<h2
className="
mt-5
text-4xl
font-bold
tracking-tight
text-slate-900
md:text-5xl
"
>
A Smarter Approach To Healthcare Revenue
</h2>


<p
className="
mt-6
text-lg
text-slate-600
"
>
From patient verification to final payment, we manage every step of your revenue cycle.
</p>


</motion.div>





{/* Workflow Timeline */}


<div
className="
relative
mx-auto
mt-14
max-w-6xl
px-6
"
>


{/* Connecting Line */}

<div
className="
absolute
top-[48px]
left-[18%]
right-[18%]
hidden
h-[2px]
bg-blue-300
shadow-[0_0_20px_rgba(59,130,246,0.25)]
md:block
"
/>



<div
className="
grid
grid-cols-1
gap-16
md:grid-cols-3
"
>


{
steps.map((step,index)=>{


const Icon = step.icon;


return (

<motion.div

key={step.number}


initial={{
opacity:0,
y:40
}}

whileInView={{
opacity:1,
y:0
}}

viewport={{
once:true
}}

transition={{
delay:index*0.15
}}


className="
relative
text-center
"

>


{/* Number Circle */}

<div
className="
relative
mx-auto
flex
h-28
w-28
items-center
justify-center
rounded-full
border
border-blue-100
bg-white
shadow-[0_20px_50px_rgba(37,99,235,0.12)]
"
>


{/* Number Badge */}

<p
className="
absolute
-top-10
left-1/2
-translate-x-1/2
text-sm
font-bold
tracking-widest
text-blue-600
"
>
STEP {step.number}
</p>



<div
className="
flex
h-14
w-14
items-center
justify-center
rounded-2xl
bg-blue-600
text-white
shadow-lg
shadow-blue-200
"
>

<Icon size={30}/>

</div>


</div>





{/* Label */}

<p
className="
mt-8
text-xs
font-bold
tracking-widest
text-blue-600
"
>
{step.label}
</p>




<h3
className="
mt-3
text-xl
font-bold
text-slate-900
"
>
{step.title}
</h3>




<p
className="
mx-auto
mt-4
max-w-sm
leading-7
text-slate-600
"
>
{step.description}
</p>




{
index !== steps.length-1 &&

<ArrowRight
size={28}
className="
absolute
right-[-45px]
top-14
hidden
text-blue-300
md:block
"
/>
}



</motion.div>


)

})
}


</div>


</div>


</section>

)

}