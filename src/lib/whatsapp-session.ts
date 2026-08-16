import { db } from "./firebase-admin";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "firebase/firestore";



export interface WhatsAppSession {


    phone:string;


    data:any;


    lastMessage?:string;


    updatedAt:number;

}




export async function getSession(
    phone:string
):Promise<WhatsAppSession>{


    const ref = doc(
        db,
        "whatsapp_sessions",
        phone
    );


    const snapshot = await getDoc(ref);



    if(snapshot.exists()){

        return snapshot.data() as WhatsAppSession;

    }



    const newSession:WhatsAppSession={

        phone,

        data:{},

        updatedAt:Date.now()

    };



    await setDoc(
        ref,
        newSession
    );


    return newSession;


}





export async function saveSession(
    phone:string,
    data:any
){


    const ref = doc(
        db,
        "whatsapp_sessions",
        phone
    );


    await setDoc(
        ref,
        {

            phone,

            data,

            updatedAt:Date.now()

        },

        {
            merge:true
        }

    );


}





export async function updateMessage(
    phone:string,
    message:string
){


    const ref = doc(
        db,
        "whatsapp_sessions",
        phone
    );


    await updateDoc(
        ref,
        {

            lastMessage:message,

            updatedAt:Date.now()

        }
    );

}