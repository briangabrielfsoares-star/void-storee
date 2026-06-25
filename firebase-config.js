import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB9ANlp_RTQhyGm3I_AzccJwj3rK9nt0n0",
  authDomain: "void-13c0b.firebaseapp.com",
  projectId: "void-13c0b",
  storageBucket: "void-13c0b.firebasestorage.app",
  messagingSenderId: "1085505001635",
  appId: "1:1085505001635:web:50979c6d551d3b59518716"
};

export const ADMIN_EMAIL = "briangabrielfsoares@gmail.com";

export const FIREBASE_CONFIG_READY = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("SUA_") &&
  !firebaseConfig.projectId.includes("SEU_")
);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
