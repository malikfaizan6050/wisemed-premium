"use client";


import {
  useState,
  useEffect
} from "react";


import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "firebase/auth";


import {
  auth
} from "@/lib/firebase";


import {
  useRouter
} from "next/navigation";





export default function Login(){


const router = useRouter();



const [email,setEmail] = useState("");

const [password,setPassword] = useState("");

const [loading,setLoading] = useState(false);

const [error,setError] = useState("");

const [checking,setChecking] = useState(true);






// If already logged in
useEffect(()=>{


const unsubscribe = onAuthStateChanged(
auth,
(user)=>{


if(user){

router.replace("/dashboard");

}
else{

setChecking(false);

}


}

);



return ()=>unsubscribe();



},[router]);









const handleLogin = async(
e:React.FormEvent
)=>{


e.preventDefault();


setError("");

setLoading(true);



try{


await signInWithEmailAndPassword(
auth,
email,
password
);



router.replace("/dashboard");



}
catch(err:any){



console.error(err);



setError(
"Invalid email or password"
);



}
finally{


setLoading(false);


}



};









if(checking){


return (

<main className="
min-h-screen
flex
items-center
justify-center
bg-slate-50
">


<p className="
text-slate-600
text-lg
">

Checking authentication...

</p>


</main>


);


}









return (

<main

className="
min-h-screen
bg-slate-50
flex
items-center
justify-center
p-6
"

>


<div

className="
w-full
max-w-md
rounded-3xl
bg-white
border
border-slate-200
shadow-xl
p-8
"

>


<h1

className="
text-3xl
font-bold
text-slate-900
"

>

WiseMedBilling CRM

</h1>



<p

className="
mt-2
text-slate-600
"

>

Healthcare provider management portal

</p>






<form

onSubmit={handleLogin}

className="
mt-8
space-y-5
"

>



<div>


<label

className="
text-sm
font-medium
text-slate-700
"

>

Email Address

</label>



<input

type="email"

value={email}

onChange={(e)=>
setEmail(e.target.value)
}

placeholder="admin@wisemedbilling.com"

className="
mt-2
w-full
rounded-xl
border
border-slate-300
px-4
py-3
outline-none
focus:border-blue-600
"

/>


</div>







<div>


<label

className="
text-sm
font-medium
text-slate-700
"

>

Password

</label>



<input

type="password"

value={password}

onChange={(e)=>
setPassword(e.target.value)
}

placeholder="••••••••"

className="
mt-2
w-full
rounded-xl
border
border-slate-300
px-4
py-3
outline-none
focus:border-blue-600
"

/>


</div>









{
error && (

<div

className="
rounded-xl
bg-red-50
px-4
py-3
text-sm
text-red-600
"

>

{error}

</div>


)

}








<button

disabled={loading}

type="submit"

className="
w-full
rounded-xl
bg-blue-600
py-3
font-semibold
text-white
transition
hover:bg-blue-700
disabled:opacity-50
"

>


{
loading

?

"Signing in..."

:

"Login"

}



</button>





</form>






</div>


</main>


);


}