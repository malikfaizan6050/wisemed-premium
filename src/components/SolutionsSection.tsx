"use client";

import { motion } from "framer-motion";
import {
  FileText,
  ClipboardCheck,
  ShieldAlert,
  Stethoscope,
  Wallet,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";


const solutions = [
  {
    title: "Medical Billing",
    description:
      "Streamline billing operations with accurate claim submission and faster reimbursements.",
    icon: FileText,
    link: "/consultation",
  },

  {
    title: "Claims Management",
    description:
      "Manage claims efficiently, reduce delays, and improve revenue cycle performance.",
    icon: ClipboardCheck,
    link: "/consultation",
  },

  {
    title: "Denial Management",
    description:
      "Identify denial patterns, recover lost revenue, and improve claim success rates.",
    icon: ShieldAlert,
    link: "/consultation",
  },

  {
    title: "Insurance Verification",
    description:
      "Verify patient eligibility and coverage details before claim submission.",
    icon: Stethoscope,
    link: "/consultation",
  },

  {
    title: "Payment Posting",
    description:
      "Improve payment accuracy with efficient posting and reconciliation workflows.",
    icon: Wallet,
    link: "/consultation",
  },

  {
    title: "Revenue Analytics",
    description:
      "Gain real-time insights into financial performance and revenue trends.",
    icon: BarChart3,
    link: "/consultation",
  },
];



export default function SolutionsSection() {


return (

<section
className="
relative
overflow-hidden
bg-gradient-to-b
from-white
via-blue-50/20
to-white
py-12
"
>


{/* Background Glow */}

<div
className="
absolute
left-1/2
top-10
h-[350px]
w-[350px]
-translate-x-1/2
rounded-full
bg-blue-100/40
blur-[120px]
"
/>



<div
className="
relative
mx-auto
max-w-7xl
px-6
lg:px-8
"
>


{/* Heading */}

<motion.div

initial={{
opacity:0,
y:25
}}

whileInView={{
opacity:1,
y:0
}}

viewport={{
once:true
}}

transition={{
duration:.6
}}

className="
mx-auto
max-w-3xl
text-center
mb-10
"

>


<p
className="
text-xs
font-bold
tracking-[0.25em]
text-blue-600
"
>
OUR SOLUTIONS
</p>



<h2
className="
mt-4
text-3xl
font-bold
tracking-tight
text-slate-900
md:text-4xl
"
>

Complete Revenue Cycle

<span
className="
block
text-blue-600
"
>
Management Solutions
</span>

</h2>



<p
className="
mx-auto
mt-4
max-w-xl
text-base
leading-7
text-slate-600
"
>

Helping healthcare organizations improve billing efficiency,
reduce claim denials, and maximize reimbursements.

</p>


</motion.div>





{/* Solution Cards */}

<div
className="
grid
gap-5
md:grid-cols-2
lg:grid-cols-3
"
>


{
solutions.map((item,index)=>{

const Icon = item.icon;


return (

<motion.div

key={item.title}


initial={{
opacity:0,
y:25
}}

whileInView={{
opacity:1,
y:0
}}

viewport={{
once:true
}}

transition={{
duration:.5,
delay:index*0.08
}}

whileHover={{
y:-6
}}

className="
group
rounded-[26px]
border
border-white/80
bg-white/80
backdrop-blur-xl
p-6
shadow-[0_20px_50px_rgba(15,23,42,0.06)]
transition-all
duration-300
hover:shadow-xl
"

>


<div
className="
flex
h-11
w-11
items-center
justify-center
rounded-xl
bg-blue-100
text-blue-600
"
>

<Icon size={22}/>

</div>




<h3
className="
mt-5
text-lg
font-bold
text-slate-900
"
>

{item.title}

</h3>




<p
className="
mt-2
text-sm
leading-6
text-slate-600
"
>

{item.description}

</p>





<Link

href={item.link}

className="
mt-5
inline-flex
items-center
gap-2
text-sm
font-semibold
text-blue-600
transition-all
duration-300
hover:text-blue-700
"

>

Learn More

<ArrowRight
size={15}
/>


</Link>



</motion.div>


)

})

}



</div>


</div>


</section>


)

}