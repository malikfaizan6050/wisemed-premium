"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  Stethoscope,
  TrendingDown,
  Clock,
} from "lucide-react";


const benefits = [
  {
    icon: ShieldCheck,
    title: "HIPAA-Compliant Security",
    description:
      "Protecting sensitive healthcare information with secure and reliable billing workflows.",
  },
  {
    icon: Stethoscope,
    title: "Healthcare Billing Expertise",
    description:
      "Experienced specialists who understand medical billing and revenue cycle operations.",
  },
  {
    icon: TrendingDown,
    title: "Reduced Claim Denials",
    description:
      "Improve claim accuracy and reduce revenue loss with proactive denial management.",
  },
  {
    icon: Clock,
    title: "Faster Reimbursements",
    description:
      "Accelerate payment cycles and improve your organization's cash flow.",
  },
];


export default function WhyChoose(){

return (

<section
className="
relative
overflow-hidden
pt-40
pb-32
bg-white
"
>
{/* Background Glow */}

<div
className="
absolute
right-0
top-1/3
h-[500px]
w-[500px]
rounded-full
bg-blue-100/40
blur-3xl
"
/>

{/* Background Glow */}

<div
className="
absolute
right-0
top-20
h-[400px]
w-[400px]
rounded-full
bg-blue-100/40
blur-[130px]
"
/>




<div
className="
relative
mx-auto
grid
max-w-7xl
grid-cols-1
items-center
gap-16
px-8
lg:grid-cols-2
"
>



{/* LEFT SIDE */}


<motion.div

initial={{
opacity:0,
x:-40
}}

whileInView={{
opacity:1,
x:0
}}

viewport={{
once:true
}}

transition={{
duration:.8
}}

>


<p
className="
text-sm
font-bold
tracking-widest
text-blue-600
"
>
WHY CHOOSE US
</p>



<h2
className="
mt-5
text-4xl
font-bold
leading-tight
text-slate-900
md:text-5xl
"
>
Built For Better
Healthcare Revenue Performance
</h2>



<p
className="
mt-6
max-w-xl
text-lg
leading-8
text-slate-600
"
>
From claims accuracy to faster reimbursements,
WiseMedBilling helps healthcare organizations
build a stronger and more predictable revenue cycle.
</p>



<div
className="
mt-10
flex
items-center
gap-8
"
>

<div>

<h3
className="
text-3xl
font-bold
text-blue-600
"
>
99%
</h3>

<p
className="
text-sm
text-slate-500
"
>
Claim Accuracy
</p>

</div>



<div>

<h3
className="
text-3xl
font-bold
text-blue-600
"
>
24/7
</h3>

<p
className="
text-sm
text-slate-500
"
>
Support
</p>

</div>


</div>


</motion.div>






{/* RIGHT SIDE BENEFITS */}


<motion.div

initial={{
opacity:0,
x:40
}}

whileInView={{
opacity:1,
x:0
}}

viewport={{
once:true
}}

transition={{
duration:.8
}}

className="
grid
grid-cols-1
gap-6
sm:grid-cols-2
"

>


{
benefits.map((item,index)=>{


const Icon=item.icon;


return (

<motion.div

key={item.title}

whileHover={{
y:-6
}}

transition={{
duration:.3
}}

className="
rounded-[28px]
bg-white/80
backdrop-blur-xl
p-6
min-h-[280px]
shadow-[0_25px_70px_rgba(15,23,42,0.08)]
transition-all
duration-300
hover:-translate-y-2
hover:shadow-xl
transition-all
duration-300
"

>


<div
className="
flex
h-12
w-12
items-center
justify-center
rounded-xl
bg-blue-100
text-blue-600
"
>

<Icon size={26}/>

</div>



<h3
className="
mt-6
text-xl
font-bold
text-slate-900
"
>
{item.title}
</h3>



<p
className="
mt-3
leading-7
text-slate-600
"
>
{item.description}
</p>


</motion.div>


)

})
}



</motion.div>



</div>


</section>

)

}