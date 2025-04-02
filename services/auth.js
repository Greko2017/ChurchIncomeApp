import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const registerUser = async (email, password, userData) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      email: user.email,
      createdAt: new Date(),
    });
    
    return user;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

export const loginUser = async (email, password) => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};