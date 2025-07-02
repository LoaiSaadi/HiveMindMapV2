// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
// Your web app's Firebase configuration

// OLD
// const firebaseConfig = {
//   apiKey: "AIzaSyBOPd8Wbr02Qfc4-lAm0Yw8_hScThteHYo",
//   authDomain: "mindmapapp-f4b64.firebaseapp.com",
//   projectId: "mindmapapp-f4b64",
//   storageBucket: "mindmapapp-f4b64.appspot.com",
//   messagingSenderId: "177274587651",
//   appId: "1:177274587651:web:9faa639597e0bf7f3edc36",
//   measurementId: "G-TBJY5KWH2W"
// };

const firebaseConfig = {
  apiKey: "AIzaSyDda5MUmTcGFqT8uuc7K-AS2zGTEWfw3Fo",
  authDomain: "hivemindmap-a47bd.firebaseapp.com",
  databaseURL: "https://hivemindmap-a47bd-default-rtdb.firebaseio.com",
  projectId: "hivemindmap-a47bd",
  storageBucket: "hivemindmap-a47bd.firebasestorage.app",
  messagingSenderId: "376543632813",
  appId: "1:376543632813:web:1b8196ed63957245279524"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Authentication management
export const db = getFirestore(app); // Firestore database
export const storage = getStorage(app); // Firebase storage
export const rtdb = getDatabase(app); // Realtime Database for online tracking
export default app;