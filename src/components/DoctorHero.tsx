"use client";

import Image from "next/image";
import { motion } from "framer-motion";


export default function DoctorHero() {

return (

<>


{/* Faded Healthcare Text */}

<div
className="
absolute
top-20
right-[-100px]
text-[150px]
font-black
tracking-tight
text-blue-100
opacity-30
select-none
z-0
"
>

HEALTHCARE

</div>





{/* Soft Blue Medical Atmosphere */}

<div
className="
absolute
inset-0
bg-gradient-to-br
from-transparent
via-blue-50/40
to-blue-100/40
z-0
"
/>




<div
className="
absolute
right-10
top-20
h-[550px]
w-[550px]
rounded-full
bg-gradient-to-b
from-white
via-blue-50/30
to-white
blur-[160px]
z-0
"
/>





{/* Doctor */}

<motion.div

initial={{
opacity:0,
y:60
}}

animate={{
opacity:1,
y:0
}}

transition={{
duration:1
}}


className="
absolute

bottom-[-70px]

right-[-70px]

h-[900px]

w-[700px]

z-10
"

>


<Image

src="/images/doctor.png"

alt="Healthcare Doctor"

fill

priority

sizes="600px"

className="
object-contain
object-bottom
scale-110
drop-shadow-[0_30px_60px_rgba(37,99,235,0.15)]
"

/>


</motion.div>







{/* TOP CARD */}


<motion.div

initial={{
opacity:0,
x:40
}}

animate={{
opacity:1,
x:0
}}

transition={{
duration:.8,
delay:.4
}}


className="
absolute

right-14

top-20

z-20

rounded-[28px]

bg-white/75

backdrop-blur-xl

px-6

py-4

shadow-[0_25px_60px_rgba(0,0,0,0.08)]

"

>


<p
className="
text-sm
text-slate-500
"
>

Healthcare Revenue

</p>


<h3
className="
text-2xl
font-bold
text-blue-600
"
>

RCM Experts

</h3>



<p
className="
text-sm
font-medium
text-green-600
"
>

✓ Trusted Billing Partner

</p>


</motion.div>









{/* CLAIM CARD */}



<motion.div

initial={{
opacity:0,
y:40
}}

animate={{
opacity:1,
y:0
}}

transition={{
duration:.8,
delay:.7
}}


className="
absolute

left-2

bottom-32

z-20

rounded-[28px]

bg-white/75

backdrop-blur-xl

px-5

py-4

shadow-[0_25px_60px_rgba(0,0,0,0.08)]

"

>


<p
className="
text-sm
text-slate-500
"
>

Insurance Claims

</p>


<h3
className="
text-4xl
font-bold
text-slate-900
"
>

99%

</h3>



<p
className="
text-sm
font-medium
text-green-600
"
>

✓ Accuracy Improved

</p>


</motion.div>








{/* Floating Dot */}

<motion.div

animate={{
y:[0,-15,0]
}}

transition={{
duration:4,
repeat:Infinity
}}

className="
absolute

right-24

bottom-44

h-5

w-5

rounded-full

bg-blue-400

shadow-lg

shadow-blue-200

z-20

"

/>



</>

);

}