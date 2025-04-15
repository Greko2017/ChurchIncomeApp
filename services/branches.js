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

// Get all branches
export const getAllBranches = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'branches'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching branches:", error);
    throw error;
  }
};

// Get branch by ID
export const getBranchById = async (branchId) => {
  try {
    const branchDoc = await getDoc(doc(db, 'branches', branchId));
    if (branchDoc.exists()) {
      return { id: branchDoc.id, ...branchDoc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching branch:", error);
    throw error;
  }
};

// Create new branch
export const createBranch = async (branchData) => {
  try {
    const docRef = await addDoc(collection(db, 'branches'), {
      ...branchData,
      createdAt: new Date().toISOString(),
      status: 'active'
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating branch:", error);
    throw error;
  }
};

// Update branch
export const updateBranch = async (branchId, branchData) => {
  try {
    const branchRef = doc(db, 'branches', branchId);
    await updateDoc(branchRef, {
      ...branchData,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error updating branch:", error);
    throw error;
  }
};

// Delete branch
export const deleteBranch = async (branchId) => {
  try {
    await deleteDoc(doc(db, 'branches', branchId));
    return true;
  } catch (error) {
    console.error("Error deleting branch:", error);
    throw error;
  }
};

// Search branches
export const searchBranches = async (searchTerm) => {
  try {
    const branchesRef = collection(db, 'branches');
    const q = query(
      branchesRef,
      orderBy('name'),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error searching branches:", error);
    throw error;
  }
};

export default {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  searchBranches
};
