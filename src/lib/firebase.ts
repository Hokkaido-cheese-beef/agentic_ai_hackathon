import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

let _db: Firestore | null = null;

export function getDb(): Firestore {
  if (!_db) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    _db = getFirestore(app);
  }
  return _db;
}
