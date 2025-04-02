import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import useAuth from '../hooks/useAuth';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/dashboard/HomeScreen';
import CountingUnitHomeScreen from '../screens/dashboard/CountingUnitHomeScreen'; // New screen for counting_unit
import BranchManagement from '../screens/admin/BranchManagement';
import UserManagement from '../screens/admin/UserManagement';
import { Ionicons } from '@expo/vector-icons';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Admin tabs navigator
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'AdminHome') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'BranchManagement') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'UserManagement') {
            iconName = focused ? 'people' : 'people-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="AdminHome" 
        component={HomeScreen} 
        options={{ title: 'Dashboard', headerShown: false }} 
      />
      <Tab.Screen 
        name="BranchManagement" 
        component={BranchManagement} 
        options={{ title: 'Branches' }} 
      />
      <Tab.Screen 
        name="UserManagement" 
        component={UserManagement} 
        options={{ title: 'Users' }} 
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            {user.role === 'admin' ? (
              <Stack.Screen 
                name="AdminDashboard" 
                component={AdminTabs} 
                options={{ headerShown: false }} 
              />
            ) : user.role === 'counting_unit' ? (
              <Stack.Screen 
                name="CountingUnitHome" 
                component={CountingUnitHomeScreen} 
                options={{ headerShown: false }} 
              />
            ) : (
              <Stack.Screen 
                name="Home" 
                component={HomeScreen} 
                options={{ headerShown: false }} 
              />
            )}
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}