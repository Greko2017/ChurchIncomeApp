import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';
import { auth, db } from '../../config/firebase';
import UserRoleBadge from '../../components/UserRoleBadge';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const importUsers = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      if (result.type === 'success') {
        setLoading(true);
        const fileContent = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        const workbook = XLSX.read(fileContent, { type: 'base64' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const importedUsers = [];
        
        for (const userData of jsonData) {
          try {
            const { user } = await auth.createUserWithEmailAndPassword(
              userData.email,
              userData.password || 'church@123'
            );
            
            await db.collection('users').doc(user.uid).set({
              name: userData.name,
              email: userData.email,
              role: userData.role,
              churchBranch: userData.churchBranch,
              createdAt: new Date(),
            });
            
            importedUsers.push({ id: user.uid, ...userData });
          } catch (error) {
            console.error(`Error creating user ${userData.email}:`, error);
          }
        }
        
        setUsers(importedUsers);
        alert(`Successfully imported ${importedUsers.length} users`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import users");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button 
        mode="contained" 
        onPress={importUsers}
        loading={loading}
        style={styles.importButton}
      >
        Import Users from Excel
      </Button>
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.userCard}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text>{item.email}</Text>
            <UserRoleBadge role={item.role} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  importButton: {
    marginBottom: 16,
  },
  userCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
});