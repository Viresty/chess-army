// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase } from "@firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDGrRViZ3zCuDxyvk1EeYTZGvJdNC_lElQ",
    authDomain: "dungeonkingviresty.firebaseapp.com",
    projectId: "dungeonkingviresty",
    storageBucket: "dungeonkingviresty.appspot.com",
    messagingSenderId: "783875634112",
    appId: "1:783875634112:web:93b217364a3855161f4e25",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };