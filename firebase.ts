import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD82u8g2F5iOjUKJbDGCbYersue2Y7ag9c",
  authDomain: "cuaderno-mdf.firebaseapp.com",
  projectId: "cuaderno-mdf",
  storageBucket: "cuaderno-mdf.firebasestorage.app",
  messagingSenderId: "572000073170",
  appId: "1:572000073170:web:68e4cb81863730a6b7c40b",
  measurementId: "G-PS48TTFWCD"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
