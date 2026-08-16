"use client";

import { motion } from "framer-motion";


const stats = [
  {
    value: "99%",
    title: "Claim Accuracy",
    description: "Accurate billing workflows",
  },

  {
    value: "HIPAA",
    title: "Compliant",
    description: "Secure healthcare operations",
  },

  {
    value: "24/7",
    title: "Support",
    description: "Dedicated billing assistance",
  },

  {
    value: "500K+",
    title: "Claims Processed",
    description: "Monthly billing volume",
  },
];



export default function TrustSection() {


return (

<section
className="
relative
py-28
overflow-hidden
bg-gradient-to-b
from-blue-50/40
via-white
to-white
"
>

<div
className="
absolute
top-0
left-1/2
-translate-x-1/2
h-[250px]
w-[600px]
rounded-full
bg-blue-200/30
blur-[120px]
"
/>

{/* Background Fade */}

<div
className="
absolute
inset-0
bg-gradient-to-b
from-blue-50/40
via-white
to-white
"
/>



<div
className="
relative
mx-auto
max-w-[1200px]
px-8
"
>



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

transition={{
duration:.7
}}

className="
text-center
mb-14
"

>


<p
className="
text-sm
font-semibold
text-blue-600
uppercase
tracking-wider
"
>
Trusted Healthcare Partner
</p>



<h2
className="
mt-4
text-4xl
font-bold
tracking-tight
text-slate-900
"
>

Built for Reliable Healthcare Revenue

</h2>



<p
className="
mt-4
mx-auto
max-w-2xl
text-slate-600
"
>

Helping healthcare providers improve billing accuracy,
reduce denials, and manage revenue cycle operations.

</p>



</motion.div>





{/* Stats Cards */}


<div
className="
grid
grid-cols-1
gap-6
sm:grid-cols-2
lg:grid-cols-4
"
>


{
stats.map((item,index)=>(


<motion.div

key={index}

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
duration:.6,
delay:index*0.1
}}


className="
rounded-[32px]
border
border-white/60
bg-white/70
backdrop-blur-xl
p-8
shadow-[0_25px_70px_rgba(30,64,175,0.08)]
hover:-translate-y-2
transition-all
duration-300
"


>


<h3
className="
text-4xl
font-bold
text-blue-600
"
>

{item.value}

</h3>



<h4
className="
mt-4
text-lg
font-semibold
text-slate-900
"
>

{item.title}

</h4>



<p
className="
mt-2
text-sm
leading-6
text-slate-500
"
>

{item.description}

</p>


</motion.div>


))

}



</div>


</div>


</section>


);


}