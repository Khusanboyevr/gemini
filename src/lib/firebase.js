
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAjS9rgXTe55XVXCoFfbTPFtg3P0K9dfQs",
    authDomain: "telegram-d19cf.firebaseapp.com",
    projectId: "telegram-d19cf",
    storageBucket: "telegram-d19cf.firebasestorage.app",
    messagingSenderId: "683725661716",
    appId: "1:683725661716:web:4e6a5703f0ca0de63ee901"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
