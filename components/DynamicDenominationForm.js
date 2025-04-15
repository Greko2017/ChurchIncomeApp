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
    },
    totalMoney: 0
  });

  // Load default denominations
  useEffect(() => {
    const loadDenominations = async () => {
      const defaultDenoms = await getDefaultDenominations();
      setFormData(prev => ({
        ...prev,
        denominations: defaultDenoms ? defaultDenoms.map(d => ({
          ...d,
          qty: 0,
          total: 0
        })) : []
      }));
    };
    loadDenominations();
  }, []);

  const handleQtyChange = (value, text) => {
    const qty = parseInt(text) || 0;
    const updatedDenominations = formData.denominations.map(d =>
      d.value === value ? { ...d, qty, total: qty * d.value } : d
    );

    const newTotalMoney = updatedDenominations.reduce((sum, denom) => sum + denom.total, 0);

    setFormData(prev => ({
      ...prev,
      denominations: updatedDenominations,
      totalMoney: newTotalMoney
    }));
  };

  const handleAttendanceChange = (field, text) => {
    const value = parseInt(text) || 0;
    const newAttendance = {
      ...formData.attendance,
      [field]: value
    };
    const newTotal = Object.values(newAttendance).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);

    setFormData(prev => ({
      ...prev,
      attendance: {
        ...newAttendance,
        total: newTotal
      }
    }));
  };

  const handleAddDenomination = () => {
    const value = parseInt(newDenominationValue) || 0;
    if (value > 0 && !formData.denominations.some(d => d.value === value)) {
      const newDenom = {
        value,
        label: `FCFA ${value.toLocaleString()}`, // Changed to FCFA
        qty: 0,
        total: 0
      };
      const updatedDenominations = [...formData.denominations, newDenom];
      const newTotalMoney = updatedDenominations.reduce((sum, denom) => sum + denom.total, 0);

      setFormData(prev => ({
        ...prev,
        denominations: updatedDenominations,
        totalMoney: newTotalMoney
      }));
      setNewDenominationValue('');
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate required fields
      const title = formData.messageTitle?.trim() || '';
      const preacher = formData.preacher?.trim() || '';
      const pastor = formData.pastor?.trim() || '';
      const churchBranch = formData.churchBranch?.trim() || '';

      if (!title) {
        alert('Please enter the message title');
        return;
      }
      if (!preacher) {
        alert('Please enter the preacher\'s name');
        return;
      }
      if (!pastor) {
        alert('Please enter the pastor\'s name');
        return;
      }
      if (!churchBranch) {
        alert('Please enter the church branch');
        return;
      }

      const submissionData = {
        serviceInfo: {
          title,
          preacher,
          pastor,
          churchBranch
        },
        denominations: formData.denominations || [],
        attendance: formData.attendance || {
          male: 0,
          female: 0,
          teenager: 0,
          children: 0,
          nc: 0,
          total: 0
        },
        totalMoney: formData.totalMoney || 0,
        status: 'pending',
        approvals: {
          counting_unit: false,
          approver: false,
          receiver: false
        },
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      };

      console.log("Submitting data:", JSON.stringify(submissionData, null, 2));
      await addIncomeRecord(submissionData);
      alert('Income record submitted successfully!');
    } catch (error) {
      console.error("Submission error:", error);
      alert('Error submitting record: ' + error.message);
    }
  };

  const [newDenominationValue, setNewDenominationValue] = useState('');

  return (
    <View style={styles.mainContainer}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
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

        <TextInput
          style={styles.input}
          placeholder="Pastor's Name"
          value={formData.pastor}
          onChangeText={text => setFormData(prev => ({ ...prev, pastor: text }))}
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
            <Text>Total: FCFA {denom.total.toLocaleString()} {/* Changed to FCFA */} </Text>
          </View>
        ))}
        <Text style={styles.totalMoney}>
          Total Money: FCFA {formData.totalMoney.toLocaleString()} {/* Changed to FCFA */}
        </Text>

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
      </ScrollView>

      <View style={styles.fixedButtonContainer}>
        <Button
          mode="contained"
          onPress={handleSubmit}
          style={styles.submitButton}
          labelStyle={styles.submitButtonText}
        >
          Submit Record
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 20,
  },
  fixedButtonContainer: {
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#2c3e50',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 10,
    color: '#34495e',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
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
    width: 50,
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
    padding: 10,
    marginRight: 8,
    backgroundColor: '#f8f9fa',
  },
  addButton: {
    borderColor: '#3498db',
    padding: 0.1,
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
  totalMoney: {
    textAlign: 'right',
    marginTop: 8,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  submitButton: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#2ecc71',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default IncomeForm;
