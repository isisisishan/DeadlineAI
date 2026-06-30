import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMyBlpAR6b7tEiRG6BOfmTRNSJ1PvaHkI",
  authDomain: "deadlineai-b31b9.firebaseapp.com",
  projectId: "deadlineai-b31b9",
  storageBucket: "deadlineai-b31b9.firebasestorage.app",
  messagingSenderId: "61649394797",
  appId: "1:61649394797:web:cc76531d04a0e89fca7364"
};

// Always configured with hardcoded keys
const isFirebaseConfigured = true;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log("Firebase initialized successfully.");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.warn("Firebase credentials missing. Running in Mock/Local Mode.");
}

export { app, auth, db, isFirebaseConfigured };
