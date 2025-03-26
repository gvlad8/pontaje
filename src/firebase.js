import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configurarea aplicației Firebase
const firebaseConfig = {
 apiKey: "AIzaSyCJSWNeG15vEus3a_-LipJBvPugJmpf9bM",
  authDomain: "maiasisrl.firebaseapp.com",
  projectId: "maiasisrl",
  storageBucket: "maiasisrl.firebasestorage.app",
  messagingSenderId: "69213963031",
  appId: "1:69213963031:web:3b45812000b6f747756d52",
  measurementId: "G-723J8Z09W3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
