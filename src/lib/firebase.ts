import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDjPLQU8a3xt-MyaLQ6ZjxU0kYSt58HGSE",
  authDomain: "sollabstech-fbb8f.firebaseapp.com",
  databaseURL: "https://sollabstech-fbb8f-default-rtdb.firebaseio.com",
  projectId: "sollabstech-fbb8f",
  storageBucket: "sollabstech-fbb8f.firebasestorage.app",
  messagingSenderId: "445962516768",
  appId: "1:445962516768:web:e5d03e17940eda9d767f45",
  measurementId: "G-TTTWZR45Y8",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
export default app;
