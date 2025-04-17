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

// Get all services
export const getAllServices = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'services'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching services:", error);
    throw error;
  }
};

// Get service by ID
export const getServiceById = async (serviceId) => {
  try {
    const serviceDoc = await getDoc(doc(db, 'services', serviceId));
    if (serviceDoc.exists()) {
      return { id: serviceDoc.id, ...serviceDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching service:", error);
    throw error;
  }
};

// Create new service
export const createService = async (serviceData) => {
  try {
    const docRef = await addDoc(collection(db, 'services'), {
      ...serviceData,
      createdAt: new Date().toISOString(),
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating service:", error);
    throw error;
  }
};

// Update service
export const updateService = async (serviceId, serviceData) => {
  try {
    const serviceRef = doc(db, 'services', serviceId);
    await updateDoc(serviceRef, {
      ...serviceData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating service:", error);
    throw error;
  }
};

// Delete service
export const deleteService = async (serviceId) => {
  try {
    await deleteDoc(doc(db, 'services', serviceId));
    return true;
  } catch (error) {
    console.error("Error deleting service:", error);
    throw error;
  }
};

// Search services
export const searchServices = async (searchTerm, branchId) => {
  try {
    const servicesRef = collection(db, 'services');
    const q = query(
      servicesRef,
      where('branchId', '==', branchId),
      orderBy('title'),
      where('title', '>=', searchTerm),
      where('title', '<=', searchTerm + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error searching services:", error);
    throw error;
  }
};

// Get services by branch
export const getServicesByBranch = async (branchId) => {
  try {
    const servicesRef = collection(db, 'services');
    const q = query(servicesRef, where('branchId', '==', branchId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching services by branch:", error);
    throw error;
  }
};

export default {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  searchServices,
  getServicesByBranch
}; 