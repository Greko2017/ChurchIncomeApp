import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import useAuth from '../hooks/useAuth';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/dashboard/HomeScreen';
import BranchManagement from '../screens/admin/BranchManagement';
import UserManagement from '../screens/admin/UserManagement';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'AdminHome') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'BranchManagement') iconName = focused ? 'business' : 'business-outline';
          else if (route.name === 'UserManagement') iconName = focused ? 'people' : 'people-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="AdminHome" component={HomeScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="BranchManagement" component={BranchManagement} />
      <Tab.Screen name="UserManagement" component={UserManagement} />
    </Tab.Navigator>
  );
}

async function initializeUserProfile(user) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const defaultProfile = {
      email: user.email,
      displayName: user.displayName || '',
      role: 'user', // Default role
      churchBranch: '', // Will need to be assigned by admin
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await setDoc(userRef, defaultProfile);
    return defaultProfile;
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw error;
  }
}

export default function AppNavigator() {
  const { user, loading: authLoading } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setUserData(null);
          return;
        }

        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);

        if (!snapshot.exists()) {
          console.log('User profile not found, initializing new profile...');
          const newProfile = await initializeUserProfile(user);
          setUserData(newProfile);
        } else {
          const data = snapshot.data();
          if (!data.role) {
            console.warn('User document missing role field');
            await setDoc(userRef, { role: 'user' }, { merge: true });
            setUserData({ ...data, role: 'user' });
          } else {
            setUserData(data);
          }
        }
      } catch (err) {
        console.error('Profile handling error:', err);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    handleUserProfile();
  }, [user]);

  if (authLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
        <Text style={{ textAlign: 'center', color: 'red', fontSize: 18 }}>{error}</Text>
        <Text style={{ textAlign: 'center', marginTop: 10 }}>
          {user ? `User ID: ${user.uid}` : 'Not authenticated'}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : userData?.role === 'admin' ? (
          <Stack.Screen 
            name="Admin" 
            component={AdminTabs} 
            options={{ headerShown: false }} 
          />
        ) : (
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}