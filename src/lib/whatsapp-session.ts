import {
    doc,
    getDoc,
    setDoc,
    updateDoc
} from "firebase/firestore";

import {
    db
} from "./firebase";


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


    const snap = await getDoc(ref);



    if(snap.exists()){

        return snap.data() as WhatsAppSession;

    }



    const session:WhatsAppSession={


        phone,


        data:{},


        updatedAt:
        Date.now()

    };



    await setDoc(
        ref,
        session
    );


    return session;

}






export async function saveSession(
    phone:string,
    data:any,
    lastMessage?:string
){


    const ref = doc(
        db,
        "whatsapp_sessions",
        phone
    );



    await updateDoc(
        ref,
        {

            data,

            lastMessage,

            updatedAt:
            Date.now()

        }
    );

}