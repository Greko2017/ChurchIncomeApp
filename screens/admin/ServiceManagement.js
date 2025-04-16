import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Button, TextInput, Portal, Dialog, IconButton, Searchbar } from 'react-native-paper';
import { getAllServices, createService, updateService, deleteService, searchServices, getServicesByBranch } from '../../services/services';
import { getAllBranches } from '../../services/branches';
import { auth, db } from '../../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ServiceManagement() {
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    time: '',
    day: '',
    branchId: '',
    status: 'active'
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userBranch) {
      loadServices();
    }
  }, [userBranch]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('email', '==', auth.currentUser.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        if (userData.churchBranch) {
          const branchDoc = await getDoc(doc(db, 'branches', userData.churchBranch));
          if (branchDoc.exists()) {
            const branchData = { id: branchDoc.id, ...branchDoc.data() };
            setUserBranch(branchData);
            setEditForm(prev => ({ ...prev, branchId: branchData.id }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      setLoading(true);
      const fetchedServices = await getServicesByBranch(userBranch.id);
      setServices(fetchedServices);
    } catch (error) {
      console.error("Error loading services:", error);
      Alert.alert("Error", "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      if (query.trim()) {
        const results = await searchServices(query);
        // Filter results to only show services from the user's branch
        const filteredResults = results.filter(service => service.branchId === userBranch?.id);
        setServices(filteredResults);
      } else {
        loadServices();
      }
    } catch (error) {
      console.error("Search error:", error);
      Alert.alert("Error", "Failed to search services");
    }
  };

  const handleCreateService = () => {
    if (!userBranch) {
      Alert.alert("Error", "No branch assigned to user");
      return;
    }
    setEditForm({
      title: '',
      description: '',
      time: '',
      day: '',
      branchId: userBranch.id,
      status: 'active'
    });
    setCreateDialogVisible(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setEditForm({
      title: service.title,
      description: service.description || '',
      time: service.time,
      day: service.day,
      branchId: service.branchId,
      status: service.status || 'active'
    });
    setEditDialogVisible(true);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateService(selectedService.id, editForm);
      setEditDialogVisible(false);
      loadServices();
      Alert.alert("Success", "Service updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update service");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      await createService(editForm);
      setCreateDialogVisible(false);
      loadServices();
      Alert.alert("Success", "Service created successfully");
    } catch (error) {
      console.error("Create error:", error);
      Alert.alert("Error", "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId) => {
    Alert.alert(
      "Delete Service",
      "Are you sure you want to delete this service?",
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
              await deleteService(serviceId);
              loadServices();
              Alert.alert("Success", "Service deleted successfully");
            } catch (error) {
              console.error("Delete error:", error);
              Alert.alert("Error", "Failed to delete service");
            } finally {
              setLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {userBranch && (
        <View style={styles.branchInfo}>
          <Text style={styles.branchName}>Branch: {userBranch.name}</Text>
        </View>
      )}
      
      <Searchbar
        placeholder="Search services..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <Button 
        mode="contained" 
        onPress={handleCreateService}
        style={styles.createButton}
        icon="plus"
        disabled={!userBranch}
      >
        Create Service
      </Button>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.serviceCard}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceTitle}>{item.title}</Text>
                <Text style={styles.serviceDetail}>Day: {item.day}</Text>
                <Text style={styles.serviceDetail}>Time: {item.time}</Text>
                {item.description && (
                  <Text style={styles.serviceDescription}>{item.description}</Text>
                )}
                <Text style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#e8f5e9' : '#ffebee' }]}>
                  {item.status}
                </Text>
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
          <Dialog.Title>Edit Service</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title"
              value={editForm.title}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Description"
              value={editForm.description}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Day"
              value={editForm.day}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, day: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Time"
              value={editForm.time}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, time: text }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleUpdate} loading={loading}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Create New Service</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title"
              value={editForm.title}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, title: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Description"
              value={editForm.description}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, description: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Day"
              value={editForm.day}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, day: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Time"
              value={editForm.time}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, time: text }))}
              style={styles.dialogInput}
            />
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
  branchInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchBar: {
    marginBottom: 16,
    elevation: 2,
  },
  createButton: {
    marginBottom: 16,
    backgroundColor: '#2ecc71',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDetail: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  serviceDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
  },
  dialogInput: {
    marginBottom: 12,
  },
}); 