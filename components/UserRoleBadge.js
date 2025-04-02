import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const roleColors = {
  admin: '#4CAF50',
  pastor: '#2196F3',
  secretary: '#9C27B0',
  counting_unit: '#FF9800',
  approver: '#607D8B',
  receiver: '#795548',
};

export default function UserRoleBadge({ role }) {
  return (
    <View style={[styles.badge, { backgroundColor: roleColors[role] || '#9E9E9E' }]}>
      <Text style={styles.text}>{role.replace('_', ' ')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: 'white',
    fontSize: 12,
    textTransform: 'capitalize',
  },
});