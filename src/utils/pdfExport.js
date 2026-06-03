import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Export invoice PDF using html2canvas for perfect Bengali + formatting support.
 * Captures the hidden #invoice-preview div as an image and places it in an A4 PDF.
 */
export const exportInvoicePDF = async (invoice) => {
  const element = document.getElementById('invoice-preview');
  if (!element) {
    alert('Invoice preview not found. Please try again.');
    return;
  }

  // Wait for images to load
  await new Promise((r) => setTimeout(r, 200));

  const canvas = await html2canvas(element, {
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
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  // If content is taller than one page, split across pages
  const pageHeight = pdf.internal.pageSize.getHeight();
  let heightLeft = pdfHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(`${invoice.invoiceNumber || 'invoice'}.pdf`);
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
