import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Button, Card, DataTable, Title, TextInput } from 'react-native-paper';
import { getServiceById } from '../../services/services';
import { getBranchById } from '../../services/branches';
import { getServiceDetailsByServiceId, createServiceDetails, updateServiceDetails, updateServiceDetailsStatus } from '../../services/serviceDetails';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import useAuth from '../../hooks/useAuth';
import { generatePdfHtml } from '../../utils/pdfGenerator';
import * as FileSystem from 'expo-file-system';

const DENOMINATIONS = [
  { value: 10000, label: '10 000' },
  { value: 5000, label: '5 000' },
  { value: 2000, label: '2 000' },
  { value: 1000, label: '1 000' },
  { value: 500, label: '500' },
  { value: 100, label: '100' },
  { value: 50, label: '50' },
  { value: 25, label: '25' },
  { value: 10, label: '10' },
  { value: 5, label: '5' },
  { value: 2, label: '2' },
  { value: 1, label: '1' },
];

export default function ServiceDetailsScreen({ route, navigation }) {
  const { serviceId } = route.params;
  const { user } = useAuth();
  const [service, setService] = useState(null);
  const [branchName, setBranchName] = useState('');
  const [serviceDetails, setServiceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    denominations: DENOMINATIONS.map(d => ({
      value: d.value,
      offering: 0,
      tithe: 0,
      transport: 0,
      project: 0,
      shiloh: 0,
      thanksgiving: 0,
      needy: 0
    })),
    attendance: {
      male: 0,
      female: 0,
      teenager: 0,
      children: 0,
      firstTimers: 0,
      nc: 0
    },
    messageTitle: '',
    preacher: '',
    zonalPastor: '',
    counters: ['', '', '', ''] // Initialize with 4 empty counter slots
  });

  useEffect(() => {
    loadServiceDetails();
  }, [serviceId]);

  const loadServiceDetails = async () => {
    try {
      setLoading(true);
      const serviceData = await getServiceById(serviceId);
      setService(serviceData);
      navigation.setOptions({ headerTitle: serviceData?.title || 'Service Details' });
      
      if (serviceData?.branchId) {
        const branchData = await getBranchById(serviceData.branchId);
        setBranchName(branchData?.name || 'Unknown Branch');
      }
      
      const detailsData = await getServiceDetailsByServiceId(serviceId);
      // console.log("detailsData", JSON.stringify(detailsData))
      if (detailsData) {
        setServiceDetails(detailsData);
        setFormData({
          denominations: detailsData.denominations || formData.denominations,
          attendance: detailsData.attendance || formData.attendance,
          messageTitle: detailsData.messageTitle || '',
          preacher: detailsData.preacher || '',
          zonalPastor: detailsData.zonalPastor || '',
          counters: detailsData.counters || formData.counters
        });
      }
    } catch (error) {
      console.error('Error loading service details:', error);
      Alert.alert('Error', 'Failed to load service details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const serviceDetailsData = {
        serviceId,
        ...formData,
        recordedBy: user?.displayName || user?.email,
        counters: [user?.displayName || user?.email], // Start with current user as counter
        createdAt: new Date().toISOString()
      };

      if (serviceDetails) {
        // If updating, preserve existing counters and add current user if not already there
        const existingCounters = serviceDetails.counters || [];
        if (!existingCounters.includes(user?.displayName || user?.email)) {
          serviceDetailsData.counters = [...existingCounters, user?.displayName || user?.email];
        } else {
          serviceDetailsData.counters = existingCounters;
        }
        await updateServiceDetails(serviceDetails.id, serviceDetailsData);
        Alert.alert('Success', 'Service details updated successfully');
      } else {
        await createServiceDetails(serviceDetailsData);
        Alert.alert('Success', 'Service details created successfully');
      }
      loadServiceDetails();
    } catch (error) {
      console.error('Error saving service details:', error);
      Alert.alert('Error', 'Failed to save service details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const approvalData = {
        status: 'approved',
        approvedBy: user?.displayName || user?.email,
        approvedAt: new Date().toISOString()
      };
      await updateServiceDetailsStatus(serviceDetails.id, approvalData);
      Alert.alert('Success', 'Service details approved');
      loadServiceDetails();
    } catch (error) {
      console.error('Error approving service details:', error);
      Alert.alert('Error', 'Failed to approve service details');
    }
  };

  const handleReject = async () => {
    try {
      await updateServiceDetailsStatus(serviceDetails.id, 'rejected');
      Alert.alert('Success', 'Service details rejected');
      loadServiceDetails();
    } catch (error) {
      console.error('Error rejecting service details:', error);
      Alert.alert('Error', 'Failed to reject service details');
    }
  };

  const exportToPdf = async () => {
    try {
      if (!service || !serviceDetails) {
        Alert.alert('Error', 'No service details available to export');
        return;
      }

      const html = generatePdfHtml(service, serviceDetails, branchName);
      const serviceDate = new Date(service.createdAt).toISOString().split('T')[0];
      const fileName = `Service Details ${serviceDate}.pdf`;

      if (Platform.OS === 'web') {
        // For web platform
        const result = await Print.printToFileAsync({
          html,
          base64: false
        });
        
        // Create a blob from the result
        const response = await fetch(result);
        const blob = await response.blob();
        
        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        
        // Trigger the download
        link.click();
        
        // Clean up
        URL.revokeObjectURL(link.href);
        document.body.removeChild(link);
        
        // Show success message
        Alert.alert('Success', 'PDF downloaded successfully');
      } else {
        // For mobile platforms
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false
        });

        Alert.alert(
          'Export PDF',
          'Choose an action',
          [
            {
              text: 'Share',
              onPress: async () => {
                await Sharing.shareAsync(uri, {
                  mimeType: 'application/pdf',
                  dialogTitle: 'Share Service Report',
                  UTI: 'com.adobe.pdf'
                });
              }
            },
            {
              text: 'Save',
              onPress: async () => {
                const newUri = `${FileSystem.documentDirectory}${fileName}`;
                await FileSystem.copyAsync({
                  from: uri,
                  to: newUri
                });
                Alert.alert('Success', 'PDF saved successfully');
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      Alert.alert('Error', 'Failed to export service report');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.container}>
        <Text>No service found</Text>
      </View>
    );
  }

  const canApprove = ['admin', 'approver'].includes(user?.role);
  const isCounter = user?.role === 'counter' || user?.role === 'admin';
  const isApproved = serviceDetails?.status === 'approved';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card} elevation={2}>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.cardTitle}>Service Information</Title>
          <Text style={styles.infoText}>Branch: {branchName}</Text>
          <Text style={styles.infoText}>Date: {new Date(service?.createdAt).toLocaleDateString()}</Text>
          <Text style={styles.infoText}>Time: {service?.time}</Text>
          <Text style={styles.infoText}>Service: {service?.title}</Text>
          <Text style={styles.infoText}>Description: {service?.description}</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.cardTitle}>Denominations</Title>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title style={{flex: 2}}>
                <Text style={[styles.infoText]}>Value</Text>
              </DataTable.Title>
              <DataTable.Title style={{flex: 2}} numeric>
                <Text style={[styles.infoText]}>Offering</Text>
              </DataTable.Title>
              <DataTable.Title style={{flex: 2}} numeric>
                <Text style={[styles.infoText]}>Tithe</Text>
              </DataTable.Title>
              <DataTable.Title style={{flex: 2}} numeric>
                <Text style={[styles.infoText]}>Project</Text>
              </DataTable.Title>
              <DataTable.Title style={{flex: 2}} numeric>
                <Text style={[styles.infoText]}>Shiloh</Text>
              </DataTable.Title>
              <DataTable.Title style={{flex: 2}} numeric>
                <Text style={[styles.infoText]}>Thanksgiving</Text>
              </DataTable.Title>
            </DataTable.Header>

            {formData.denominations.map((denom, index) => (
              <DataTable.Row key={denom.value}>
                <DataTable.Cell style={{flex: 2}}>
                  <Text style={[styles.infoText, {color: '#34495e', fontWeight: '400'}]}>
                    {denom.value}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={{flex: 2}} numeric>
                  <TextInput
                    value={String(denom.offering)}
                    onChangeText={(text) => {
                      const newDenominations = [...formData.denominations];
                      newDenominations[index] = { ...denom, offering: parseInt(text) || 0 };
                      setFormData(prev => ({ ...prev, denominations: newDenominations }));
                    }}
                    keyboardType="numeric"
                    style={[styles.input, {color: '#34495e', textAlign: 'right', width: '100%', borderBottomWidth: 0}]}
                    theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
                    underlineColor="transparent"
                    disabled={serviceDetails?.status === 'approved'}
                  />
                </DataTable.Cell>
                <DataTable.Cell style={{flex: 2}} numeric>
                  <TextInput
                    value={String(denom.tithe)}
                    onChangeText={(text) => {
                      const newDenominations = [...formData.denominations];
                      newDenominations[index] = { ...denom, tithe: parseInt(text) || 0 };
                      setFormData(prev => ({ ...prev, denominations: newDenominations }));
                    }}
                    keyboardType="numeric"
                    style={[styles.input, {color: '#34495e', textAlign: 'right', width: '100%', borderBottomWidth: 0}]}
                    theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
                    underlineColor="transparent"
                    disabled={serviceDetails?.status === 'approved'}
                  />
                </DataTable.Cell>
                <DataTable.Cell style={{flex: 2}} numeric>
                  <TextInput
                    value={String(denom.project)}
                    onChangeText={(text) => {
                      const newDenominations = [...formData.denominations];
                      newDenominations[index] = { ...denom, project: parseInt(text) || 0 };
                      setFormData(prev => ({ ...prev, denominations: newDenominations }));
                    }}
                    keyboardType="numeric"
                    style={[styles.input, {color: '#34495e', textAlign: 'right', width: '100%', borderBottomWidth: 0}]}
                    theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
                    underlineColor="transparent"
                    disabled={serviceDetails?.status === 'approved'}
                  />
                </DataTable.Cell>
                <DataTable.Cell style={{flex: 2}} numeric>
                  <TextInput
                    value={String(denom.shiloh)}
                    onChangeText={(text) => {
                      const newDenominations = [...formData.denominations];
                      newDenominations[index] = { ...denom, shiloh: parseInt(text) || 0 };
                      setFormData(prev => ({ ...prev, denominations: newDenominations }));
                    }}
                    keyboardType="numeric"
                    style={[styles.input, {color: '#34495e', textAlign: 'right', width: '100%', borderBottomWidth: 0}]}
                    theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
                    underlineColor="transparent"
                    disabled={serviceDetails?.status === 'approved'}
                  />
                </DataTable.Cell>
                <DataTable.Cell style={{flex: 2}} numeric>
                  <TextInput
                    value={String(denom.thanksgiving)}
                    onChangeText={(text) => {
                      const newDenominations = [...formData.denominations];
                      newDenominations[index] = { ...denom, thanksgiving: parseInt(text) || 0 };
                      setFormData(prev => ({ ...prev, denominations: newDenominations }));
                    }}
                    keyboardType="numeric"
                    style={[styles.input, {color: '#34495e', textAlign: 'right', width: '100%', borderBottomWidth: 0}]}
                    theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
                    underlineColor="transparent"
                    disabled={serviceDetails?.status === 'approved'}
                  />
                </DataTable.Cell>
              </DataTable.Row>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.cardTitle}>Attendance</Title>
          <View style={styles.attendanceGrid}>
            <TextInput
              label="Male"
              value={String(formData.attendance.male)}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                attendance: { ...prev.attendance, male: parseInt(text) || 0 }
              }))}
              keyboardType="numeric"
              style={[styles.attendanceInput, styles.infoText]}
              theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
              underlineColor="transparent"
              disabled={serviceDetails?.status === 'approved'}
            />
            <TextInput
              label="Female"
              value={String(formData.attendance.female)}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                attendance: { ...prev.attendance, female: parseInt(text) || 0 }
              }))}
              keyboardType="numeric"
              style={[styles.attendanceInput, styles.infoText]}
              theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
              underlineColor="transparent"
              disabled={serviceDetails?.status === 'approved'}
            />
            <TextInput
              label="Teenager"
              value={String(formData.attendance.teenager)}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                attendance: { ...prev.attendance, teenager: parseInt(text) || 0 }
              }))}
              keyboardType="numeric"
              style={[styles.attendanceInput, styles.infoText]}
              theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
              underlineColor="transparent"
              disabled={serviceDetails?.status === 'approved'}
            />
            <TextInput
              label="Children"
              value={String(formData.attendance.children)}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                attendance: { ...prev.attendance, children: parseInt(text) || 0 }
              }))}
              keyboardType="numeric"
              style={[styles.attendanceInput, styles.infoText]}
              theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
              underlineColor="transparent"
              disabled={serviceDetails?.status === 'approved'}
            />
            <TextInput
              label="First Timers"
              value={String(formData.attendance.firstTimers)}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                attendance: { ...prev.attendance, firstTimers: parseInt(text) || 0 }
              }))}
              keyboardType="numeric"
              style={[styles.attendanceInput, styles.infoText]}
              theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
              underlineColor="transparent"
              disabled={serviceDetails?.status === 'approved'}
            />
            <TextInput
              label="NC"
              value={String(formData.attendance.nc)}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                attendance: { ...prev.attendance, nc: parseInt(text) || 0 }
              }))}
              keyboardType="numeric"
              style={[styles.attendanceInput, styles.infoText]}
              theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
              underlineColor="transparent"
              disabled={serviceDetails?.status === 'approved'}
            />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.cardTitle}>Message Information</Title>
          <TextInput
            label="Title of the Message"
            value={formData.messageTitle}
            onChangeText={(text) => setFormData(prev => ({ ...prev, messageTitle: text }))}
            style={[styles.messageInput, styles.infoText]}
            theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
            underlineColor="transparent"
            disabled={serviceDetails?.status === 'approved'}
          />
          <TextInput
            label="Name of the Preacher"
            value={formData.preacher}
            onChangeText={(text) => setFormData(prev => ({ ...prev, preacher: text }))}
            style={[styles.messageInput, styles.infoText]}
            theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
            underlineColor="transparent"
            disabled={serviceDetails?.status === 'approved'}
          />
          <TextInput
            label="Name of the Zonal Pastor"
            value={formData.zonalPastor}
            onChangeText={(text) => setFormData(prev => ({ ...prev, zonalPastor: text }))}
            style={[styles.messageInput, styles.infoText]}
            theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
            underlineColor="transparent"
            disabled={serviceDetails?.status === 'approved'}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Title style={styles.cardTitle}>Counters</Title>
          <View style={styles.countersGrid}>
            {formData.counters.map((counter, index) => (
              <TextInput
                key={index}
                label={`Counter ${index + 1}`}
                value={formData.counters[index]}
                onChangeText={(text) => {
                  const newCounters = [...formData.counters];
                  newCounters[index] = text;
                  setFormData(prev => ({ ...prev, counters: newCounters }));
                }}
                style={[styles.counterInput, styles.infoText]}
                theme={{ colors: { primary: '#34495e', text: '#34495e' } }}
                underlineColor="transparent"
                disabled={serviceDetails?.status === 'approved'}
              />
            ))}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        {!serviceDetails && (
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.button, { backgroundColor: '#2ecc71' }]}
          >
            Save Service Details
          </Button>
        )}

        {serviceDetails && serviceDetails.status === 'pending' && (
          <>
            {isCounter && (
              <Button
                mode="contained"
                onPress={handleSave}
                style={[styles.button, { backgroundColor: '#2ecc71' }]}
              >
                Edit and Send for Approval
              </Button>
            )}
            {canApprove && (
              <>
                <Button
                  mode="contained"
                  onPress={handleApprove}
                  style={[styles.button, styles.approveButton]}
                >
                  Approve
                </Button>
                <Button
                  mode="contained"
                  onPress={handleReject}
                  style={[styles.button, styles.rejectButton]}
                >
                  Reject
                </Button>
              </>
            )}
          </>
        )}

        {isApproved && (
          <Button
            mode="contained"
            onPress={exportToPdf}
            style={[styles.button, { backgroundColor: '#3498db' }]}
          >
            Export PDF Report
          </Button>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    paddingTop: 4,
    paddingBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#2c3e50',
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2,
  },
  input: {
    height: 40,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  attendanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  attendanceInput: {
    width: '48%',
    marginBottom: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
  },
  messageInput: {
    marginBottom: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#2ecc71',
  },
  rejectButton: {
    backgroundColor: '#e74c3c',
  },
  countersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  counterInput: {
    width: '48%',
    marginBottom: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 0,
  },
}); 