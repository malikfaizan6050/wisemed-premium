"use client";

import { motion } from "framer-motion";
import DoctorHero from "./DoctorHero";
import Link from "next/link";

export default function Hero() {
  return (

<section
className="
relative
overflow-hidden
bg-[#f8fcff]
"
>


{/* GLOBAL SOFT MEDICAL BACKGROUND */}

<div
className="
absolute
inset-0
bg-[radial-gradient(circle_at_75%_35%,rgba(147,197,253,0.35),transparent_50%)]
"
/>


<div
className="
absolute
inset-0
bg-gradient-to-b
from-white
via-sky-50/40
to-blue-100/40
"
/>



{/* HERO WRAPPER */}

<div
className="
relative
z-10
mx-auto
grid
max-w-[1400px]
grid-cols-1
items-center
gap-6
px-8
pt-16
pb-16
grid-cols-1
lg:grid-cols-2
"
>



{/* LEFT CONTENT */}

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
duration:.8
}}

>





<h1
className="
mt-7
text-5xl
font-semibold
leading-[1.05]
tracking-tight
text-slate-900
lg:text-6xl
"
>

Your Trusted Partner

<br/>


<span
className="
text-blue-600
"
>
in Healthcare Revenue
</span>


<br/>

Cycle Management


</h1>




<p
className="
mt-6
max-w-xl
text-lg
leading-8
text-slate-600
"
>

WiseMedBilling helps hospitals and healthcare providers simplify billing operations, reduce claim denials, and improve reimbursements with reliable revenue cycle management solutions.

</p>




<div
className="
mt-9
flex
flex-wrap
gap-5
"
>


<Link href="/consultation">

<motion.button

whileHover={{
scale:1.05
}}

whileTap={{
scale:0.98
}}

className="
rounded-full
bg-blue-600
px-8
py-4
font-semibold
text-white
shadow-xl
shadow-blue-200
transition
hover:bg-blue-700
"
>

Free RCM Audit  

</motion.button>

</Link>



<button
className="
rounded-full
border
border-slate-200
bg-white/70
px-8
py-4
font-semibold
text-slate-700
backdrop-blur-xl
transition
hover:bg-white
"
>

Explore Platform

</button>


</div>





{/* SMALL TRUST NUMBERS */}

<div
className="
mt-10
flex
gap-12
"
>


<div>
<h3
className="
text-2xl
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
text-2xl
font-bold
text-blue-600
"
>
HIPAA
</h3>

<p
className="
text-sm
text-slate-500
"
>
Compliant
</p>

</div>




<div>
<h3
className="
text-2xl
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






{/* RIGHT SIDE */}

<motion.div

initial={{
opacity:0,
scale:.96
}}

animate={{
opacity:1,
scale:1
}}

transition={{
duration:1
}}

className="
relative
h-[560px]
overflow-visible
"

>

<DoctorHero />


</motion.div>



</div>



</section>

  );
}