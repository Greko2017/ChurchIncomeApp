import { db } from '../config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const getBranchIncomeReport = async (branchId, startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'incomeRecords'),
      where('churchBranch', '==', branchId),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching branch report:", error);
    throw error;
  }
};

export const getConsolidatedReport = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'incomeRecords'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );
    
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Group by branch
    const branchData = records.reduce((acc, record) => {
      const branch = record.churchBranch || 'Unknown';
      if (!acc[branch]) {
        acc[branch] = {
          total: 0,
          services: 0,
          attendance: 0
        };
      }
      
      const offeringTotal = Object.values(record.notes).reduce(
        (sum, note) => sum + (note.total || 0), 0
      );
      
      acc[branch].total += offeringTotal;
      acc[branch].services += 1;
      acc[branch].attendance += (record.attendance.male || 0) + (record.attendance.female || 0);
      
      return acc;
    }, {});
    
    return {
      records,
      summary: {
        startDate,
        endDate,
        totalBranches: Object.keys(branchData).length,
        totalServices: records.length,
        totalAmount: Object.values(branchData).reduce((sum, branch) => sum + branch.total, 0),
        branchData,
      }
    };
  } catch (error) {
    console.error("Error fetching consolidated report:", error);
    throw error;
  }
};