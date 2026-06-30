import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIciR901VZC6qf-VsJL1CgztOy0Obw1nU",
  authDomain: "ishan-proj.firebaseapp.com",
  projectId: "ishan-proj",
  storageBucket: "ishan-proj.firebasestorage.app",
  messagingSenderId: "1070639790876",
  appId: "1:1070639790876:web:c5f5f711bf6adcfe9458d9",
  measurementId: "G-KNR67VSRZ0"
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
