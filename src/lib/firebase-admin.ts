import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";


if (
    !process.env.FIREBASE_ADMIN_PROJECT_ID ||
    !process.env.FIREBASE_ADMIN_CLIENT_EMAIL ||
    !process.env.FIREBASE_ADMIN_PRIVATE_KEY
) {
    throw new Error(
        "Missing Firebase Admin environment variables"
    );
}



const app =
    getApps().length === 0
        ? initializeApp({

            credential: cert({

                projectId:
                process.env.FIREBASE_ADMIN_PROJECT_ID,

                clientEmail:
                process.env.FIREBASE_ADMIN_CLIENT_EMAIL,

                privateKey:
                process.env.FIREBASE_ADMIN_PRIVATE_KEY
                .replace(/\\n/g,"\n")

            })

        })
        :
        getApps()[0];



export const db = getFirestore(app);