import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { db } from '../config/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import BranchAssignmentModal from './BranchAssignmentModal'; // We'll create this next

export default function BranchManagement() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [branches, setBranches] = useState([
    'main_branch',
    'akwa_north',
    'bonewonda'
  ]);

  useEffect(() => {
    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() });
      });
      setUsers(usersList);
    };
    fetchUsers();
  }, []);

  const handleAssignBranch = async (userId, branch) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        churchBranch: branch
      });
      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, churchBranch: branch } : user
      ));
      setSelectedUser(null);
      alert('Branch assigned successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Branch Assignment</Text>
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.userCard}
            onPress={() => setSelectedUser(item)}
          >
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={[
              styles.branchText,
              !item.churchBranch && styles.missingBranch
            ]}>
              {item.churchBranch || 'No branch assigned'}
            </Text>
          </TouchableOpacity>
        )}
      />

      {selectedUser && (
        <BranchAssignmentModal
          visible={!!selectedUser}
          user={selectedUser}
          branches={branches}
          onAssign={handleAssignBranch}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  userCard: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    elevation: 2
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginVertical: 4
  },
  branchText: {
    fontSize: 14,
    color: 'green'
  },
  missingBranch: {
    color: 'red'
  }
});