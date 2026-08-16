"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  FileCheck,
  TrendingUp,
} from "lucide-react";


const metrics = [
  {
    value: "98.7%",
    label: "Claims Success Rate",
  },
  {
    value: "-42%",
    label: "Denials Reduced",
  },
  {
    value: "+24%",
    label: "Revenue Growth",
  },
];


const benefits = [
  {
    icon: ShieldCheck,
    text: "Secure Healthcare Operations",
  },
  {
    icon: FileCheck,
    text: "Accurate Claims Management",
  },
  {
    icon: TrendingUp,
    text: "Faster Revenue Recovery",
  },
];


export default function PerformanceSection(){

return (

<section
className="
relative
overflow-hidden
py-16
bg-transparent
"
>


{/* Background Glow */}

<div
className="
absolute
right-[-150px]
top-20
h-[450px]
w-[450px]
rounded-full
bg-blue-100/20
blur-[120px]
"
/>



<div
className="
relative
mx-auto
grid
max-w-7xl
items-center
gap-12
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
tracking-[0.2em]
text-blue-600
"
>
REVENUE PERFORMANCE
</p>



<h2
className="
mt-6
text-4xl
lg:text-[44px]
font-semibold
leading-tight
text-slate-900
"
>

Transform Your
<br/>

Healthcare Revenue
<br/>

Cycle

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

Gain better visibility into your billing operations,
reduce revenue leakage, and improve financial
performance with smarter RCM workflows.

</p>




{/* Benefits */}


<div
className="
mt-10
space-y-5
"
>


{
benefits.map((item,index)=>{

const Icon=item.icon;


return(

<motion.div

key={index}

initial={{
opacity:0,
x:-20
}}

whileInView={{
opacity:1,
x:0
}}

viewport={{
once:true
}}

transition={{
delay:index*0.15
}}

className="
flex
items-center
gap-5
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

<Icon size={22}/>

</div>


<p
className="
font-semibold
text-slate-800
"
>
{item.text}
</p>


</motion.div>


)

})

}


</div>




<button
className="
mt-10
rounded-full
bg-blue-600
px-8
py-4
font-semibold
text-white
shadow-xl
shadow-blue-200
hover:bg-blue-700
transition
"
>

Explore Revenue Solutions →

</button>



</motion.div>






{/* RIGHT DASHBOARD */}


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
rounded-[30px]
border
border-white/60
bg-white/60
p-5
backdrop-blur-xl
shadow-[0_25px_60px_rgba(37,99,235,0.08)]
"

>


<div
className="
flex
items-center
justify-between
"
>

<h3
className="
text-xl
font-bold
text-slate-900
"
>
Revenue Dashboard
</h3>


<TrendingUp
className="
text-blue-600
"
/>


</div>





{/* Revenue Chart */}

<div
className="
mt-8
rounded-3xl
bg-blue-50/70
p-4
"
>

<div className="flex justify-between items-center">

<p
className="
text-sm
font-medium
text-slate-500
"
>
Revenue Trend
</p>


<span
className="
text-xs
font-semibold
text-green-600
"
>
+24% Growth
</span>


</div>



<svg
viewBox="0 0 420 150"
className="
mt-5
h-36
w-full
"
>


{/* Grid Lines */}

<line
x1="0"
y1="30"
x2="420"
y2="30"
stroke="#dbeafe"
/>

<line
x1="0"
y1="70"
x2="420"
y2="70"
stroke="#dbeafe"
/>

<line
x1="0"
y1="110"
x2="420"
y2="110"
stroke="#dbeafe"
/>



{/* Gradient Area */}

<defs>

<linearGradient
id="revenueGradient"
x1="0"
x2="0"
y1="0"
y2="1"
>

<stop
offset="0%"
stopColor="#2563eb"
stopOpacity="0.25"
/>

<stop
offset="100%"
stopColor="#2563eb"
stopOpacity="0"
/>


</linearGradient>

</defs>



<path
d="
M10 110
C60 95 80 100 120 75
C170 45 210 65 250 50
C300 30 340 55 410 20
L410 140
L10 140
Z
"
fill="url(#revenueGradient)"
/>



{/* Main Line */}

<path

d="
M10 110
C60 95 80 100 120 75
C170 45 210 65 250 50
C300 30 340 55 410 20
"

fill="none"

stroke="#2563eb"

strokeWidth="5"

strokeLinecap="round"

/>



{/* Data Points */}


<circle
cx="120"
cy="75"
r="6"
fill="#2563eb"
/>


<circle
cx="250"
cy="50"
r="6"
fill="#2563eb"
/>


<circle
cx="410"
cy="20"
r="6"
fill="#2563eb"
/>



</svg>


{/* Months */}

<div
className="
flex
justify-between
px-2
text-xs
text-slate-400
"
>

<span>Jan</span>
<span>Mar</span>
<span>May</span>
<span>Jul</span>
<span>Sep</span>

</div>


</div>

{/* Metrics */}


<div
className="
mt-6
space-y-4
"
>


{
metrics.map((item,index)=>(


<motion.div

key={index}

whileHover={{
scale:1.02
}}

className="
rounded-2xl
bg-blue-50/50
px-5
py-4
"

>


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


</motion.div>


))

}


</div>



</motion.div>



</div>


</section>

)

}