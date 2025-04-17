import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import useAuth from '../hooks/useAuth'; 
import { getRecordsByPeriod, approveRecord } from '../../services/income';
import ReportCard from '../../components/ReportCard';
import ApprovalFlow from '../../components/ApprovalFlow';

export default function ApprovalScreen() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const today = new Date();
        const startDate = new Date(today.setHours(0, 0, 0, 0)).toISOString();
        const endDate = new Date(today.setHours(23, 59, 59, 999)).toISOString();
        
        const records = await getRecordsByPeriod(startDate, endDate);
        setRecords(records.filter(record => record.status === 'pending'));
      } catch (error) {
        console.error("Error fetching records:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRecords();
  }, []);

  const handleApprove = async (recordId) => {
    try {
      await approveRecord(recordId, user.role);
      setRecords(records.filter(record => record.id !== recordId));
    } catch (error) {
      console.error("Approval failed:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Approvals</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <ReportCard record={item} />
              <ApprovalFlow 
                record={item} 
                currentUserRole={user.role} 
                onApprove={handleApprove}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
});