import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Button, TextInput, Portal, Dialog, IconButton, Searchbar } from 'react-native-paper';
import { getAllBranches, createBranch, updateBranch, deleteBranch, searchBranches } from '../../services/branches';
import { getAllUsers, searchUsers, updateUser } from '../../services/users';
import UserRoleBadge from '../../components/UserRoleBadge';
import { getServicesByBranch } from '../../services/services';

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [assignDialogVisible, setAssignDialogVisible] = useState(false);
  const [branchSelectionVisible, setBranchSelectionVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    phone: '',
    status: 'active'
  });

  useEffect(() => {
    loadBranches();
    loadUsers();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      const fetchedBranches = await getAllBranches();
      setBranches(fetchedBranches);
    } catch (error) {
      console.error("Error loading branches:", error);
      alert("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    try {
      if (query.trim()) {
        const results = await searchBranches(query);
        setBranches(results);
      } else {
        loadBranches();
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleUserSearch = async (query) => {
    setUserSearchQuery(query);
    try {
      if (query.trim()) {
        const results = await searchUsers(query);
        setUsers(results);
      } else {
        loadUsers();
      }
    } catch (error) {
      console.error("User search error:", error);
    }
  };

  const handleAssignBranch = async (branchId) => {
    try {
      setLoading(true);
      await updateUser(selectedUser.id, {
        ...selectedUser,
        churchBranch: branchId
      });
      setBranchSelectionVisible(false);
      setAssignDialogVisible(false);
      setSelectedUser(null);
      await loadUsers();
      Alert.alert("Success", "Branch assigned successfully!");
    } catch (error) {
      console.error("Error assigning branch:", error);
      Alert.alert("Error", "Failed to assign branch");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = () => {
    setEditForm({
      name: '',
      address: '',
      phone: '',
      status: 'active'
    });
    setCreateDialogVisible(true);
  };

  const handleEdit = (branch) => {
    setSelectedBranch(branch);
    setEditForm({
      name: branch.name,
      address: branch.address || '',
      phone: branch.phone || '',
      status: branch.status || 'active'
    });
    setEditDialogVisible(true);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      await updateBranch(selectedBranch.id, editForm);
      setEditDialogVisible(false);
      loadBranches();
      alert("Branch updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update branch");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      await createBranch(editForm);
      setCreateDialogVisible(false);
      loadBranches();
      alert("Branch created successfully");
    } catch (error) {
      console.error("Create error:", error);
      alert("Failed to create branch");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchId) => {
    try {
      if (confirm("Are you sure you want to delete this branch?")) {
        setLoading(true);
        await deleteBranch(branchId);
        loadBranches();
        alert("Branch deleted successfully");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete branch");
    } finally {
      setLoading(false);
    }
  };

  const BranchCard = ({ branch, onEdit, onDelete }) => {
    const [services, setServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(false);
    const [showServices, setShowServices] = useState(false);

    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const branchServices = await getServicesByBranch(branch.id);
        setServices(branchServices);
      } catch (error) {
        console.error("Error loading services:", error);
        Alert.alert("Error", "Failed to load services for this branch");
      } finally {
        setLoadingServices(false);
      }
    };

    useEffect(() => {
      if (showServices) {
        loadServices();
      }
    }, [showServices]);

    return (
      <View style={styles.branchCard}>
        <View style={styles.branchInfo}>
          <Text style={styles.branchName}>{branch.name}</Text>
          <Text style={styles.branchDetail}>Address: {branch.address}</Text>
          <Text style={styles.branchDetail}>Phone: {branch.phone}</Text>
          <Text style={[styles.statusBadge, { backgroundColor: branch.status === 'active' ? '#e8f5e9' : '#ffebee' }]}>
            {branch.status}
          </Text>
          
          <Button
            mode="text"
            onPress={() => setShowServices(!showServices)}
            icon={showServices ? "chevron-up" : "chevron-down"}
            style={styles.servicesButton}
          >
            {showServices ? "Hide Services" : "Show Services"}
          </Button>

          {showServices && (
            <View style={styles.servicesContainer}>
              {loadingServices ? (
                <ActivityIndicator size="small" style={styles.loader} />
              ) : services.length > 0 ? (
                services.map(service => (
                  <View key={service.id} style={styles.serviceItem}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDetail}>Day: {service.day}</Text>
                    <Text style={styles.serviceDetail}>Time: {service.time}</Text>
                    {service.description && (
                      <Text style={styles.serviceDescription}>{service.description}</Text>
                    )}
                    <Text style={[styles.serviceStatus, { backgroundColor: service.status === 'active' ? '#e8f5e9' : '#ffebee' }]}>
                      {service.status}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noServicesText}>No services found for this branch</Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            onPress={() => onEdit(branch)}
          />
          <IconButton
            icon="delete"
            onPress={() => onDelete(branch.id)}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search branches..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <View style={styles.buttonContainer}>
        <Button 
          mode="contained" 
          onPress={() => setAssignDialogVisible(true)}
          style={[styles.button, styles.assignButton]}
          icon="account-arrow-right"
        >
          Assign Branch
        </Button>

        <Button 
          mode="contained" 
          onPress={handleCreateBranch}
          style={[styles.button, styles.createButton]}
          icon="plus"
        >
          Create Branch
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={branches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BranchCard branch={item} onEdit={handleEdit} onDelete={handleDelete} />
          )}
        />
      )}

      <Portal>
        <Dialog visible={editDialogVisible} onDismiss={() => setEditDialogVisible(false)}>
          <Dialog.Title>Edit Branch</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Branch Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Address"
              value={editForm.address}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, address: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Phone"
              value={editForm.phone}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleUpdate} loading={loading}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Create New Branch</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Branch Name"
              value={editForm.name}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, name: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Address"
              value={editForm.address}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, address: text }))}
              style={styles.dialogInput}
            />
            <TextInput
              label="Phone"
              value={editForm.phone}
              onChangeText={(text) => setEditForm(prev => ({ ...prev, phone: text }))}
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreate} loading={loading}>Create</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={assignDialogVisible} onDismiss={() => setAssignDialogVisible(false)}>
          <Dialog.Title>Select User</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder="Search users..."
              onChangeText={handleUserSearch}
              value={userSearchQuery}
              style={styles.dialogSearchBar}
            />
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              style={styles.dialogList}
              renderItem={({ item }) => {
                const userBranch = branches.find(b => b.id === item.churchBranch);
                return (
                  <View style={styles.userListItem}>
                    <View style={styles.userListInfo}>
                      <Text style={styles.userName}>{item.name}</Text>
                      <Text style={styles.userEmail}>{item.email}</Text>
                      <UserRoleBadge role={item.role} />
                      <Text style={styles.branchText}>
                        Current Branch: {userBranch ? userBranch.name : 'None'}
                      </Text>
                    </View>
                    <Button
                      mode="contained"
                      onPress={() => {
                        setSelectedUser(item);
                        setBranchSelectionVisible(true);
                      }}
                    >
                      Select
                    </Button>
                  </View>
                );
              }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAssignDialogVisible(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={branchSelectionVisible} onDismiss={() => setBranchSelectionVisible(false)}>
          <Dialog.Title>Select Branch for {selectedUser?.name}</Dialog.Title>
          <Dialog.Content>
            <FlatList
              data={branches}
              keyExtractor={(item) => item.id}
              style={styles.dialogList}
              renderItem={({ item }) => (
                <View style={styles.branchListItem}>
                  <View style={styles.branchListInfo}>
                    <Text style={styles.branchName}>{item.name}</Text>
                    {item.address && <Text style={styles.branchDetail}>Address: {item.address}</Text>}
                    {item.phone && <Text style={styles.branchDetail}>Phone: {item.phone}</Text>}
                    <Text style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#e8f5e9' : '#ffebee' }]}>
                      {item.status}
                    </Text>
                  </View>
                  <Button
                    mode="contained"
                    onPress={() => handleAssignBranch(item.id)}
                    loading={loading && selectedUser?.id === item.id}
                  >
                    Assign
                  </Button>
                </View>
              )}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setBranchSelectionVisible(false)}>Cancel</Button>
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
    backgroundColor: '#f5f5f5'
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
  createButton: {
    backgroundColor: '#2ecc71',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  branchDetail: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
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
  assignButton: {
    marginRight: 8,
    backgroundColor: '#3498db',
  },
  dialogSearchBar: {
    marginBottom: 16,
  },
  dialogList: {
    maxHeight: 400,
  },
  userListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userListInfo: {
    flex: 1,
    marginRight: 16,
  },
  branchListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  userEmail: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  branchText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  branchListInfo: {
    flex: 1,
    marginRight: 16,
  },
  servicesButton: {
    marginTop: 8,
  },
  servicesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  serviceItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  serviceDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  serviceStatus: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  noServicesText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    padding: 8,
  },
});