import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import IncomeForm from '../../components/IncomeForm';
import useAuth from '../../hooks/useAuth';
import { addIncomeRecord } from '../../services/income';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();

  const handleSubmit = async (formData) => {
    try {
      // Verify churchBranch exists
      if (!user?.churchBranch) {
        throw new Error('Please contact admin to assign you to a church branch');
      }

      const recordData = {
        denominations: formData.denominations || [],
        attendance: {
          male: Number(formData.attendance?.male) || 0,
          female: Number(formData.attendance?.female) || 0,
          teenager: Number(formData.attendance?.teenager) || 0,
          children: Number(formData.attendance?.children) || 0,
          nc: Number(formData.attendance?.nc) || 0
        },
        serviceTitle: formData.messageTitle || 'Sunday Service',
        preacher: formData.preacher || '',
        pastor: user.displayName || '',
        churchBranch: user.churchBranch // Now guaranteed to exist
      };

      await addIncomeRecord(recordData, user.uid);
      
      Alert.alert(
        'Success',
        'Income record submitted!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        'Submission Failed',
        error.message
      );
      console.error(error);
    }
  };

  // Show warning if no churchBranch
  if (!user?.churchBranch) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Your account is not assigned to any church branch.
        </Text>
        <Text style={styles.helpText}>
          Please contact your administrator to get assigned.
        </Text>
      </View>
    );
  }

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
    padding: 16,
    justifyContent: 'center'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  errorText: {
    color: 'red',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10
  },
  helpText: {
    textAlign: 'center',
    color: '#666'
  }
});