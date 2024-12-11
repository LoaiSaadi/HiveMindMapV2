// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBOPd8Wbr02Qfc4-lAm0Yw8_hScThteHYo",
  authDomain: "mindmapapp-f4b64.firebaseapp.com",
  databaseURL: "https://mindmapapp-f4b64-default-rtdb.firebaseio.com",
  projectId: "mindmapapp-f4b64",
  storageBucket: "mindmapapp-f4b64.firebasestorage.app",
  messagingSenderId: "177274587651",
  appId: "1:177274587651:web:9faa639597e0bf7f3edc36",
  measurementId: "G-TBJY5KWH2W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // ניהול Authentication
export const db = getFirestore(app); // מסד נתונים Firestore
export default app;