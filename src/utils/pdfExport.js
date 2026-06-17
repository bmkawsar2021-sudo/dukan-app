import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const escapeHtml = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const formatMoney = (n) => `Tk. ${Number(n || 0).toFixed(2)}`;

const buildInvoiceHtml = (invoice) => {
  const items = (invoice.items || []).map((item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.name)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatMoney(item.unitPrice)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">${formatMoney((item.quantity || 0) * (item.unitPrice || 0))}</td>
    </tr>`).join('');

  return `
    <div style="width:794px;padding:40px;background:#ffffff;color:#111827;font-family:Inter,Arial,sans-serif;">
      <div style="text-align:center;border-bottom:2px solid #6366f1;padding-bottom:16px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:26px;color:#111827;">${escapeHtml(invoice.shopName || 'Amar Dukan')}</h1>
        ${invoice.shopAddress ? `<p style="margin:4px 0 0;font-size:13px;color:#6b7280;">${escapeHtml(invoice.shopAddress)}</p>` : ''}
        ${invoice.shopPhone ? `<p style="margin:2px 0 0;font-size:13px;color:#6b7280;">Phone: ${escapeHtml(invoice.shopPhone)}</p>` : ''}
        <p style="margin:12px 0 0;font-size:18px;font-weight:700;color:#6366f1;letter-spacing:1px;">CASH MEMO</p>
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:20px;font-size:13px;">
        <div>
          <p style="margin:0 0 4px;color:#6b7280;font-weight:600;">BILL TO</p>
          <p style="margin:0;font-weight:700;font-size:15px;">${escapeHtml(invoice.customerName || 'Walk-in Customer')}</p>
          ${invoice.customerPhone ? `<p style="margin:2px 0 0;color:#6b7280;">${escapeHtml(invoice.customerPhone)}</p>` : ''}
        </div>
        <div style="text-align:right;">
          <p style="margin:0;"><span style="color:#6b7280;">Invoice #</span> <strong>${escapeHtml(invoice.invoiceNumber)}</strong></p>
          <p style="margin:4px 0 0;"><span style="color:#6b7280;">Date</span> <strong>${escapeHtml(invoice.date)}</strong></p>
          <p style="margin:4px 0 0;"><span style="color:#6b7280;">Status</span> <strong style="color:${invoice.paymentStatus === 'due' ? '#dc2626' : '#059669'};">${(invoice.paymentStatus || 'paid').toUpperCase()}</strong></p>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f3f4f6;">
            <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #d1d5db;text-transform:uppercase;font-size:11px;color:#374151;">Item</th>
            <th style="padding:10px 12px;text-align:center;border-bottom:2px solid #d1d5db;text-transform:uppercase;font-size:11px;color:#374151;">Qty</th>
            <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #d1d5db;text-transform:uppercase;font-size:11px;color:#374151;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;border-bottom:2px solid #d1d5db;text-transform:uppercase;font-size:11px;color:#374151;">Total</th>
          </tr>
        </thead>
        <tbody>${items || `<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af;">No items</td></tr>`}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-top:20px;">
        <div style="width:280px;">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6b7280;">
            <span>Subtotal</span><span>${formatMoney(invoice.subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:13px;color:#6b7280;">
            <span>Discount</span><span>- ${formatMoney(invoice.discount)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;border-top:2px solid #111827;padding-top:10px;margin-top:6px;font-size:18px;font-weight:800;">
            <span>Grand Total</span><span style="color:#6366f1;">${formatMoney(invoice.grandTotal)}</span>
          </div>
        </div>
      </div>

      <p style="margin-top:40px;text-align:center;font-size:12px;color:#9ca3af;">Thank you for your purchase!</p>
    </div>`;
};

/**
 * Export invoice PDF using html2canvas for perfect Bengali + formatting support.
 * Builds a self-contained preview, captures it, and places it in an A4 PDF.
 * No reliance on a #invoice-preview element being present in the DOM.
 */
export const exportInvoicePDF = async (invoice) => {
  if (!invoice || !Array.isArray(invoice.items) || invoice.items.length === 0) {
    throw new Error('Cannot export an empty invoice. Add at least one item first.');
  }

  const host = document.createElement('div');
  host.id = 'invoice-preview';
  host.style.position = 'fixed';
  host.style.left = '-10000px';
  host.style.top = '0';
  host.style.pointerEvents = 'none';
  host.innerHTML = buildInvoiceHtml(invoice);
  document.body.appendChild(host);

  try {
    // Wait for images (logo, etc.) to load
    await new Promise((r) => setTimeout(r, 200));

    const canvas = await html2canvas(host, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let position = 0;
    let heightLeft = imgHeight;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
  } finally {
    if (host.parentNode) host.parentNode.removeChild(host);
  }
};

/**
 * Export sales ledger PDF - uses simple jsPDF (no Bengali needed, numbers only)
 */
export const exportSalesLedgerPDF = (invoices, dateRange) => {
  const doc = new jsPDF();
  const settings = JSON.parse(localStorage.getItem('dukan_settings') || '{}');

  // Header
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.shopName || 'DUKAN', 105, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Sales Ledger', 105, 20, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  let y = 36;

  if (dateRange && (dateRange.from || dateRange.to)) {
    doc.setFontSize(9);
    doc.text(`Period: ${dateRange.from || 'Start'} to ${dateRange.to || 'End'}`, 15, y);
    y += 6;
  }

  const totalSales = invoices.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const tableData = invoices.map((inv) => [
    inv.invoiceNumber,
    inv.date,
    inv.customerName || 'Walk-in',
    Number(inv.subtotal || 0).toFixed(2),
    Number(inv.discount || 0).toFixed(2),
    Number(inv.grandTotal || 0).toFixed(2),
  ]);

  // eslint-disable-next-line
  const autoTable = require('jspdf-autotable').default;
  autoTable(doc, {
    startY: y,
    head: [['Invoice #', 'Date', 'Customer', 'Subtotal', 'Discount', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 15 },
  });

  y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Sales: ${totalSales.toFixed(2)}`, 195, y, { align: 'right' });
  doc.text(`Total Invoices: ${invoices.length}`, 15, y);

  doc.save('sales-ledger.pdf');
};

/**
 * Export expenses PDF - uses simple jsPDF (no Bengali needed)
 */
export const exportExpensesPDF = (expenses, month) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Expense Report', 105, 12, { align: 'center' });
  if (month) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(month, 105, 20, { align: 'center' });
  }
  doc.setTextColor(0, 0, 0);

  let y = 36;
  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const categoryTotals = {};
  expenses.forEach((exp) => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const tableData = expenses.map((exp) => [
    exp.date,
    exp.category,
    exp.description || '-',
    Number(exp.amount).toFixed(2),
  ]);

  // eslint-disable-next-line
  const autoTable = require('jspdf-autotable').default;
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Category', 'Description', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 15 },
  });

  y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Expenses: ${totalExpenses.toFixed(2)}`, 195, y, { align: 'right' });

  y += 10;
  doc.setFontSize(10);
  doc.text('Category Summary:', 15, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  Object.entries(categoryTotals).forEach(([cat, amount]) => {
    doc.text(`${cat}: ${amount.toFixed(2)}`, 20, y);
    y += 5;
  });

  doc.save(`expenses-${month || 'all'}.pdf`);
};

/**
 * Export event PDF - uses simple jsPDF (no Bengali needed)
 */
export const exportEventPDF = (event) => {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Event: ${event.name}`, 105, 12, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${event.type} - ${event.date}`, 105, 20, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  let y = 36;

  const totalIncome = (event.income || []).reduce((sum, i) => sum + (i.amount || 0), 0);
  const totalExpense = (event.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const profit = totalIncome - totalExpense;

  // Income table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Income', 15, y);
  y += 2;

  const incomeData = (event.income || []).map((inc) => [
    inc.description || '-',
    Number(inc.amount).toFixed(2),
  ]);
  incomeData.push(['TOTAL', totalIncome.toFixed(2)]);

  // eslint-disable-next-line
  const autoTable = require('jspdf-autotable').default;
  autoTable(doc, {
    startY: y,
    head: [['Description', 'Amount']],
    body: incomeData,
    theme: 'grid',
    headStyles: { fillColor: [34, 197, 94], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 15, right: 105 },
  });

  const incomeTableFinalY = doc.lastAutoTable.finalY;

  // Expense table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Expenses', 105, y);
  y += 2;

  const expenseData = (event.expenses || []).map((exp) => [
    exp.description || '-',
    Number(exp.amount).toFixed(2),
  ]);
  expenseData.push(['TOTAL', totalExpense.toFixed(2)]);

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Amount']],
    body: expenseData,
    theme: 'grid',
    headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    margin: { left: 105, right: 15 },
  });

  y = Math.max(doc.lastAutoTable.finalY, incomeTableFinalY) + 12;

  // Profit/Loss box
  const boxColor = profit >= 0 ? [5, 150, 105] : [239, 68, 68];
  doc.setFillColor(...boxColor);
  doc.roundedRect(60, y - 5, 90, 16, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Profit/Loss: ${profit.toFixed(2)}`, 105, y + 5, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  doc.save(`event-${event.name}.pdf`);
};
