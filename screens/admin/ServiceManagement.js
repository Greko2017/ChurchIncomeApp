import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Button, TextInput, Portal, Dialog, IconButton, Searchbar, Card, Title } from 'react-native-paper';
import { getAllServices, createService, updateService, deleteService, searchServices, getServicesByBranch } from '../../services/services';
import { getAllBranches } from '../../services/branches';
import { db } from '../../config/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Import getAuth if not already imported
import { useNavigation } from '@react-navigation/native';


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
  const navigation = useNavigation();

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    if (userBranch) {
      loadServices();
    }
  }, [userBranch]);

  const fetchUserData = async () => {
    const auth = getAuth();
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

  const renderServiceCard = ({ item }) => {
    const hasDetails = item.serviceDetails;
    const isApproved = hasDetails && item.serviceDetails.status === 'approved';
    const isPending = hasDetails && item.serviceDetails.status === 'pending';
    
    // Calculate totals if details exist
    const incomeTotals = hasDetails ? {
      offering: item.serviceDetails.denominations.reduce((sum, d) => sum + (d.offering * d.value), 0),
      tithe: item.serviceDetails.denominations.reduce((sum, d) => sum + (d.tithe * d.value), 0),
      project: item.serviceDetails.denominations.reduce((sum, d) => sum + (d.project * d.value), 0),
      shiloh: item.serviceDetails.denominations.reduce((sum, d) => sum + (d.shiloh * d.value), 0),
      thanksgiving: item.serviceDetails.denominations.reduce((sum, d) => sum + (d.thanksgiving * d.value), 0)
    } : null;

    const grandTotal = incomeTotals ? 
      Object.values(incomeTotals).reduce((sum, val) => sum + val, 0) : 0;

    const attendanceTotal = hasDetails ? 
      item.serviceDetails.attendance.male + 
      item.serviceDetails.attendance.female + 
      item.serviceDetails.attendance.teenager + 
      item.serviceDetails.attendance.children : 0;

    return (
      <TouchableOpacity 
        style={styles.serviceCard}
        onPress={() => navigation.navigate('ServiceDetails', { serviceId: item.id })}
      >
        <View style={styles.serviceInfo}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceTitle}>{item.title}</Text>
            <View style={styles.statusContainer}>
              <Text style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#e8f5e9' : '#ffebee' }]}>
                {item.status}
              </Text>
              {hasDetails && (
                <Text style={[
                  styles.statusBadge,
                  { backgroundColor: isApproved ? '#e8f5e9' : isPending ? '#fff3e0' : '#ffebee' }
                ]}>
                  {isApproved ? 'Approved' : isPending ? 'Pending' : 'Rejected'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.serviceDetails}>
            <Text style={styles.serviceDetail}>Day: {item.day}</Text>
            <Text style={styles.serviceDetail}>Time: {item.time}</Text>
            {hasDetails && (
              <View style={styles.totalsRow}>
                <Text style={styles.serviceDetail}>Income: ₦{grandTotal.toLocaleString()}</Text>
                <Text style={styles.serviceDetail}>Attendance: {attendanceTotal}</Text>
              </View>
            )}
            {hasDetails && item.serviceDetails.counters && (
              <Text style={styles.serviceDetail}>
                Counters: {item.serviceDetails.counters.join(', ')}
              </Text>
            )}
            {isApproved && (
              <Text style={[styles.serviceDetail, styles.approvedBy]}>
                Approved By: {item.serviceDetails.approvedBy}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => handleEdit(item)}
          />
          <IconButton
            icon="delete"
            size={20}
            onPress={() => handleDelete(item.id)}
          />
        </View>
      </TouchableOpacity>
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
          renderItem={renderServiceCard}
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
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 10,
    textTransform: 'capitalize',
  },
  serviceDetails: {
    flex: 1,
  },
  serviceDetail: {
    color: '#666',
    fontSize: 12,
    marginBottom: 2,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  approvedBy: {
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dialogInput: {
    marginBottom: 12,
  },
}); 