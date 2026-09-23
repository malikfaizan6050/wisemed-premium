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
px-5
pt-28
pb-12
sm:px-8
sm:pt-32
sm:pb-16
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
text-3xl
font-semibold
leading-[1.15]
tracking-tight
text-slate-900
sm:text-4xl
sm:leading-[1.05]
md:text-5xl
lg:text-6xl
"
>

Your Trusted Partner

{/* The forced breaks are for the desktop composition. On a phone they
    fought the natural wrapping and left single words stranded on their
    own lines, so the text wraps freely below the sm breakpoint. */}
<br className="hidden sm:inline"/>
{" "}

<span
className="
text-blue-600
"
>
in Healthcare Revenue
</span>

<br className="hidden sm:inline"/>
{" "}

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



<Link
href="/solutions"
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

</Link>


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
h-[340px]
overflow-hidden
sm:h-[460px]
lg:h-[560px]
lg:overflow-visible
"

>

{/* The artwork is composed to spill past this box on desktop, which is
    why overflow is visible there. On smaller screens that spill runs off
    the side of the phone, so it is clipped and the box is shorter. */}
<DoctorHero />


</motion.div>



</div>



</section>

  );
}
