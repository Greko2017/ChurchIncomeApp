import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  doc,
  getDoc  // Added missing import
} from 'firebase/firestore';

// Create new income record
export const addIncomeRecord = async (recordData, userId) => {
  try {
    // Calculate totals
    const totalOffering = recordData.denominations.reduce(
      (sum, d) => sum + d.total, 0
    );

    const docRef = await addDoc(collection(db, 'incomeRecords'), {
      denominations: recordData.denominations,
      attendance: recordData.attendance,
      serviceInfo: {
        title: recordData.serviceTitle,
        preacher: recordData.preacher,
        pastor: recordData.pastor,
        date: new Date().toISOString()
      },
      meta: {
        churchBranch: recordData.churchBranch,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        status: 'pending',
        totalOffering,
        approvals: {
          counting_unit: { approved: false, approvedBy: null, approvedAt: null },
          approver: { approved: false, approvedBy: null, approvedAt: null },
          receiver: { approved: false, approvedBy: null, approvedAt: null }
        }
      }
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating income record:", error);
    throw error;
  }
};

// Approve record by role
export const approveRecord = async (recordId, role, userId) => {
  try {
    const updateData = {
      [`meta.approvals.${role}`]: {
        approved: true,
        approvedBy: userId,
        approvedAt: new Date().toISOString()
      }
    };

    const recordRef = doc(db, 'incomeRecords', recordId);
    await updateDoc(recordRef, updateData);

    // Check if fully approved
    const recordSnap = await getDoc(recordRef);
    const approvals = recordSnap.data().meta.approvals;
    const isFullyApproved = Object.values(approvals).every(a => a.approved);

    if (isFullyApproved) {
      await updateDoc(recordRef, {
        'meta.status': 'approved'
      });
    }

    return true;
  } catch (error) {
    console.error("Error approving record:", error);
    throw error;
  }
};

// Get records by branch and date range
export const getIncomeRecords = async (branchId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'incomeRecords'),
      where('meta.churchBranch', '==', branchId),
      where('serviceInfo.date', '>=', startDate),
      where('serviceInfo.date', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching income records:", error);
    throw error;
  }
};

// Export all functions
export default {
  addIncomeRecord,
  approveRecord,
  getIncomeRecords
};