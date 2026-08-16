"use client";

import {
  LucideIcon,
  TrendingUp
} from "lucide-react";


interface Props {

  title:string;

  value:string | number;

  icon:LucideIcon;

  description:string;

}



export default function StatsCard({

  title,
  value,
  icon:Icon,
  description

}:Props){


return (

<div

className="
group
relative
overflow-hidden
rounded-3xl
border
border-slate-200
bg-white
p-6
shadow-sm
transition-all
duration-300
hover:-translate-y-1
hover:shadow-xl
"

>


{/* subtle background glow */}

<div

className="
absolute
right-0
top-0
h-32
w-32
rounded-full
bg-blue-50
opacity-60
blur-3xl
"

 />





<div

className="
relative
flex
items-start
justify-between
"

>


<div>


<p

className="
text-sm
font-medium
text-slate-500
"

>

{title}

</p>




<div

className="
mt-3
flex
items-center
gap-3
"

>


<h2

className="
text-4xl
font-bold
tracking-tight
text-slate-900
"

>

{value}

</h2>



<div

className="
flex
items-center
gap-1
rounded-full
bg-emerald-50
px-2
py-1
text-xs
font-semibold
text-emerald-600
"

>

<TrendingUp size={12}/>

Active

</div>



</div>




<p

className="
mt-3
text-sm
leading-relaxed
text-slate-500
"

>

{description}

</p>



</div>







{/* ICON */}

<div

className="
rounded-2xl
bg-gradient-to-br
from-blue-50
to-blue-100
p-4
transition
duration-300
group-hover:scale-110
"

>


<Icon

size={28}

strokeWidth={2}

className="
text-blue-600
"

/>


</div>





</div>






{/* bottom indicator */}

<div

className="
mt-6
h-1
w-full
overflow-hidden
rounded-full
bg-slate-100
"

>

<div

className="
h-full
w-2/3
rounded-full
bg-blue-600
transition-all
duration-500
group-hover:w-full
"

/>


</div>





</div>


);


}