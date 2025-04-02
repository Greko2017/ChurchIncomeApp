import { initializeApp } from 'firebase/app';
import { 
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC3oLQI6_kNQUkQs_VcGOwp1AMOQigvdWU",
  authDomain: "church-income-management.firebaseapp.com",
  projectId: "church-income-management",
  storageBucket: "church-income-management.appspot.com",
  messagingSenderId: "261966109326",
  appId: "1:261966109326:web:523ea6dfbb1055d53547df"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);

// Export auth methods
export { 
  auth,
  db,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
};