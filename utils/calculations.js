export const calculateTotalOffering = (notes, coins) => {
    const notesTotal = Object.values(notes).reduce(
      (sum, note) => sum + (note.total || 0), 0
    );
    const coinsTotal = Object.values(coins).reduce(
      (sum, coin) => sum + (coin.total || 0), 0
    );
    return notesTotal + coinsTotal;
  };
  
  export const calculateTotalAttendance = (attendance) => {
    return (
      (attendance.male || 0) + 
      (attendance.female || 0) + 
      (attendance.teenager || 0) + 
      (attendance.children || 0)
    );
  };
  
  export const calculatePeriodTotal = (records) => {
    return records.reduce((total, record) => {
      return total + calculateTotalOffering(record.notes, record.coins);
    }, 0);
  };