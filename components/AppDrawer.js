import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Drawer, Text } from 'react-native-paper';
import { auth } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';

export default function AppDrawer() {
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Church Income App</Text>
        {auth.currentUser && (
          <Text style={styles.userEmail}>{auth.currentUser.email}</Text>
        )}
      </View>
      <Drawer.Section>
        <Drawer.Item
          icon="home"
          label="Home"
          onPress={() => navigation.navigate('Home')}
        />
        <Drawer.Item
          icon="account-multiple"
          label="User Management"
          onPress={() => navigation.navigate('UserManagement')}
        />
        <Drawer.Item
          icon="office-building"
          label="Branch Management"
          onPress={() => navigation.navigate('BranchManagement')}
        />
        <Drawer.Item
          icon="cash-multiple"
          label="Income Records"
          onPress={() => navigation.navigate('IncomeRecords')}
        />
      </Drawer.Section>
      <Drawer.Section style={styles.bottomSection}>
        <Drawer.Item
          icon="logout"
          label="Logout"
          onPress={handleLogout}
        />
      </Drawer.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  },
  bottomSection: {
    marginTop: 'auto',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
}); 