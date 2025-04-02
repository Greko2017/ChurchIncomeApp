import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import UserRoleBadge from './UserRoleBadge';

const approvalSteps = [
  { role: 'counting_unit', label: 'Counting Unit' },
  { role: 'approver', label: 'Approver' },
  { role: 'receiver', label: 'Receiver' },
];

export default function ApprovalFlow({ record, currentUserRole, onApprove }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Approval Status</Text>
      {approvalSteps.map((step, index) => (
        <View key={index} style={styles.step}>
          <UserRoleBadge role={step.role} />
          <Text style={styles.status}>
            {record.approvals[step.role] ? '✓ Approved' : 'Pending'}
          </Text>
          {currentUserRole === step.role && !record.approvals[step.role] && (
            <Button 
              mode="contained" 
              onPress={() => onApprove(record.id)}
              style={styles.button}
            >
              Approve
            </Button>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  status: {
    flex: 1,
    marginHorizontal: 8,
  },
  button: {
    marginLeft: 8,
  },
});