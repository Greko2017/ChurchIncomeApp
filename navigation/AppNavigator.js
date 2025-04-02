import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import useAuth from '../hooks/useAuth';  // Import the hook
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/dashboard/HomeScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, loading } = useAuth();  // Proper hook usage

  if (loading) {
    return null; // Or loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}