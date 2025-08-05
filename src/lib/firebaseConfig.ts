// Import the functions you need from the SDKs
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// Optional: Uncomment below if you plan to use Auth
// import { getAuth } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCAuMZIM-pdIGVrPwc4sE5tpBQACgcY_Ks",
  authDomain: "hugepos-beed0.firebaseapp.com",
  projectId: "hugepos-beed0",
  storageBucket: "hugepos-beed0.firebasestorage.app",
  messagingSenderId: "1040281110757",
  appId: "1:1040281110757:web:fa040f5dfb139e6a0fac0c"
};

// Initialize Firebase safely (prevents double init)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
// const auth = getAuth(app); // Optional

export { db /*, auth */ };
