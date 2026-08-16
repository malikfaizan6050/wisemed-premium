import { initializeApp } from "firebase/app";

import {
  getFirestore
} from "firebase/firestore";


import {
  getAuth
} from "firebase/auth";



// Your Firebase configuration

const firebaseConfig = {

apiKey: "AIzaSyAtcfnEX_g-JMGKO0fmktqH4yLmcklqgM4",

authDomain: "wisemedbilling-c0d0a.firebaseapp.com",

projectId: "wisemedbilling-c0d0a",

storageBucket: "wisemedbilling-c0d0a.firebasestorage.app",

messagingSenderId: "794729340465",

appId: "1:794729340465:web:ebfec190c2a6a17e503f10"

};





const app = initializeApp(firebaseConfig);




export const db = getFirestore(app);



export const auth = getAuth(app);