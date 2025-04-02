import React, { createContext, useState, useEffect } from 'react';
import { auth } from '../config/firebase';

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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe; // Cleanup subscription
  }, []);

  const login = async (email, password) => {
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
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