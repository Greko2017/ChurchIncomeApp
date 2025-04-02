import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

export default function ReportCard({ record }) {
  const totalNotes = Object.values(record.notes).reduce(
    (sum, note) => sum + note.total, 0
  );
  const totalAttendance = record.attendance.male + record.attendance.female + 
    record.attendance.teenager + record.attendance.children;

  return (
    <View>
      <Text style={styles.date}>
        {format(new Date(record.date), 'PPP')}
      </Text>
      <Text style={styles.message}>{record.messageTitle}</Text>
      
      <View style={styles.row}>
        <Text>Total Offering:</Text>
        <Text style={styles.amount}>₦{totalNotes.toLocaleString()}</Text>
      </View>
      
      <View style={styles.row}>
        <Text>Attendance:</Text>
        <Text>{totalAttendance} (M: {record.attendance.male}, F: {record.attendance.female})</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  date: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontStyle: 'italic',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  amount: {
    fontWeight: 'bold',
  },
});