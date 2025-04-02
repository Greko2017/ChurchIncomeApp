import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

export default function BranchAssignmentModal({
  visible,
  user,
  branches,
  onAssign,
  onClose
}) {
  const [selectedBranch, setSelectedBranch] = useState(user?.churchBranch || '');

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>
            Assign Branch to {user?.name}
          </Text>
          
          <Picker
            selectedValue={selectedBranch}
            style={styles.picker}
            onValueChange={(itemValue) => setSelectedBranch(itemValue)}
          >
            <Picker.Item label="Select Branch" value="" />
            {branches.map(branch => (
              <Picker.Item key={branch} label={branch} value={branch} />
            ))}
          </Picker>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.assignButton]}
              onPress={() => {
                if (selectedBranch) {
                  onAssign(user.id, selectedBranch);
                }
              }}
              disabled={!selectedBranch}
            >
              <Text style={styles.buttonText}>Assign</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center'
  },
  picker: {
    height: 50,
    width: '100%',
    marginBottom: 20
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    borderRadius: 5,
    padding: 10,
    width: '45%',
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#ccc'
  },
  assignButton: {
    backgroundColor: '#2196F3'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold'
  }
});