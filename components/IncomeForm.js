import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import DynamicDenominationForm from './DynamicDenominationForm';

const denominations = [10000, 5000, 2000, 1000, 500];
const coins = [500, 100, 50, 25, 5];

export default function IncomeForm({ onSubmit }) {
  const [formData, setFormData] = React.useState({
    notes: denominations.reduce((acc, val) => {
      acc[val] = { qty: 0, total: 0 };
      return acc;
    }, {}),
    attendance: { male: 0, female: 0, teenager: 0, children: 0, nc: 0 }
  });

  const handleQtyChange = (type, denomination, value) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [denomination]: {
          qty: numValue,
          total: numValue * denomination
        }
      }
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Money Received</Text>
      
      {denominations.map(denom => (
        <View key={denom} style={styles.row}>
          <Text>₦{denom.toLocaleString()}:</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={formData.notes[denom].qty.toString()}
            onChangeText={text => handleQtyChange('notes', denom, text)}
          />
          <Text>₦{formData.notes[denom].total.toLocaleString()}</Text>
        </View>
      ))}

      <Button 
        mode="contained" 
        onPress={() => onSubmit(formData)}
        style={styles.submitButton}
      >
        Submit Record
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5 
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 8, 
    width: 80,
    textAlign: 'center'
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 5
  }
});