import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';

export const generatePDF = async (data) => {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; }
          h1 { color: #2c3e50; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Church Income Report</h1>
        <h2>${new Date().toLocaleDateString()}</h2>
        
        <h3>Notes</h3>
        <table>
          <tr>
            <th>Denomination</th>
            <th>Quantity</th>
            <th>Total</th>
          </tr>
          ${Object.entries(data.notes).map(([denom, item]) => `
            <tr>
              <td>₦${Number(denom).toLocaleString()}</td>
              <td>${item.qty}</td>
              <td>₦${item.total.toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  return uri;
};