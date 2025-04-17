import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Button } from 'react-native-paper';
import { generatePDF } from '../../utils/pdfGenerator';
import { getRecordsByPeriod } from '../../services/income';
import { format, subDays, subMonths } from 'date-fns';

export default function GenerateReport() {
  const [reportType, setReportType] = useState('weekly');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const generateReport = async () => {
    try {
      setLoading(true);
      let startDate, endDate = new Date();

      switch (reportType) {
        case 'weekly':
          startDate = subDays(endDate, 7);
          break;
        case 'monthly':
          startDate = subMonths(endDate, 1);
          break;
        case 'quarterly':
          startDate = subMonths(endDate, 3);
          break;
        default:
          startDate = subDays(endDate, 1);
      }

      const records = await getRecordsByPeriod(
        startDate.toISOString(),
        endDate.toISOString()
      );

      const pdfUri = await generatePDF({
        title: `${reportType} Report (${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')})`,
        records,
        reportType,
      });

      setReportData({
        period: `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`,
        totalRecords: records.length,
        totalAmount: records.reduce((sum, record) => {
          const notesTotal = Object.values(record.notes).reduce(
            (s, note) => s + (note.total || 0), 0
          );
          return sum + notesTotal;
        }, 0),
        pdfUri,
      });
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Generate Report</Text>
      
      <View style={styles.pickerContainer}>
        <Text>Report Period:</Text>
        <Picker
          selectedValue={reportType}
          onValueChange={(itemValue) => setReportType(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Daily" value="daily" />
          <Picker.Item label="Weekly" value="weekly" />
          <Picker.Item label="Monthly" value="monthly" />
          <Picker.Item label="Quarterly" value="quarterly" />
        </Picker>
      </View>

      <Button 
        mode="contained" 
        onPress={generateReport}
        loading={loading}
        style={styles.button}
      >
        Generate Report
      </Button>

      {reportData && (
        <View style={styles.reportSummary}>
          <Text style={styles.summaryTitle}>Report Summary</Text>
          <Text>Period: {reportData.period}</Text>
          <Text>Total Services: {reportData.totalRecords}</Text>
          <Text>Total Offering: ₦{reportData.totalAmount.toLocaleString()}</Text>
          <Text style={styles.pdfPath}>PDF saved to: {reportData.pdfUri}</Text>
        </View>
      )}
    </ScrollView>
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
    marginBottom: 20,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  button: {
    marginBottom: 20,
  },
  reportSummary: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pdfPath: {
    marginTop: 8,
    fontStyle: 'italic',
    fontSize: 12,
    color: '#666',
  },
});