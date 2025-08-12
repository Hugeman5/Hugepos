// Import the functions you need from the SDKs
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
// Optional: Uncomment below if you plan to use Auth
// import { getAuth } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDGgrDjgC4fhmj8zXdsNa2yb_NNM9jR0X8",
  authDomain: "hugepos-blazing-fast.firebaseapp.com",
  projectId: "hugepos-blazing-fast",
  storageBucket: "hugepos-blazing-fast.firebasestorage.app",
  messagingSenderId: "220653708464",
  appId: "1:220653708464:web:9c0a85d86fd0a7eab0c775"
};

// Initialize Firebase safely (prevents double init)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize App Check in browser before using other services
if (typeof window !== 'undefined') {
  // Debug token registered in Firebase Console for this Web App
  (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = 'EF8EFDA6-59DE-42DF-98E4-09B1AB424DEE';
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY || 'unused-in-debug'),
    isTokenAutoRefreshEnabled: true,
  });
}

const db = getFirestore(app);
// const auth = getAuth(app); // Optional

export { db /*, auth */ };
