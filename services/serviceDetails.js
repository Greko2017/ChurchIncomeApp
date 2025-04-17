import { db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy
} from 'firebase/firestore';

// Get service details by service ID
export const getServiceDetailsByServiceId = async (serviceId) => {
  try {
    const serviceDetailsRef = collection(db, 'serviceDetails');
    const q = query(serviceDetailsRef, where('serviceId', '==', serviceId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching service details:", error);
    throw error;
  }
};

// Create new service details
export const createServiceDetails = async (serviceDetailsData) => {
  try {
    const serviceDetailsRef = collection(db, 'serviceDetails');
    const docRef = await addDoc(serviceDetailsRef, {
      ...serviceDetailsData,
      denominations: serviceDetailsData.denominations.map(d => ({
        value: d.value,
        offering: d.offering || 0,
        tithe: d.tithe || 0,
        project: d.project || 0,
        shiloh: d.shiloh || 0,
        thanksgiving: d.thanksgiving || 0
      })),
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating service details:", error);
    throw error;
  }
};

// Update service details
export const updateServiceDetails = async (serviceDetailsId, serviceDetailsData) => {
  try {
    const serviceDetailsRef = doc(db, 'serviceDetails', serviceDetailsId);
    await updateDoc(serviceDetailsRef, {
      ...serviceDetailsData,
      denominations: serviceDetailsData.denominations.map(d => ({
        value: d.value,
        offering: d.offering || 0,
        tithe: d.tithe || 0,
        project: d.project || 0,
        shiloh: d.shiloh || 0,
        thanksgiving: d.thanksgiving || 0
      })),
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating service details:", error);
    throw error;
  }
};

// Update service details status
export const updateServiceDetailsStatus = async (serviceDetailsId, statusData) => {
  try {
    const serviceDetailsRef = doc(db, 'serviceDetails', serviceDetailsId);
    await updateDoc(serviceDetailsRef, {
      ...statusData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating service details status:", error);
    throw error;
  }
};

export default {
  getServiceDetailsByServiceId,
  createServiceDetails,
  updateServiceDetails,
  updateServiceDetailsStatus
}; 