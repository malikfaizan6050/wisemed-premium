"use client";

import {
  Mail,
  Phone,
} from "lucide-react";
import Link from "next/link";

const solutions = [
  "Medical Billing",
  "Claims Management",
  "Denial Management",
  "Revenue Cycle Management",
];


const company = [
  "About Us",
  "Contact",
  "Privacy Policy",
  "HIPAA Notice",
];


export default function Footer(){

return (

<footer
className="
relative
border-t
border-slate-200
bg-white
pt-8
pb-4
overflow-hidden
"
>


{/* soft glow */}

<div
className="
absolute
right-[-150px]
bottom-[-150px]
h-[300px]
w-[300px]
rounded-full
bg-gradient-to-b
from-white
via-blue-50/30
to-white
blur-3xl
"
/>



<div
className="
relative
mx-auto
max-w-6xl
px-6
lg:px-8
"
>



<div
className="
grid
gap-6
md:grid-cols-3
"
>



{/* BRAND */}

<div>


<h2
className="
text-xl
font-bold
text-slate-900
"
>

<span className="text-blue-600">
WiseMed
</span>
Billing

</h2>


<div
className="
mt-4
space-y-2
text-sm
text-slate-600
"
>



<div className="flex items-center gap-3">

<Mail
size={17}
className="text-blue-600"
/>

support@wisemedbilling.com

</div>



<div className="flex items-center gap-3">

<Phone
size={17}
className="text-blue-600"
/>

+1 (800) 555-0199

</div>


</div>


</div>





{/* SOLUTIONS */}

<div>


<h3
className="
font-semibold
text-slate-900
"
>

Solutions

</h3>



<ul
className="
mt-5
space-y-3
"
>

{
solutions.map(item=>(

<li
key={item}
className="
text-sm
text-slate-600
hover:text-blue-600
cursor-pointer
"
>

{item}

</li>

))
}

</ul>


</div>





{/* COMPANY */}

<div>


<h3
className="
font-semibold
text-slate-900
"
>

Company

</h3>



<ul
className="
mt-5
space-y-3
"
>

{
company.map(item=>(

<li
key={item}
className="
text-sm
text-slate-600
hover:text-blue-600
cursor-pointer
"
>

{item}

</li>

))
}

</ul>


</div>


</div>





{/* BOTTOM */}

<div
className="
mt-5
flex
flex-col
justify-between
gap-4
border-t
border-slate-200
pt-5
text-sm
text-slate-500
md:flex-row
"
>


<p>

© {new Date().getFullYear()} WiseMedBilling. All rights reserved.

</p>



<div
className="
flex
gap-5
"
>

<span>
Privacy
</span>

<span>
Terms
</span>

<span>
HIPAA
</span>


</div>



</div>




</div>



</footer>

);

}