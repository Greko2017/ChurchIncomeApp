export const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  export const getStartOfDay = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  
  export const getEndOfDay = (date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };
  
  export const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    return new Date(d.setDate(diff));
  };