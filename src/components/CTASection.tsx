"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  Headphones,
} from "lucide-react";
import Link from "next/link";


const benefits = [
  {
    icon: ShieldCheck,
    text: "HIPAA Compliant",
  },
  {
    icon: Clock,
    text: "24/7 Support",
  },
  {
    icon: Headphones,
    text: "RCM Experts",
  },
];


export default function CTASection() {

return (

<section
className="
relative
overflow-hidden
py-24
"
>


{/* Background Glow */}

<div
className="
absolute
left-1/2
top-1/2
h-[600px]
w-[600px]
-translate-x-1/2
-translate-y-1/2
rounded-full
bg-blue-100/40
blur-[140px]
"
/>



<motion.div

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
duration:.8
}}

className="
relative
mx-auto
max-w-5xl
overflow-hidden
rounded-[36px]
bg-gradient-to-br
from-blue-600
via-blue-500
to-blue-400
px-8
py-14
text-center
shadow-[0_30px_80px_rgba(37,99,235,0.18)]
lg:px-16
"

>


{/* CTA Background Effects */}

<div
className="
absolute
right-[-120px]
top-[-120px]
h-[350px]
w-[350px]
rounded-full
bg-white/10
blur-3xl
"
/>


<div
className="
absolute
left-[-120px]
bottom-[-120px]
h-[300px]
w-[300px]
rounded-full
bg-blue-300/20
blur-3xl
"/>



{/* Content */}

<div
className="
relative
z-10
"
>


<p
className="
text-sm
font-semibold
tracking-[0.3em]
text-blue-100
"
>

GET STARTED TODAY

</p>



<h2
className="
mt-5
text-3xl
font-bold
leading-tight
text-white
lg:text-5xl
"
>

Improve Your Healthcare
<br/>
Revenue Performance

</h2>




<p
className="
mx-auto
mt-6
max-w-2xl
text-lg
leading-relaxed
text-blue-100
"
>

Let WiseMedBilling handle your revenue cycle
so your healthcare team can focus on delivering
better patient care.

</p>




<Link href="/consultation">

<motion.button

whileHover={{
scale:1.05
}}

whileTap={{
scale:0.98
}}

className="
mt-10
inline-flex
items-center
gap-3
rounded-full
bg-white
px-8
py-4
font-semibold
text-blue-600
shadow-xl
transition-all
duration-300
"
>

Free RCM Audit  

<ArrowRight size={20}/>

</motion.button>

</Link>




<div
className="
mt-12
flex
flex-wrap
justify-center
gap-4
"
>


{
benefits.map((item,index)=>{

const Icon=item.icon;


return (

<motion.div

key={index}

whileHover={{
y:-4
}}

className="
flex
items-center
gap-3
rounded-full
border
border-white/20
bg-white/15
px-5
py-3
text-sm
text-white
backdrop-blur-md
"

>

<Icon size={18}/>

{item.text}


</motion.div>


)

})

}


</div>



</div>


</motion.div>



</section>

);

}