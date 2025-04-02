import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import IncomeForm from '../../components/IncomeForm';
import { useAuth } from '../../context/AuthContext';
import { addIncomeRecord } from '../../services/income';

export default function HomeScreen() {
  const { user } = useAuth();

  const handleSubmit = async (data) => {
    try {
      await addIncomeRecord(data, user.uid);
      alert('Income record submitted successfully!');
    } catch (error) {
      alert('Error submitting record: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Income Record</Text>
      <IncomeForm onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  }
});