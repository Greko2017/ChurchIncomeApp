import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import XLSX from 'xlsx';
import { auth, db } from '../../config/firebase';
import UserRoleBadge from '../../components/UserRoleBadge';
import { Button, TextInput, Portal, Dialog, IconButton, Searchbar, Menu } from 'react-native-paper';
import { getAllUsers, updateUser, deleteUser, searchUsers } from '../../services/users';
import { getAllBranches } from '../../services/branches';


export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [branchMenuVisible, setBranchMenuVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: '',
    churchBranch: ''
  });

  // Load users and branches on component mount
  useEffect(() => {
    loadUsers();
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      const fetchedBranches = await getAllBranches();
      console.log("\n\n -- In loadBranches fetchedBranches", fetchedBranches)
      setBranches(fetchedBranches);
    } catch (error) {
      console.error("Error loading branches:", error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      if (query.trim()) {
        const results = await searchUsers(query);
        setUsers(results);
      } else {
        loadUsers();
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleCreateUser = () => {
    setEditForm({
      name: '',
      email: '',
      role: '',
      churchBranch: ''
    });
    setCreateDialogVisible(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      churchBranch: user.churchBranch
    });
    setEditDialogVisible(true);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const selectedBranch = branches.find(b => b.name === editForm.churchBranch);
      await updateUser(selectedUser.id, {
        ...editForm,
        churchBranch: selectedBranch ? selectedBranch.id : null
      });
      setEditDialogVisible(false);
      loadUsers();
      Alert.alert("Success", "User updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update user");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const selectedBranch = branches.find(b => b.name === editForm.churchBranch);
      const { user } = await auth.createUserWithEmailAndPassword(
        editForm.email,
        editForm.password
      );
      
      await db.collection('users').doc(user.uid).set({
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        churchBranch: selectedBranch ? selectedBranch.id : null,
        createdAt: new Date().toISOString(),
      });
      
      setCreateDialogVisible(false);
      loadUsers();
      Alert.alert("Success", "User created successfully");
    } catch (error) {
      console.error("Create error:", error);
      Alert.alert("Error", error.message || "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      Alert.alert(
        "Delete User",
        "Are you sure you want to delete this user?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            onPress: async () => {
              try {
                setLoading(true);
                await deleteUser(userId);
                loadUsers();
                Alert.alert("Success", "User deleted successfully");
              } catch (error) {
                console.error("Delete error:", error);
                Alert.alert("Error", "Failed to delete user");
              } finally {
                setLoading(false);
              }
            },
            style: "destructive"
          }
        ]
      );
    } catch (error) {
      console.error("Delete error:", error);
      Alert.alert("Error", "Failed to delete user");
    }
  };

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
        
        loadUsers();
        alert(`Successfully imported ${importedUsers.length} users`);
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import users");
    } finally {
      setLoading(false);
    }
  };

  const renderBranchDropdown = () => {
    // console.log('branches', branches)
    const selectedBranch = branches.find(b => b.id === editForm.churchBranch);
    return (
      <View>
        {/* <Text>{JSON.stringify(branchMenuVisible)}</Text> */}
        <Button
          mode="outlined"
          onPress={() => setBranchMenuVisible(true)}
          style={styles.dropdownButton}
        >
          {selectedBranch ? selectedBranch.name : 'Select Branch'}
        </Button>
        
        <Button 
          mode="contained" 
          onPress={handleCreateUser}
          style={[styles.button, styles.createButton]}
          icon="plus"
        >
          Create User
        </Button>

        <Menu
          visible={true}
          onDismiss={() => setBranchMenuVisible(false)}
          anchor={<View />}
        >
          {branches.map((branch) => (
            <Menu.Item
              key={branch.id}
              onPress={() => {
                setEditForm(prev => ({ ...prev, churchBranch: branch.id }));
                setBranchMenuVisible(false);
              }}
              title={branch.name}
            />
          ))}
        </Menu>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search users..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={importUsers}
          loading={loading}
          style={[styles.button, styles.importButton]}
        >
          Import Users from Excel
        </Button>

        <Button 
          mode="contained" 
          onPress={handleCreateUser}
          style={[styles.button, styles.createButton]}
          icon="plus"
        >
          Create User
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.name}</Text>
                <Text>{item.email}</Text>
                <UserRoleBadge role={item.role} />
                <Text style={styles.branchText}>Branch: {item.churchBranch}</Text>
              </View>
              <View style={styles.actions}>
                <IconButton
                  icon="pencil"
                  onPress={() => handleEdit(item)}
                />
                <IconButton
                  icon="delete"
                  onPress={() => handleDelete(item.id)}
                />
              </View>
            </View>
          )}
        />
      )}

      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edit User</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Role"
              value={editForm.role}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, role: text }))}
              style={styles.dialogInput}
            />
            {renderBranchDropdown()}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleUpdate} loading={loading}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Create New User</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Email"
              value={editForm.email}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, email: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Password"
              secureTextEntry
              onChangeText={(text) => setEditForm(prev => ({ ...prev, password: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Role"
              value={editForm.role}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, role: text }))}
              style={styles.dialogInput}
            />
            {renderBranchDropdown()}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreate} loading={loading}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
  },
  importButton: {
    marginRight: 8,
  },
  createButton: {
    marginLeft: 8,
    backgroundColor: '#2ecc71',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  branchText: {
    color: '#666',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  dialogInput: {
    marginBottom: 12,
  },
  dropdownButton: {
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
  },
});