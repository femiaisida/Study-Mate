// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.20.0/firebase-firestore.js";

// Your Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyDa9H7jtoOT_MpL26PvZG2tjwI_bXgOHoE",
  authDomain: "study-mate-67b09.firebaseapp.com",
  projectId: "study-mate-67b09",
  storageBucket: "study-mate-67b09.firebasestorage.app",
  messagingSenderId: "337194925163",
  appId: "1:337194925163:web:a767524e7e9c4652dd852e",
  measurementId: "G-ZFE21EXK56"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
