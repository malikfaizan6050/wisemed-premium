import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";


export async function POST(request:Request){

try {


const data = await request.json();



await addDoc(
collection(db,"consultations"),
{

...data,

createdAt:serverTimestamp()

}

);



return NextResponse.json({

success:true

});


}

catch(error){


console.log(error);


return NextResponse.json({

success:false

},
{
status:500
});


}


}