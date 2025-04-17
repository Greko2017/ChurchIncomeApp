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

export const generatePdfHtml = (service, serviceDetails, branchName) => {
  // Calculate totals
  const incomeTotals = {
    offering: serviceDetails.denominations.reduce((sum, d) => sum + (d.offering * d.value), 0),
    tithe: serviceDetails.denominations.reduce((sum, d) => sum + (d.tithe * d.value), 0),
    project: serviceDetails.denominations.reduce((sum, d) => sum + (d.project * d.value), 0),
    shiloh: serviceDetails.denominations.reduce((sum, d) => sum + (d.shiloh * d.value), 0),
    thanksgiving: serviceDetails.denominations.reduce((sum, d) => sum + (d.thanksgiving * d.value), 0)
  };

  const grandTotal = 
    incomeTotals.offering + 
    incomeTotals.tithe + 
    incomeTotals.project + 
    incomeTotals.shiloh + 
    incomeTotals.thanksgiving;

  const attendanceTotal = 
    serviceDetails.attendance.male + 
    serviceDetails.attendance.female + 
    serviceDetails.attendance.teenager + 
    serviceDetails.attendance.children;

  // Function to convert number to words
  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

    if (num === 0) return 'Zero';
    if (num < 10) return ones[num];
    if (num < 20) return teens[num - 10];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + numberToWords(num % 100) : '');
    if (num < 1000000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
    return 'Number too large';
  };

  return `
    <html>
      <head>
        <style>
          body { 
            font-family: Arial; 
            padding: 20px;
            color: #34495e;
            font-size: 11px;
            line-height: 1.2;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .header h1 {
            font-size: 16px;
            font-weight: bold;
            margin: 0;
            text-transform: uppercase;
          }
          .header h2 {
            font-size: 14px;
            margin: 5px 0;
            text-transform: uppercase;
          }
          .info-row {
            margin: 5px 0;
            display: flex;
            gap: 30px;
          }
          .info-item {
            display: flex;
            gap: 10px;
          }
          .info-label {
            font-weight: bold;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
            font-size: 10px;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px; 
            text-align: left; 
          }
          th { 
            background-color: #f2f2f2;
            font-weight: bold;
          }
          .total-row {
            font-weight: bold;
            background-color: #f8f9fa;
          }
          .grand-total-row {
            font-weight: bold;
            background-color: #e8f5e9;
          }
          .right-align {
            text-align: right;
          }
          .center-align {
            text-align: center;
          }
          .attendance-table {
            margin-top: 20px;
          }
          .message-info {
            margin-top: 20px;
          }
          .message-info input {
            width: 100%;
            border: 1px solid #000;
            padding: 4px;
          }
          .additional-info {
            margin-top: 20px;
          }
          .counters-section {
            margin-top: 20px;
          }
          .counters-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin-top: 10px;
          }
          .counter-slot {
            border-bottom: 1px dotted #000;
            padding: 5px;
            min-height: 20px;
          }
          .confirmation-section {
            margin-top: 20px;
          }
          .note {
            font-style: italic;
            font-size: 9px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${branchName}</h1>
          <h2>INCOME SHEET</h2>
        </div>

        <div class="info-row">
          <div class="info-item">
            <span class="info-label">DATE:</span>
            <span>${new Date(service.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="info-item">
            <span class="info-label">SERVICE:</span>
            <span>${service.title}</span>
          </div>
        </div>

        <div class="section">
          <h2>Income Breakdown</h2>
          <table>
            <tr>
              <th rowspan="2">DENOMINATION</th>
              <th colspan="2">OFFERING</th>
              <th colspan="2">TITHE</th>
              <th colspan="2">TRANSPORT</th>
              <th colspan="2">PROJECT</th>
              <th colspan="2">SHILOH</th>
              <th colspan="2">THANKSGIVING</th>
              <th colspan="2">NEEDY/WIDOWS</th>
            </tr>
            <tr>
              <th>QTY</th>
              <th>TOTAL</th>
              <th>QTY</th>
              <th>TOTAL</th>
              <th>QTY</th>
              <th>TOTAL</th>
              <th>QTY</th>
              <th>TOTAL</th>
              <th>QTY</th>
              <th>TOTAL</th>
              <th>QTY</th>
              <th>TOTAL</th>
              <th>QTY</th>
              <th>TOTAL</th>
            </tr>
            <tr>
              <th colspan="15" style="background-color: #f8f9fa; text-align: center;">NOTES</th>
            </tr>
            ${serviceDetails.denominations.filter(d => d.value > 500).map(denom => {
              const offeringTotal = denom.offering * denom.value;
              const titheTotal = denom.tithe * denom.value;
              const transportTotal = denom.transport * denom.value || 0;
              const projectTotal = denom.project * denom.value;
              const shilohTotal = denom.shiloh * denom.value;
              const thanksgivingTotal = denom.thanksgiving * denom.value;
              const needyTotal = denom.needy * denom.value || 0;
              
              return `
                <tr>
                  <td>₦${denom.value.toLocaleString()}</td>
                  <td class="center-align">${denom.offering || 0}</td>
                  <td class="right-align">₦${offeringTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.tithe || 0}</td>
                  <td class="right-align">₦${titheTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.transport || 0}</td>
                  <td class="right-align">₦${transportTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.project || 0}</td>
                  <td class="right-align">₦${projectTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.shiloh || 0}</td>
                  <td class="right-align">₦${shilohTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.thanksgiving || 0}</td>
                  <td class="right-align">₦${thanksgivingTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.needy || 0}</td>
                  <td class="right-align">₦${needyTotal.toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
            <tr>
              <th colspan="15" style="background-color: #f8f9fa; text-align: center;">COINS</th>
            </tr>
            ${serviceDetails.denominations.filter(d => d.value <= 500).map(denom => {
              const offeringTotal = denom.offering * denom.value;
              const titheTotal = denom.tithe * denom.value;
              const transportTotal = denom.transport * denom.value || 0;
              const projectTotal = denom.project * denom.value;
              const shilohTotal = denom.shiloh * denom.value;
              const thanksgivingTotal = denom.thanksgiving * denom.value;
              const needyTotal = denom.needy * denom.value || 0;
              
              return `
                <tr>
                  <td>₦${denom.value.toLocaleString()}</td>
                  <td class="center-align">${denom.offering || 0}</td>
                  <td class="right-align">₦${offeringTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.tithe || 0}</td>
                  <td class="right-align">₦${titheTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.transport || 0}</td>
                  <td class="right-align">₦${transportTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.project || 0}</td>
                  <td class="right-align">₦${projectTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.shiloh || 0}</td>
                  <td class="right-align">₦${shilohTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.thanksgiving || 0}</td>
                  <td class="right-align">₦${thanksgivingTotal.toLocaleString()}</td>
                  <td class="center-align">${denom.needy || 0}</td>
                  <td class="right-align">₦${needyTotal.toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td>TOTAL</td>
              <td class="center-align">${serviceDetails.denominations.reduce((sum, d) => sum + (d.offering || 0), 0)}</td>
              <td class="right-align">₦${incomeTotals.offering.toLocaleString()}</td>
              <td class="center-align">${serviceDetails.denominations.reduce((sum, d) => sum + (d.tithe || 0), 0)}</td>
              <td class="right-align">₦${incomeTotals.tithe.toLocaleString()}</td>
              <td class="center-align">${serviceDetails.denominations.reduce((sum, d) => sum + (d.transport || 0), 0)}</td>
              <td class="right-align">₦${incomeTotals.transport?.toLocaleString() || '0'}</td>
              <td class="center-align">${serviceDetails.denominations.reduce((sum, d) => sum + (d.project || 0), 0)}</td>
              <td class="right-align">₦${incomeTotals.project.toLocaleString()}</td>
              <td class="center-align">${serviceDetails.denominations.reduce((sum, d) => sum + (d.shiloh || 0), 0)}</td>
              <td class="right-align">₦${incomeTotals.shiloh.toLocaleString()}</td>
              <td class="center-align">${serviceDetails.denominations.reduce((sum, d) => sum + (d.thanksgiving || 0), 0)}</td>
              <td class="right-align">₦${incomeTotals.thanksgiving.toLocaleString()}</td>
              <td class="center-align">${serviceDetails.denominations.reduce((sum, d) => sum + (d.needy || 0), 0)}</td>
              <td class="right-align">₦${incomeTotals.needy?.toLocaleString() || '0'}</td>
            </tr>
            <tr class="grand-total-row">
              <td colspan="15" class="right-align">
                Grand Total: ₦${grandTotal.toLocaleString()} (${numberToWords(Math.floor(grandTotal))} Naira)
              </td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h2>Attendance</h2>
          <table class="attendance-table">
            <tr>
              <th>MALE</th>
              <th>FEMALE</th>
              <th>TEENAGER</th>
              <th>CHILDREN</th>
              <th>TOTAL</th>
              <th>1ST TMRS</th>
              <th>NC</th>
            </tr>
            <tr>
              <td class="center-align">${serviceDetails.attendance.male}</td>
              <td class="center-align">${serviceDetails.attendance.female}</td>
              <td class="center-align">${serviceDetails.attendance.teenager}</td>
              <td class="center-align">${serviceDetails.attendance.children}</td>
              <td class="center-align">${
                serviceDetails.attendance.male +
                serviceDetails.attendance.female +
                serviceDetails.attendance.teenager +
                serviceDetails.attendance.children
              }</td>
              <td class="center-align">${serviceDetails.attendance.firstTimers}</td>
              <td class="center-align">${serviceDetails.attendance.nc}</td>
            </tr>
          </table>
        </div>

        <div class="message-info">
          <table>
            <tr>
              <td style="width: 200px;"><strong>TITLE OF THE MESSAGE</strong></td>
              <td>${serviceDetails.messageTitle || ''}</td>
            </tr>
            <tr>
              <td><strong>NAME OF THE PREACHER</strong></td>
              <td>${serviceDetails.preacher || ''}</td>
            </tr>
            <tr>
              <td><strong>NAME OF THE ZONAL PASTOR</strong></td>
              <td>${serviceDetails.zonalPastor || ''}</td>
            </tr>
          </table>
        </div>

        
        <div class="section">
          <h2>System Information</h2>
          <div class="info-row">
            <span class="info-label">Counters:</span>
            <span>${serviceDetails.counters?.join(', ') || 'N/A'}</span>
          </div>
          ${serviceDetails.status === 'approved' ? `
            <div class="info-row">
              <span class="info-label">Approved By:</span>
              <span>${serviceDetails.approvedBy || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Approved At:</span>
              <span>${new Date(serviceDetails.approvedAt).toLocaleString()}</span>
            </div>
          ` : ''}
        </div>

        <div class="counters-section">
          <strong>NAME OF COUNTERS / SIGNATURE</strong>
          <div class="counters-grid">
            ${Array.from({ length: 4 }, (_, i) => `
              <div class="counter-slot">
                ${i + 1}. ${serviceDetails.counters?.[i] || ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="confirmation-section">
          <strong>CONFIRMED AND ACCEPT BY:</strong>
          <div class="counter-slot">
            ${serviceDetails.approvedBy || ''}
          </div>
        </div>

        <div class="note">
          N.B: please attached your testimonies behind
        </div>

      </body>
    </html>
  `;
};