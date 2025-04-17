import React from 'react';
import { View, Text, Button, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Create navigators
const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Screen components
const HomeScreen = ({ navigation }) => (
  <View style={styles.screen}>
    <Text style={styles.title}>Dashboard</Text>
    <Button 
      title="Go to Details" 
      onPress={() => navigation.navigate('Details')}
    />
  </View>
);

const DetailsScreen = ({ navigation }) => (
  <View style={styles.screen}>
    <Text style={styles.title}>Details Screen</Text>
    <Button 
      title="Go back" 
      onPress={() => navigation.goBack()}
    />
  </View>
);

const BranchManagementScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Branch Management</Text>
  </View>
);

const UserManagementScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>User Management</Text>
  </View>
);

const ServiceManagementScreen = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Service Management</Text>
  </View>
);

const LoginScreen = ({signIn}) => {
  const [user, setUser] = React.useState(null);
  
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Login Screen</Text>
      <Button 
        title="Login" 
        onPress={() => signIn()} 
      />
    </View>
  );
};

// Custom drawer content component
const AppDrawer = (props) => (
  <View style={styles.drawerContent}>
    <Text style={styles.drawerHeader}>App Menu</Text>
    <View style={styles.drawerItems}>
      {props.state.routes.map((route, index) => (
        <Button
          key={route.key}
          title={route.name === 'MainTabs' ? 'Dashboard' : route.name}
          onPress={() => props.navigation.navigate(route.name)}
        />
      ))}
      <Button 
        title="Logout" 
        onPress={() => {
          // This would be where you handle logout
          props.signOut()
          props.navigation.navigate('Login');
        }} 
      />
    </View>
  </View>
);

// Stack navigator for Home tab
const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen name="Details" component={DetailsScreen} />
  </Stack.Navigator>
);

// Bottom Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeStack') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'BranchManagement') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'UserManagement') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'ServiceManagement') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: 'gray',
        headerShown: false
      })}
    >
      <Tab.Screen 
        name="HomeStack" 
        component={HomeStack} 
        options={{
          title: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="BranchManagement" 
        component={BranchManagementScreen} 
        options={{
          title: 'Branches',
        }}
      />
      <Tab.Screen 
        name="UserManagement" 
        component={UserManagementScreen} 
        options={{
          title: 'Users',
        }}
      />
      <Tab.Screen 
        name="ServiceManagement" 
        component={ServiceManagementScreen} 
        options={{
          title: 'Services',
        }}
      />
    </Tab.Navigator>
  );
}

// Root Navigator with Authentication
const RootNavigator = () => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // This will be your authentication logic
  const signIn = () => {
    console.log("signIn")
    setUser({ id: 1, name: 'User' });
  };

  const signOut = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} signIn={signIn} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainApp">
            {() => (
              <Drawer.Navigator
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
                  component={MainTabs} 
                  options={{ 
                    title: 'Dashboard',
                    drawerIcon: ({ color, size }) => (
                      <Ionicons name="home" size={size} color={color} />
                    ),
                  }} 
                />
              </Drawer.Navigator>
            )}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerContent: {
    flex: 1,
    padding: 16,
  },
  drawerHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  drawerItems: {
    marginTop: 10,
  },
});

export default RootNavigator;