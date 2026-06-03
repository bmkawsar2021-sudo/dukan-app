import React, { useState, useEffect, useRef } from 'react';
import {
  getSettings, saveSettings, addInvoice, getNextInvoiceNumber,
  getToday, formatCurrency, subscribeCustomers, addDue,
} from '../utils/storage';
import { exportInvoicePDF } from '../utils/pdfExport';
import { useToast } from '../context/ToastContext';
import { useShop } from '../context/ShopContext';

const getInitials = (name) => {
  if (!name) return 'DU';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

export default function CashMemo() {
  const { success, error: toastError } = useToast();
  const { currentShop } = useShop();
  const [settings, setSettings] = useState({ shopName: 'Amar Dukan', shopAddress: '', shopPhone: '', shopLogo: null });
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(getToday());
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState([{ name: '', quantity: 1, unitPrice: 0 }]);
  const [customers, setCustomers] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [lastSavedInvoice, setLastSavedInvoice] = useState(null);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      setLogoPreview(s.shopLogo || null);
    });
    getNextInvoiceNumber().then(setInvoiceNumber);
    const unsub = subscribeCustomers(setCustomers);
    return () => unsub();
  }, []);

  const shopName = currentShop?.name || settings.shopName || 'Amar Dukan';
  const shopAddress = currentShop?.address || settings.shopAddress || '';
  const shopPhone = currentShop?.phone || settings.shopPhone || '';

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setLogoPreview(ev.target.result);
      saveSettings({ ...settings, shopLogo: ev.target.result });
    };
    reader.readAsDataURL(file);
  };

  const addItem = () => setItems([...items, { name: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx) => { if (items.length > 1) setItems(items.filter((_, i) => i !== idx)); };
  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);
  const grandTotal = Math.max(0, subtotal - (discount || 0));
  const validItems = items.filter(item => item.name.trim());

  const handleSave = async () => {
    if (validItems.length === 0) { toastError('Please add at least one item'); return; }
    setSaving(true);
    try {
      const invoice = {
        invoiceNumber, date, customerName: customerName.trim() || 'Walk-in Customer', customerPhone,
        items: validItems, subtotal, discount: Number(discount) || 0, grandTotal, paymentStatus,
        shopName, shopAddress, shopPhone,
      };
      const id = await addInvoice(invoice);

      if (paymentStatus === 'due' && id) {
        await addDue({
          customerName: customerName.trim() || 'Walk-in Customer', customerPhone,
          amount: grandTotal, invoiceId: id, invoiceNumber, date, status: 'due',
        });
      }

      const nextNum = await getNextInvoiceNumber();
      success(`Invoice ${invoiceNumber} saved!`);
      setLastSavedInvoice({ ...invoice, items: validItems });
      setTimeout(() => setLastSavedInvoice(null), 30000);
      setInvoiceNumber(nextNum);
      setCustomerName(''); setCustomerPhone(''); setDiscount(0);
      setItems([{ name: '', quantity: 1, unitPrice: 0 }]);
      setPaymentStatus('paid');
    } catch (e) {
      console.error('Save invoice error:', e);
      toastError('Failed to save invoice');
    }
    setSaving(false);
  };

  const handleDownloadPDF = async () => {
    setExporting(true);
    try {
      await exportInvoicePDF({
        invoiceNumber, date, customerName, customerPhone,
        items: validItems, subtotal, discount: Number(discount) || 0, grandTotal,
      });
    } catch (e) {
      console.error('PDF export error:', e);
      toastError('PDF export failed');
    }
    setExporting(false);
  };

  const cardStyle = { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };
  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 12, background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color 0.2s' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 };
  const btnPrimary = { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s' };
  const btnSuccess = { background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' };
  const btnGhost = { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' };

  return (
    <div>
      <div className="hero-header">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Cash Memo / Invoice</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Create and manage invoices</p>
      </div>

      {/* WhatsApp share after save */}
      {lastSavedInvoice && (
        <div className="card" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>Invoice saved! Share via:</span>
          <button
            onClick={() => {
              const inv = lastSavedInvoice;
              const itemsList = inv.items.map(i => `${i.name} x ${i.quantity} = Tk. ${(i.quantity * i.unitPrice).toFixed(2)}`).join('\n');
              const msg = `🧾 *${inv.shopName}*\n📍 ${inv.shopAddress || ''}\n─────────────────\n📅 Date: ${inv.date}\n🧾 Invoice: #${inv.invoiceNumber}\n👤 Customer: ${inv.customerName}\n\n📦 *Items:*\n${itemsList}\n\n─────────────────\n💰 *Total: Tk. ${inv.grandTotal.toFixed(2)}*\n💳 Status: ${inv.paymentStatus === 'paid' ? 'Paid' : 'Due'}\n\nThank you! 🙏\n*Dukan App*`;
              window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
            }}
            style={{ background: '#25D366', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            📱 WhatsApp
          </button>
        </div>
      )}

      <div style={cardStyle}>
        {/* Logo upload */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 80, height: 80, borderRadius: '50%', border: '2px dashed var(--border)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              background: 'var(--bg)', overflow: 'hidden', position: 'relative',
            }}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            ) : (
              <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-secondary)' }}>{getInitials(shopName)}</span>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Click to upload logo</p>
        </div>

        {/* Shop Info */}
        <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{shopName}</h2>
          {shopAddress && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{shopAddress}</p>}
          {shopPhone && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Phone: {shopPhone}</p>}
          <p style={{ fontSize: 16, fontWeight: 700, color: '#6366f1', marginTop: 8 }}>CASH MEMO</p>
        </div>

        {/* Invoice Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={labelStyle}>Invoice Number</label>
            <input style={{ ...inputStyle, background: 'var(--bg)', cursor: 'default' }} value={invoiceNumber} readOnly />
          </div>
          <div>
            <label style={labelStyle}>Date</label>
            <input style={inputStyle} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Customer Phone</label>
            <input style={inputStyle} value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
        </div>

        {/* Customer Name with autocomplete */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Customer Name</label>
          <input
            style={inputStyle}
            list="customer-list"
            value={customerName}
            onChange={e => {
              setCustomerName(e.target.value);
              const match = customers.find(c => c.name === e.target.value);
              if (match && match.phone) setCustomerPhone(match.phone);
            }}
            placeholder="Type or select customer"
          />
          <datalist id="customer-list">
            {customers.map(c => <option key={c.id} value={c.name} />)}
          </datalist>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Items</label>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)' }}>Item Name</th>
                  <th style={{ textAlign: 'center', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)', width: 100 }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)', width: 130 }}>Unit Price</th>
                  <th style={{ textAlign: 'right', padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', borderBottom: '2px solid var(--border)', width: 130 }}>Total</th>
                  <th style={{ width: 50, borderBottom: '2px solid var(--border)' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 4px' }}>
                      <input style={inputStyle} value={item.name} onChange={e => updateItem(idx, 'name', e.target.value)} placeholder="Item name" />
                    </td>
                    <td style={{ padding: '8px 4px' }}>
                      <input style={{ ...inputStyle, textAlign: 'center' }} type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} min="1" />
                    </td>
                    <td style={{ padding: '8px 4px' }}>
                      <input style={{ ...inputStyle, textAlign: 'right' }} type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} min="0" step="0.01" />
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                      {formatCurrency((item.quantity || 0) * (item.unitPrice || 0))}
                    </td>
                    <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                      <button onClick={() => removeItem(idx)} disabled={items.length === 1} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, opacity: items.length === 1 ? 0.3 : 1 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addItem} style={{ ...btnGhost, marginTop: 12, color: '#6366f1', borderColor: '#6366f1' }}>+ Add Item</button>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
          <div style={{ width: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{formatCurrency(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
              <input style={{ ...inputStyle, width: 120, textAlign: 'right' }} type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} min="0" step="0.01" />
            </div>
            <div style={{ borderTop: '2px solid var(--text)', paddingTop: 12, marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 800 }}>
              <span style={{ color: 'var(--text)' }}>Grand Total</span>
              <span style={{ color: '#6366f1' }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div style={{ marginBottom: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <label style={labelStyle}>Payment Status</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 20px', borderRadius: 12,
              border: `2px solid ${paymentStatus === 'paid' ? '#10b981' : 'var(--border)'}`,
              background: paymentStatus === 'paid' ? 'rgba(16,185,129,0.1)' : 'transparent',
            }}>
              <input type="radio" name="paymentStatus" value="paid" checked={paymentStatus === 'paid'} onChange={() => setPaymentStatus('paid')} style={{ accentColor: '#10b981' }} />
              <span style={{ fontWeight: 700, color: paymentStatus === 'paid' ? '#059669' : 'var(--text-secondary)' }}>Paid</span>
            </label>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 20px', borderRadius: 12,
              border: `2px solid ${paymentStatus === 'due' ? '#ef4444' : 'var(--border)'}`,
              background: paymentStatus === 'due' ? 'rgba(239,68,68,0.1)' : 'transparent',
            }}>
              <input type="radio" name="paymentStatus" value="due" checked={paymentStatus === 'due'} onChange={() => setPaymentStatus('due')} style={{ accentColor: '#ef4444' }} />
              <span style={{ fontWeight: 700, color: paymentStatus === 'due' ? '#dc2626' : 'var(--text-secondary)' }}>Due</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 20, borderTop: '1px solid var(--border)' }} className="no-print">
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saving ? 'Saving...' : 'Save Invoice'}
          </button>
          <button onClick={handleDownloadPDF} disabled={exporting} style={btnSuccess}>
            {exporting ? 'Generating...' : 'Download PDF'}
          </button>
          <button onClick={() => window.print()} style={btnGhost}>Print</button>
        </div>
      </div>
    </div>
  );
}
