import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Button } from 'react-native';
import { db } from '../../config/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function BranchManagement() {
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, 'branches'));
      const branchesList = [];
      querySnapshot.forEach((doc) => {
        branchesList.push({ id: doc.id, ...doc.data() });
      });
      setBranches(branchesList);
    } catch (error) {
      console.error("Error fetching branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const addBranch = async () => {
    if (!newBranch.trim()) return;
    
    try {
      setLoading(true);
      await addDoc(collection(db, 'branches'), {
        name: newBranch.trim(),
        createdAt: new Date(),
      });
      setNewBranch('');
      fetchBranches();
    } catch (error) {
      console.error("Error adding branch:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Church Branches</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter branch name"
          value={newBranch}
          onChangeText={setNewBranch}
        />
        <Button 
          title="Add" 
          onPress={addBranch} 
          disabled={loading || !newBranch.trim()}
        />
      </View>

      {loading && branches.length === 0 ? (
        <Text>Loading branches...</Text>
      ) : (
        <FlatList
          data={branches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.branchItem}>
              <Text>{item.name}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 8,
    marginRight: 8,
  },
  branchItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});