// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOPd8Wbr02Qfc4-lAm0Yw8_hScThteHYo",
  authDomain: "mindmapapp-f4b64.firebaseapp.com",
  projectId: "mindmapapp-f4b64",
  storageBucket: "mindmapapp-f4b64.appspot.com",
  messagingSenderId: "177274587651",
  appId: "1:177274587651:web:9faa639597e0bf7f3edc36",
  measurementId: "G-TBJY5KWH2W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Authentication management
export const db = getFirestore(app); // Firestore database
export const storage = getStorage(app); // Firebase storage
export default app;