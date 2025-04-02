import React from 'react';
import { AuthProvider } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { PaperProvider } from 'react-native-paper';

export default function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </AuthProvider>
  );
}