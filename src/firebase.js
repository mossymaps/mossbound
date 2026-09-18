import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAvc4Ha9A_DVNWTs8p8o2_1LFv8U5amUfs",
  authDomain: "mossy-maps.firebaseapp.com",
  projectId: "mossy-maps",
  storageBucket: "mossy-maps.firebasestorage.app",
  messagingSenderId: "27522367337",
  appId: "1:27522367337:web:94e45e24ed3218166ec7f8",
  measurementId: "G-MG8S9YHHLP"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
