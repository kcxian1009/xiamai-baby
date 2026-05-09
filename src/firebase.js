import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAKotnQAkTIw0xzFbUfyzzyJrkvQlu3sdY",
  authDomain: "baby-tracker-24c55.firebaseapp.com",
  databaseURL: "https://baby-tracker-24c55-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "baby-tracker-24c55",
  storageBucket: "baby-tracker-24c55.firebasestorage.app",
  messagingSenderId: "597912443229",
  appId: "1:597912443229:web:433e44575f93e7a68af0b4"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);