import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc ,getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const registerUser = async (email, password, userData) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Set default churchBranch if not provided
    const userProfile = {
      name: userData.name,
      email: user.email,
      role: userData.role || 'member',
      churchBranch: userData.churchBranch || 'default_branch',
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
    // First authenticate with Firebase Auth
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    // console.log("user", user)
    // Then fetch user data from Firestore
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      // Return combined auth and user data
      return {
        ...user,
        ...userData,
        id: userDoc.id
      };
    } else {
      throw new Error('User data not found in Firestore');
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', user.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      return {
        ...user,
        ...userData,
        id: userDoc.id
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};