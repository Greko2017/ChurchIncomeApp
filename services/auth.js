import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const registerUser = async (email, password, userData) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set default churchBranch if not provided
    const userProfile = {
      name: userData.name,
      email: user.email,
      role: userData.role || 'member',
      churchBranch: userData.churchBranch || 'default_branch', // Add default
      createdAt: new Date()
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    return user;
  } catch (error) {
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