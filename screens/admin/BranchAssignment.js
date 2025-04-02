import React, { useState } from 'react';
import { View, Text, Picker, Button } from 'react-native';
import { db } from '../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export default function BranchAssignment({ userId, currentBranch }) {
  const [branch, setBranch] = useState(currentBranch || '');
  const [branches, setBranches] = useState([
    'main_branch',
    'akwa_north',
    'bonewonda'
  ]);

  const handleAssign = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        churchBranch: branch
      });
      alert('Branch assigned successfully!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Assign to Branch:</Text>
      <Picker
        selectedValue={branch}
        onValueChange={(itemValue) => setBranch(itemValue)}>
        {branches.map(b => (
          <Picker.Item key={b} label={b} value={b} />
        ))}
      </Picker>
      <Button title="Assign Branch" onPress={handleAssign} />
    </View>
  );
}