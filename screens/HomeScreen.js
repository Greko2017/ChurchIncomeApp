import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import IncomeForm from '../components/DynamicDenominationForm.js';
import useAuth from '../hooks/useAuth';
import { addIncomeRecord } from '../services/income';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth'; // Import getAuth if not already imported


export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branchName, setBranchName] = useState('');
  useEffect(() => {
    
const fetchUserData = async () => {
  try {
    setLoading(true);
    const auth = getAuth();
    const user = auth.currentUser;

    if (user?.email) {
      const usersCollection = collection(db, 'users');
      const q = query(usersCollection, where('email', '==', user.email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        // console.log(JSON.stringify(userDoc))
        const userData = { ...userDoc.data(), uid: userDoc.id };
        // console.log(userData.churchBranch)
        // console.log(userData)
        // Check if churchBranch exists and is a document reference
        if (userData?.churchBranch && typeof userData.churchBranch === 'string') {
          try {
            const churchBranchDocRef = doc(db, 'branches', userData.churchBranch);
            const churchBranchDocSnapshot = await getDoc(churchBranchDocRef);
            
            // console.log('churchBranchDocSnapshot', churchBranchDocSnapshot)

            if (churchBranchDocSnapshot.exists()) {
              // console.log('\n\n churchBranchDocSnapshot.data()', churchBranchDocSnapshot.data())
              setUserData(prevUserData => ({
                ...prevUserData,
                churchBranch: churchBranchDocSnapshot.data()
              }));

              setBranchName(churchBranchDocSnapshot.data().name)
              // console.log('userData', userData)

            } else {
              console.warn('Church branch document not found.');
            }
          } catch (error) {
            console.error('Error fetching church branch data:', error);
          }
        }

        setUserData(userData);
      } else {
        console.warn('User with email not found');
      }
    } else {
        console.warn('User object does not contain an email.')
    }

  } catch (error) {
    console.error('Error fetching user data:', error);
  } finally {
    setLoading(false);
  }
};


    fetchUserData();
  }, [user]);

  const handleSubmit = async (formData) => {
    try {
      if (!userData?.churchBranch) {
        throw new Error('Please contact admin to assign you to a church branch');
      }

      const recordData = {
        denominations: formData.denominations || [],
        attendance: {
          male: Number(formData.attendance?.male) || 0,
          female: Number(formData.attendance?.female) || 0,
          teenager: Number(formData.attendance?.teenager) || 0,
          children: Number(formData.attendance?.children) || 0,
          nc: Number(formData.attendance?.nc) || 0,
        },
        serviceTitle: formData.messageTitle || 'Sunday Service',
        preacher: formData.preacher || '',
        pastor: user?.displayName || '',
        churchBranch: branchName,
        createdAt: new Date().toISOString(),
      };

      await addIncomeRecord(recordData, user.email);
      Alert.alert('Success', 'Income record submitted!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
      console.error('Submission error:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  if (!userData?.churchBranch) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Account Not Configured</Text>
        <Text style={styles.helpText}>
          Your account is not assigned to any church branch. Please contact your administrator.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Income Record</Text>
      {branchName && <Text style={styles.subtitle}>Branch: {branchName}</Text>}
      <IncomeForm user={userData} onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    marginTop: '2%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    paddingHorizontal: 20,
  },
});