import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Button } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import useAuth from '../hooks/useAuth';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import BranchManagement from '../screens/admin/BranchManagement';
import UserManagement from '../screens/admin/UserManagement';
import ServiceManagement from '../screens/admin/ServiceManagement';
import AppDrawer from '../components/AppDrawer';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Create navigators
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom component to wrap tab screens and sync header title
const TabScreen = ({ children, title, navigation }) => {
  useEffect(() => {
    // Use a layout effect to update the header title when this screen is focused
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({ headerTitle: title });
    }
  }, [navigation, title]);

  return children;
};

function AdminTabs() {
  // Use React state to track the current tab title
  const [currentTabTitle, setCurrentTabTitle] = useState('Dashboard');
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'AdminHome') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'BranchManagement') iconName = focused ? 'business' : 'business-outline';
          else if (route.name === 'UserManagement') iconName = focused ? 'people' : 'people-outline';
          else if (route.name === 'ServiceManagement') iconName = focused ? 'church' : 'church-outline';

          if (iconName === 'church' || iconName === 'church-outline') return <MaterialCommunityIcons name={'church'} size={size} color={color} />
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
      screenListeners={({ navigation }) => ({
        state: (e) => {
          // Get the active route name when navigation state changes
          const routes = e.data.state.routes;
          const index = e.data.state.index;
          const activeRouteName = routes[index].name;
          
          // Map route name to display title
          let title = 'Dashboard';
          switch(activeRouteName) {
            case 'AdminHome': title = 'Dashboard'; break;
            case 'ServiceManagement': title = 'Service'; break;
            case 'BranchManagement': title = 'Branch'; break;
            case 'UserManagement': title = 'User'; break;
          }
          
          // Update the drawer header title
          setCurrentTabTitle(title);
          const parent = navigation.getParent();
          if (parent) {
            parent.setOptions({ headerTitle: title });
          }
        }
      })}
    >
      <Tab.Screen 
        name="AdminHome" 
        options={{ 
          title: 'Dashboard', 
          headerShown: false 
        }}
      >
        {(props) => (
          <TabScreen {...props} title="Dashboard">
            <HomeScreen {...props} />
          </TabScreen>
        )}
      </Tab.Screen>
      
      <Tab.Screen 
        name="ServiceManagement" 
        options={{ 
          title: 'Service', 
          headerShown: false 
        }}
      >
        {(props) => (
          <TabScreen {...props} title="Service">
            <ServiceManagement {...props} />
          </TabScreen>
        )}
      </Tab.Screen>
      
      <Tab.Screen 
        name="BranchManagement" 
        options={{ 
          title: 'Branch', 
          headerShown: false 
        }}
      >
        {(props) => (
          <TabScreen {...props} title="Branch">
            <BranchManagement {...props} />
          </TabScreen>
        )}
      </Tab.Screen>
      
      <Tab.Screen 
        name="UserManagement" 
        options={{ 
          title: 'User', 
          headerShown: false 
        }}
      >
        {(props) => (
          <TabScreen {...props} title="User">
            <UserManagement {...props} />
          </TabScreen>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function MainDrawer() {
  const { signOut } = useAuth();

  return (
    <Drawer.Navigator
      initialRouteName="MainTabs"
      drawerContent={(props) => <AppDrawer {...props} signOut={signOut} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        drawerPosition: 'left',
        drawerType: 'front',
        drawerStyle: {
          backgroundColor: '#fff',
          width: 240,
        },
        headerLeft: () => (
          <Ionicons
            name="menu"
            size={24}
            color="#000"
            style={{ marginLeft: 16 }}
            onPress={() => navigation.openDrawer()}
          />
        ),
      })}
    >
      <Drawer.Screen 
        name="MainTabs" 
        component={AdminTabs} 
        options={{ 
          headerTitle: 'Dashboard',
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }} 
      />
    </Drawer.Navigator>
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
  const navigationRef = useNavigationContainerRef();

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
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : userData?.role === 'admin' ? (
          <Stack.Screen 
            name="Admin" 
            options={{ headerShown: false }}
          >
            {() => <MainDrawer />}
          </Stack.Screen>
        ) : (
          <Stack.Screen 
            name="Home" 
            component={MainDrawer} 
            options={{ headerShown: false }} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}