
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase'
// Fetch default denominations from Firestore
export const getDefaultDenominations = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'denominationSettings'));
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data().defaultDenominations;
    }
    return [];
  } catch (error) {
    console.error("Error fetching denominations:", error);
    return [];
  }
};

// Add new denomination to settings
export const addNewDenomination = async (value, label) => {
  try {
    const docRef = await addDoc(collection(db, 'denominationSettings'), {
      value,
      label,
      isActive: true,
      createdAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding denomination:", error);
    throw error;
  }
};