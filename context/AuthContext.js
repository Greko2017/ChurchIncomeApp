import React, { createContext, useState, useEffect } from 'react';
import { auth, signOut, onAuthStateChanged, signInWithEmailAndPassword } from '../config/firebase';

// import auth from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';

// Create the context
const AuthContext = createContext({
  user: null,
  loading: true,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
});

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => { //Pass auth instance
      setUser(user);
      setLoading(false);
    });
    return unsubscribe; // Cleanup subscription
  }, []);

  const login = async (email, password) => {
    
    console.log(email, password)

    try {
      await signInWithEmailAndPassword(auth, email, password); //Pass auth instance
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth); //Pass auth instance
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;