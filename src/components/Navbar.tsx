"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";


const links = [
  {
    name:"Platform",
    href:"#"
  },
  {
    name:"Solutions",
    href:"#"
  },
  {
    name:"Services",
    href:"#"
  },
  {
    name:"Resources",
    href:"#"
  },
];


export default function Navbar(){

return (

<motion.nav

initial={{
opacity:0,
y:-30
}}

animate={{
opacity:1,
y:0
}}

transition={{
duration:0.7
}}

className="
fixed
top-6
left-1/2
-translate-x-1/2
z-50
w-full
max-w-7xl
px-6
"

>


<div

className="
flex
items-center
justify-between

rounded-full

bg-white/85

backdrop-blur-xl

border
border-white

px-8
py-4

shadow-[0_20px_60px_rgba(15,23,42,0.12)]
"

>


{/* Logo */}

<Link
href="/"
className="
text-2xl
font-bold
tracking-tight
"
>

<span
className="
text-blue-600
"
>
WiseMed
</span>

<span
className="
text-slate-900
"
>
Billing
</span>


</Link>





{/* Navigation */}

<div

className="
hidden
md:flex
items-center
gap-9
text-sm
font-medium
text-slate-600
"

>


{
links.map((item)=>(

<motion.a

key={item.name}

href={item.href}

whileHover={{
y:-2,
color:"#2563eb"
}}

transition={{
duration:0.2
}}

className="
cursor-pointer
"

>

{item.name}

</motion.a>

))

}


</div>





{/* CTA */}

<Link
href="/consultation"
>

<motion.button

whileHover={{
scale:1.05
}}

whileTap={{
scale:0.98
}}

className="
flex
items-center
gap-2

rounded-full

bg-blue-600

px-6
py-3

font-semibold

text-white

shadow-lg
shadow-blue-200

transition

hover:bg-blue-700
"

>

Free RCM Audit

<ArrowRight
size={17}
/>


</motion.button>


</Link>



</div>


</motion.nav>


)

}