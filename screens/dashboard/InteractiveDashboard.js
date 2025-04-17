import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../../config/firebase';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';

const screenWidth = Dimensions.get('window').width;

const InteractiveDashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedView, setSelectedView] = useState('income');
  const [dashboardData, setDashboardData] = useState(null);
  const [branchName, setBranchName] = useState('Church');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's branch
        const user = auth.currentUser;
        if (user) {
            const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
            const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            
            const userData = userSnapshot.docs[0].data();
            const branchId = userData.churchBranch;
            if (branchId) {
              const branchDoc = await getDoc(doc(db, 'branches', branchId));
              if (branchDoc.exists()) {
                setBranchName(branchDoc.data().name || 'Church');
              }
            }
          }
        }

        // Sample data - replace with actual data fetching
        const sampleData = {
          metrics: {
            income: {
              total: 12500,
              average: 2500,
              highest: 4500,
              highestService: "Sunday Service",
              trend: "increasing"
            },
            attendance: {
              total: 320,
              male: 150,
              female: 170,
              children: 45,
              teens: 30,
              average: 160,
              highest: 220,
              highestService: "Sunday Service",
              trend: "stable"
            }
          },
          services: [
            { title: "Sunday Service", date: new Date(), income: 4500, attendance: { total: 220, male: 100, female: 120 } },
            { title: "Bible Study", date: new Date(), income: 3500, attendance: { total: 180, male: 80, female: 100 } },
            { title: "Prayer Meeting", date: new Date(), income: 2000, attendance: { total: 150, male: 70, female: 80 } },
            { title: "Youth Service", date: new Date(), income: 2500, attendance: { total: 200, male: 90, female: 110 } }
          ]
        };

        setDashboardData(sampleData);
      } catch (error) {
        console.error("Error fetching data:", error);
        Alert.alert("Error", "Could not load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedTimeframe]);

  const renderKPICards = () => {
    if (!dashboardData) return null;

    if (selectedView === 'income') {
      return (
        <>{/* KPI Cards */}
        <View style={[styles.kpiContainer, {width: '100%' }]}>
          <View style={[styles.kpiCard, { backgroundColor: '#3b82f620' }]}>
            <Text style={styles.kpiTitle}>Total Income</Text>
            <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>
              ${dashboardData.metrics.income.total.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#8b5cf620' }]}>
            <Text style={styles.kpiTitle}>Average Income</Text>
            <Text style={[styles.kpiValue, { color: '#8b5cf6' }]}>
              ${dashboardData.metrics.income.average.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#10b98120' }]}>
            <Text style={styles.kpiTitle}>Highest Income</Text>
            <Text style={[styles.kpiValue, { color: '#10b981' }]}>
              ${dashboardData.metrics.income.highest.toLocaleString()}
            </Text>
            <Text style={styles.kpiSubValue}>{dashboardData.metrics.income.highestService}</Text>
          </View>
          <View style={[styles.kpiCard, { 
            backgroundColor: dashboardData.metrics.income.trend === 'increasing' ? '#10b98120' : 
                           dashboardData.metrics.income.trend === 'decreasing' ? '#ef444420' : '#6b728020'
          }]}>
            <Text style={styles.kpiTitle}>Trend</Text>
            <Text style={[styles.kpiValue, { 
              color: dashboardData.metrics.income.trend === 'increasing' ? '#10b981' : 
                    dashboardData.metrics.income.trend === 'decreasing' ? '#ef4444' : '#6b7280'
            }]}>
              {dashboardData.metrics.income.trend === 'increasing' ? '↑ Increasing' : 
               dashboardData.metrics.income.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
            </Text>
          </View>
        </View>
        </>
      );
    } else {
      return (
        <>{/* Attendance KPI Cards */}
        <View style={[styles.kpiContainer, {width: '100%' }]}>
          <View style={[styles.kpiCard, { backgroundColor: '#3b82f620' }]}>
            <Text style={styles.kpiTitle}>Total Attendance</Text>
            <Text style={[styles.kpiValue, { color: '#3b82f6' }]}>
              {dashboardData.metrics.attendance.total.toLocaleString()}
            </Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#8b5cf620' }]}>
            <Text style={styles.kpiTitle}>Gender Split</Text>
            <Text style={[styles.kpiValue, { color: '#8b5cf6' }]}>
              ♂ {dashboardData.metrics.attendance.male} | ♀ {dashboardData.metrics.attendance.female}
            </Text>
          </View>
          <View style={[styles.kpiCard, { backgroundColor: '#f59e0b20' }]}>
            <Text style={styles.kpiTitle}>Youth</Text>
            <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>
              👧 {dashboardData.metrics.attendance.children} | 🧑 {dashboardData.metrics.attendance.teens}
            </Text>
          </View>
          <View style={[styles.kpiCard, { 
            backgroundColor: dashboardData.metrics.attendance.trend === 'increasing' ? '#10b98120' : 
                           dashboardData.metrics.attendance.trend === 'decreasing' ? '#ef444420' : '#6b728020'
          }]}>
            <Text style={styles.kpiTitle}>Trend</Text>
            <Text style={[styles.kpiValue, { 
              color: dashboardData.metrics.attendance.trend === 'increasing' ? '#10b981' : 
                    dashboardData.metrics.attendance.trend === 'decreasing' ? '#ef4444' : '#6b7280'
            }]}>
              {dashboardData.metrics.attendance.trend === 'increasing' ? '↑ Increasing' : 
               dashboardData.metrics.attendance.trend === 'decreasing' ? '↓ Decreasing' : '→ Stable'}
            </Text>
          </View>
        </View>
        </>
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading dashboard data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{branchName} Performance Dashboard</Text>
        
        <View style={styles.controls}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedTimeframe}
              onValueChange={setSelectedTimeframe}
              style={styles.picker}
            >
              <Picker.Item label="Day" value="day" />
              <Picker.Item label="Week" value="week" />
              <Picker.Item label="Month" value="month" />
              <Picker.Item label="Quarter" value="quarter" />
              <Picker.Item label="Year" value="year" />
            </Picker>
          </View>
          
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, selectedView === 'income' && styles.activeToggle]}
              onPress={() => setSelectedView('income')}
            >
              <Text style={selectedView === 'income' ? styles.activeToggleText : styles.toggleText}>Income</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, selectedView === 'attendance' && styles.activeToggle]}
              onPress={() => setSelectedView('attendance')}
            >
              <Text style={selectedView === 'attendance' ? styles.activeToggleText : styles.toggleText}>Attendance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <View style={styles.kpiContainer}>
        {renderKPICards()}
      </View>
      
      {dashboardData && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>
            {selectedView === 'income' ? 'Income' : 'Attendance'} by Service
          </Text>
          {selectedView === 'income' ? (
            <BarChart
              data={{
                labels: dashboardData.services.map(service => service.title),
                datasets: [{
                  data: dashboardData.services.map(service => service.income)
                }]
              }}
              width={screenWidth - 60}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: () => '#3b82f6',
                labelColor: () => '#374151',
                style: { borderRadius: 16 },
                propsForDots: { r: '6', strokeWidth: '2', stroke: '#ffa726' }
              }}
              verticalLabelRotation={30}
              fromZero
            />
          ) : (
            <LineChart
              data={{
                labels: dashboardData.services.map(service => service.title),
                datasets: [{
                  data: dashboardData.services.map(service => service.attendance.total),
                  color: () => '#10b981',
                  strokeWidth: 2
                }]
              }}
              width={screenWidth - 50}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: () => '#374151',
                labelColor: () => '#374151',
                style: { borderRadius: 16 },
                propsForDots: { r: '6', strokeWidth: '2', stroke: '#ffa726' }
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          )}
        </View>
      )}
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  kpiSubValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerContainer: {
    flex: 1,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 40,
    width: '100%',
  },
  viewToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  activeToggle: {
    backgroundColor: '#3b82f6',
  },
  toggleText: {
    color: '#333',
  },
  activeToggleText: {
    color: '#fff',
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
    padding: 16,
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  serviceCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceDate: {
    fontSize: 14,
    color: '#666',
  },
  serviceStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIncome: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginRight: 16,
  },
  serviceAttendance: {
    fontSize: 14,
    color: '#10b981',
  },
});

export default InteractiveDashboard;