import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Text } from 'react-native-paper';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function AppDrawer(props) {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <DrawerContentScrollView 
      {...props} 
      style={[
        styles.container,
        Platform.OS === 'web' && styles.webContainer
      ]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.headerText}>CIMS</Text>
        {auth.currentUser && (
          <Text style={styles.userEmail}>{auth.currentUser.email}</Text>
        )}
      </View>
      <DrawerItemList {...props} />
      <View style={styles.bottomSection}>
        <DrawerItem
          label="Logout"
          icon={({ color, size }) => (
            <Ionicons name="log-out" size={size} color={color} />
          )}
          onPress={handleLogout}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flexGrow: 1,
  },
  webContainer: {
    width: 240,
    position: 'fixed',
    height: '100%',
    zIndex: 1,
  },
  header: {
    padding: 16,
    backgroundColor: '#2196F3',
    marginBottom: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#fff',
    marginTop: 4,
    opacity: 0.8,
  },
  bottomSection: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
}); 