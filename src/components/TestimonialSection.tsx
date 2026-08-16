"use client";

import { motion } from "framer-motion";
import {
  Quote,
  Star,
  Building2,
  CheckCircle2,
} from "lucide-react";


const stats = [
  {
    value: "40%",
    label: "Faster Recovery",
  },
  {
    value: "99%",
    label: "Claim Accuracy",
  },
  {
    value: "24/7",
    label: "Support",
  },
];


export default function TestimonialSection() {

return (

<section
className="
relative
overflow-hidden
py-20
"
>


{/* Background Glow */}

<div
className="
absolute
right-0
top-0
h-[500px]
w-[500px]
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
grid
lg:grid-cols-2
gap-16
items-center
"
>


{/* LEFT CONTENT */}


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
mb-5
text-sm
font-semibold
tracking-[0.25em]
text-blue-600
"
>
TRUSTED BY HEALTHCARE PROVIDERS
</p>


<h2
className="
text-4xl
font-bold
leading-tight
text-slate-900
lg:text-5xl
"
>

Trusted By Healthcare Teams
To Improve Revenue Outcomes

</h2>


{/* Testimonial Card */}

<div
className="
mt-10
rounded-[32px]
bg-white/80
backdrop-blur-xl
p-8
shadow-[0_30px_80px_rgba(15,23,42,0.08)]
"
>


<div
className="
flex
justify-between
items-start
"
>


<div
className="
flex
gap-1
text-blue-600
"
>

{
[1,2,3,4,5].map((i)=>(
<Star
key={i}
size={18}
fill="currentColor"
/>
))
}

</div>


<Quote
className="
text-blue-100
"
size={55}
/>


</div>



<p
className="
mt-6
text-lg
leading-relaxed
text-slate-600
"
>

"WiseMedBilling transformed our revenue
cycle operations. Their expertise helped us
reduce denials, improve collections, and
gain better financial visibility."

</p>



<div
className="
mt-8
flex
items-center
gap-4
"
>


<div
className="
flex
h-12
w-12
items-center
justify-center
rounded-full
bg-blue-100
"
>

<Building2
className="
text-blue-600
"
/>

</div>


<div>

<h4
className="
font-semibold
text-slate-900
"
>
Dr. Michael Anderson
</h4>


<p
className="
text-sm
text-slate-500
"
>
Chief Financial Officer
<br/>
Healthcare Network
</p>


</div>


</div>


</div>


</motion.div>





{/* RIGHT RESULTS PANEL */}



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
rounded-[32px]
bg-white/70
backdrop-blur-xl
p-8
shadow-[0_30px_80px_rgba(37,99,235,0.10)]
"

>


<div
className="
flex
items-center
justify-between
mb-8
"
>

<h3
className="
text-xl
font-bold
text-slate-900
"
>
Healthcare Impact
</h3>


<span
className="
rounded-full
bg-blue-100
px-4
py-1
text-xs
font-semibold
text-blue-600
"
>
Results
</span>


</div>




<div
className="
space-y-5
"
>

{
stats.map((item,index)=>(


<motion.div

key={item.label}

whileHover={{
y:-4
}}

transition={{
duration:.25
}}

className="
flex
items-center
justify-between
rounded-2xl
bg-blue-50/60
p-6
"

>


<div>

<h4
className="
text-3xl
font-bold
text-blue-600
"
>
{item.value}
</h4>


<p
className="
mt-1
text-slate-600
"
>
{item.label}
</p>


</div>


<CheckCircle2
className="
text-blue-600
"
/>


</motion.div>


))
}


</div>


</motion.div>


</div>


</section>

);

}