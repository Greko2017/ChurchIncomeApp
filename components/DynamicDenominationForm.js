import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Button } from 'react-native-paper';
import { getDefaultDenominations } from '../services/denominations';
import { addIncomeRecord } from '../services/income';

const IncomeForm = ({ user }) => {
  const [formData, setFormData] = useState({
    denominations: [],
    attendance: {
      male: 0,
      female: 0,
      teenager: 0,
      children: 0,
      nc: 0,
      total: 0
    },
    messageTitle: '',
    preacher: '',
    pastor: user?.displayName || '',
    churchBranch: user?.churchBranch || '',
    status: 'pending',
    approvals: {
      counting_unit: false,
      approver: false,
      receiver: false
    }
  });

  // Load default denominations
  useEffect(() => {
    const loadDenominations = async () => {
      const defaultDenoms = await getDefaultDenominations();
      setFormData(prev => ({
        ...prev,
        denominations: defaultDenoms.map(d => ({
          ...d,
          qty: 0,
          total: 0
        }))
      }));
    };
    loadDenominations();
  }, []);

  const handleQtyChange = (value, text) => {
    const qty = parseInt(text) || 0;
    setFormData(prev => ({
      ...prev,
      denominations: prev.denominations.map(d => 
        d.value === value ? { ...d, qty, total: qty * d.value } : d
      )
    }));
  };

  const handleAttendanceChange = (field, text) => {
    const value = parseInt(text) || 0;
    setFormData(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [field]: value,
        total: Object.values({
          ...prev.attendance,
          [field]: value
        }).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0)
      }
    }));
  };

  const handleAddDenomination = () => {
    const value = parseInt(newDenominationValue) || 0;
    if (value > 0 && !formData.denominations.some(d => d.value === value)) {
      setFormData(prev => ({
        ...prev,
        denominations: [
          ...prev.denominations,
          {
            value,
            label: `₦${value.toLocaleString()}`,
            qty: 0,
            total: 0
          }
        ]
      }));
      setNewDenominationValue('');
    }
  };

  const handleSubmit = async () => {
    try {
      await addIncomeRecord({
        ...formData,
        createdBy: user.uid,
        createdAt: new Date()
      });
      alert('Income record submitted successfully!');
    } catch (error) {
      console.error("Submission error:", error);
      alert('Error submitting record: ' + error.message);
    }
  };

  const [newDenominationValue, setNewDenominationValue] = useState('');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Service Information</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Title of the Message"
        value={formData.messageTitle}
        onChangeText={text => setFormData(prev => ({ ...prev, messageTitle: text }))}
      />

      <TextInput
        style={styles.input}
        placeholder="Preacher's Name"
        value={formData.preacher}
        onChangeText={text => setFormData(prev => ({ ...prev, preacher: text }))}
      />

      <Text style={styles.sectionHeader}>Money Received</Text>
      
      {formData.denominations.map(denom => (
        <View key={denom.value} style={styles.denominationRow}>
          <Text>{denom.label}:</Text>
          <TextInput
            style={styles.qtyInput}
            keyboardType="numeric"
            value={denom.qty.toString()}
            onChangeText={text => handleQtyChange(denom.value, text)}
          />
          <Text>Total: ₦{denom.total.toLocaleString()}</Text>
        </View>
      ))}

      <View style={styles.addDenominationRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Add new denomination (e.g. 200)"
          value={newDenominationValue}
          onChangeText={setNewDenominationValue}
          keyboardType="numeric"
        />
        <Button 
          mode="outlined" 
          onPress={handleAddDenomination}
          style={styles.addButton}
        >
          Add
        </Button>
      </View>

      <Text style={styles.sectionHeader}>Attendance</Text>
      
      {['male', 'female', 'teenager', 'children', 'nc'].map(field => (
        <View key={field} style={styles.attendanceRow}>
          <Text style={styles.attendanceLabel}>
            {field.charAt(0).toUpperCase() + field.slice(1)}:
          </Text>
          <TextInput
            style={styles.attendanceInput}
            keyboardType="numeric"
            value={formData.attendance[field].toString()}
            onChangeText={text => handleAttendanceChange(field, text)}
          />
        </View>
      ))}

      <Text style={styles.totalAttendance}>
        Total Attendance: {formData.attendance.total}
      </Text>

      <Button 
        mode="contained" 
        onPress={handleSubmit}
        style={styles.submitButton}
        labelStyle={styles.submitButtonText}
      >
        Submit Record
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  denominationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 4,
    padding: 8,
    width: 60,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
  },
  addDenominationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 4,
    padding: 12,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
  },
  addButton: {
    borderColor: '#3498db',
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  attendanceLabel: {
    flex: 1,
    color: '#7f8c8d',
  },
  attendanceInput: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 4,
    padding: 8,
    width: 80,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
  },
  totalAttendance: {
    textAlign: 'right',
    marginTop: 8,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
    backgroundColor: '#2ecc71',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default IncomeForm;