import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import DatePicker from 'react-native-date-picker';
import { getRecordsByPeriod } from '../../services/income';
import ReportCard from '../../components/ReportCard';
import { generatePDF } from '../../utils/pdfGenerator';

export default function ViewReports() {
  const [records, setRecords] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [openStartDate, setOpenStartDate] = useState(false);
  const [openEndDate, setOpenEndDate] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const records = await getRecordsByPeriod(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setRecords(records);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      const pdfUri = await generatePDF({
        startDate,
        endDate,
        records,
      });
      alert(`PDF saved to: ${pdfUri}`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate]);

  return (
    <View style={styles.container}>
      <View style={styles.dateRow}>
        <Button 
          title={`From: ${startDate.toLocaleDateString()}`}
          onPress={() => setOpenStartDate(true)}
        />
        <Button 
          title={`To: ${endDate.toLocaleDateString()}`}
          onPress={() => setOpenEndDate(true)}
        />
      </View>

      <DatePicker
        modal
        open={openStartDate}
        date={startDate}
        onConfirm={(date) => {
          setOpenStartDate(false);
          setStartDate(date);
        }}
        onCancel={() => setOpenStartDate(false)}
      />

      <DatePicker
        modal
        open={openEndDate}
        date={endDate}
        onConfirm={(date) => {
          setOpenEndDate(false);
          setEndDate(date);
        }}
        onCancel={() => setOpenEndDate(false)}
      />

      <Button 
        title="Generate PDF Report"
        onPress={handleGeneratePDF}
        disabled={loading || records.length === 0}
      />

      {loading ? (
        <Text>Loading records...</Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <ReportCard record={item} />
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
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});