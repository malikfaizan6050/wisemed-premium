"use client";

import Image from "next/image";
import { motion } from "framer-motion";


export default function DoctorHero() {

return (

<>


{/* Faded Healthcare Text */}

{/* Purely decorative. Hidden on phones, where a 150px word overlapped the
    real content and added nothing but noise. */}
<div
className="
absolute
top-20
hidden
right-[-60px]
text-[90px]
font-black
tracking-tight
text-blue-100
opacity-30
select-none
z-0
sm:block
lg:right-[-100px]
lg:text-[150px]
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

bottom-0

inset-x-0

h-full

w-full

z-10

lg:inset-x-auto

lg:bottom-[-70px]

lg:right-[-70px]

lg:h-[900px]

lg:w-[700px]
"

>


<Image

src="/images/doctor.png"

alt="Doctor supported by WiseMedBilling healthcare revenue cycle management services"

fill

priority

sizes="(max-width: 1024px) 100vw, 700px"

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

right-2

top-3

z-20

rounded-2xl

bg-white/75

backdrop-blur-xl

px-3

py-2

shadow-[0_25px_60px_rgba(0,0,0,0.08)]

sm:right-8

sm:top-12

sm:rounded-[28px]

sm:px-6

sm:py-4

lg:right-14

lg:top-20

"

>


<p
className="
text-[11px]
text-slate-500
sm:text-sm
"
>

Healthcare Revenue

</p>


<h3
className="
text-base
font-bold
text-blue-600
sm:text-2xl
"
>

RCM Experts

</h3>



<p
className="
text-[11px]
font-medium
text-green-600
sm:text-sm
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

bottom-3

z-20

rounded-2xl

bg-white/75

backdrop-blur-xl

px-3

py-2

shadow-[0_25px_60px_rgba(0,0,0,0.08)]

sm:bottom-16

sm:rounded-[28px]

sm:px-5

sm:py-4

lg:bottom-32

"

>


<p
className="
text-[11px]
text-slate-500
sm:text-sm
"
>

Insurance Claims

</p>


<h3
className="
text-xl
font-bold
text-slate-900
sm:text-4xl
"
>

99%

</h3>



<p
className="
text-[11px]
font-medium
text-green-600
sm:text-sm
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
