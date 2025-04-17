import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const screenWidth = Dimensions.get('window').width;

const InteractiveDashboard = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [selectedView, setSelectedView] = useState('income');
  const [dashboardData, setDashboardData] = useState(null);
  const [userBranch, setUserBranch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data and their branch
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userQuery = query(collection(db, 'users'), where('email', '==', user.email));
        const userSnapshot = await getDocs(userQuery);
        
        if (!userSnapshot.empty) {
          const userData = userSnapshot.docs[0].data();
          setUserBranch(userData.churchBranch);
          await fetchDashboardData(userData.churchBranch, 'week');
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Fetch data when timeframe changes
  useEffect(() => {
    if (userBranch) {
      fetchDashboardData(userBranch, selectedTimeframe);
    }
  }, [selectedTimeframe, userBranch]);

  const fetchDashboardData = async (branchId, timeframe) => {
    try {
      setLoading(true);
      
      // Calculate date ranges based on timeframe
      const now = new Date();
      let startDate, endDate = now;
      
      switch(timeframe) {
        case 'day':
          startDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarter':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(now.setDate(now.getDate() - 7));
      }

      // Fetch services for the branch
      const servicesQuery = query(
        collection(db, 'services'),
        where('branchId', '==', branchId),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
      );
      
      const servicesSnapshot = await getDocs(servicesQuery);
      const services = servicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Fetch income records for these services
      const incomeRecords = [];
      for (const service of services) {
        const incomeQuery = query(
          collection(db, 'incomeRecords'),
          where('serviceInfo.serviceId', '==', service.id)
        );
        const incomeSnapshot = await getDocs(incomeQuery);
        if (!incomeSnapshot.empty) {
          incomeRecords.push({
            ...incomeSnapshot.docs[0].data(),
            id: incomeSnapshot.docs[0].id
          });
        }
      }

      // Process data for charts
      const processedData = services.map(service => {
        const incomeRecord = incomeRecords.find(ir => ir.serviceInfo.serviceId === service.id);
        return {
          name: service.title,
          date: service.date,
          income: incomeRecord ? incomeRecord.meta.totalOffering : 0,
          attendance: incomeRecord ? incomeRecord.attendance : 0
        };
      }).sort((a, b) => new Date(a.date) - new Date(b.date));

      // Calculate totals
      const totalIncome = processedData.reduce((sum, item) => sum + item.income, 0);
      const totalAttendance = processedData.reduce((sum, item) => sum + item.attendance, 0);
      const totalServices = services.length;

      setDashboardData({
        services: processedData,
        totals: {
          income: totalIncome,
          attendance: totalAttendance,
          services: totalServices
        }
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderKPICard = (title, value, color) => (
    <View style={[styles.kpiCard, { backgroundColor: `${color}20` }]}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={[styles.kpiValue, { color }]}>
        {typeof value === 'number' ? 
          (selectedView === 'income' ? `$${value.toLocaleString()}` : value.toLocaleString()) : 
          value}
      </Text>
    </View>
  );

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#ffa726'
    },
    barPercentage: 0.5,
  };

  if (loading || !dashboardData) {
    return (
      <View style={styles.container}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {userBranch ? `${userBranch} Performance Dashboard` : 'Church Performance Dashboard'}
        </Text>
        <View style={styles.controls}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedTimeframe}
              onValueChange={(itemValue) => setSelectedTimeframe(itemValue)}
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
      
      {/* KPI Cards */}
      <View style={styles.kpiContainer}>
        {renderKPICard(
          'Total Income',
          dashboardData.totals.income,
          '#3b82f6'
        )}
        {renderKPICard(
          'Total Attendance',
          dashboardData.totals.attendance,
          '#10b981'
        )}
        {renderKPICard(
          'Total Services',
          dashboardData.totals.services,
          '#8b5cf6'
        )}
        {renderKPICard(
          'Timeframe',
          selectedTimeframe.charAt(0).toUpperCase() + selectedTimeframe.slice(1),
          '#f59e0b'
        )}
      </View>
      
      {/* Main Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>
          {selectedView === 'income' ? 'Income' : 'Attendance'} by Service
        </Text>
        {selectedView === 'income' ? (
          <BarChart
            data={{
              labels: dashboardData.services.map(service => 
                new Date(service.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              ),
              datasets: [{
                data: dashboardData.services.map(service => service.income)
              }]
            }}
            width={screenWidth - 32}
            height={220}
            yAxisLabel="$"
            yAxisSuffix=""
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            fromZero
          />
        ) : (
          <LineChart
            data={{
              labels: dashboardData.services.map(service => 
                new Date(service.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              ),
              datasets: [{
                data: dashboardData.services.map(service => service.attendance),
                color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                strokeWidth: 2
              }]
            }}
            width={screenWidth - 32}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16
            }}
          />
        )}
      </View>
      
      {/* Service List */}
      <View style={styles.tableContainer}>
        <Text style={styles.tableTitle}>Service Details</Text>
        {dashboardData.services.map((service, index) => (
          <View key={index} style={styles.serviceCard}>
            <Text style={styles.serviceTitle}>{service.name}</Text>
            <View style={styles.serviceDetails}>
              <Text style={styles.serviceDate}>
                {new Date(service.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </Text>
              <View style={styles.serviceStats}>
                <Text style={styles.serviceIncome}>${service.income.toLocaleString()}</Text>
                <Text style={styles.serviceAttendance}>{service.attendance} attendees</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
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