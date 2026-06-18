import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { subscribeInvoices, deleteInvoice, getSettings, formatCurrency, formatDate } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

const st = {
  card: { background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  cardBody: { padding: 20 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, fontFamily: "'Inter', sans-serif", outline: 'none' },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 },
  btnPrimary: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif", boxShadow: '0 2px 8px rgba(99,102,241,0.3)' },
  btnDanger: { background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  btnGhost: { background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: "'Inter', sans-serif" },
  th: { textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', background: 'transparent', borderBottom: '2px solid var(--border)' },
  thRight: { textAlign: 'right', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', background: 'transparent', borderBottom: '2px solid var(--border)' },
  thCenter: { textAlign: 'center', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', background: 'transparent', borderBottom: '2px solid var(--border)' },
  td: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)' },
  tdRight: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)', textAlign: 'right' },
  tdCenter: { padding: '12px 16px', fontSize: 14, borderBottom: '1px solid var(--border)', color: 'var(--text)', textAlign: 'center' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 },
  modalContent: { background: 'var(--card)', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' },
};

const InvoiceModal = ({ invoice, onClose, onDelete, shopSettings, uid }) => {
  if (!invoice) return null;
  const [settings, setSettings] = useState({ shopName: 'Amar Dukan', shopAddress: '', shopPhone: '' });

  useEffect(() => { if (uid) getSettings(uid).then(setSettings); }, [uid]);

  return (
    <div style={st.modal} onClick={onClose}>
      <div style={st.modalContent} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', padding: 20, borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', gap: 16 }}>
          {settings.shopLogo && <img src={settings.shopLogo} alt="Logo" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.5)' }} />}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{settings.shopName || 'Amar Dukan'}</h3>
            {settings.shopAddress && <p style={{ fontSize: 12, opacity: 0.8 }}>{settings.shopAddress}</p>}
            {settings.shopPhone && <p style={{ fontSize: 12, opacity: 0.8 }}>Phone: {settings.shopPhone}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 24, cursor: 'pointer' }}>&times;</button>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>INVOICE</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{invoice.invoiceNumber}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DATE</p>
              <p style={{ fontWeight: 600, color: 'var(--text)' }}>{invoice.date}</p>
            </div>
          </div>
          <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CUSTOMER</p>
            <p style={{ fontWeight: 600, color: 'var(--text)' }}>{invoice.customerName || 'Walk-in Customer'}</p>
            {invoice.customerPhone && <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{invoice.customerPhone}</p>}
          </div>
          <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
            <thead>
              <tr>
                <th style={st.th}>#</th>
                <th style={st.th}>Item</th>
                <th style={st.thCenter}>Qty</th>
                <th style={st.thRight}>Price</th>
                <th style={st.thRight}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td style={st.td}>{idx + 1}</td>
                  <td style={{ ...st.td, fontWeight: 600 }}>{item.name}</td>
                  <td style={st.tdCenter}>{item.quantity}</td>
                  <td style={st.tdRight}>{Number(item.unitPrice).toFixed(2)}</td>
                  <td style={{ ...st.tdRight, fontWeight: 600 }}>{(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ color: 'var(--text)' }}>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: 'var(--text-secondary)' }}>Discount</span>
              <span style={{ color: 'var(--danger)' }}>-{formatCurrency(invoice.discount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 4 }}>
              <span style={{ color: 'var(--text)' }}>Grand Total</span>
              <span style={{ color: 'var(--primary)' }}>{formatCurrency(invoice.grandTotal)}</span>
            </div>
          </div>
          {(invoice.customerSig || invoice.sellerSig) && (
            <div style={{ display: 'flex', gap: 24, marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                {invoice.customerSig && <img src={invoice.customerSig} alt="Customer Sig" style={{ height: 48, margin: '0 auto 4px', display: 'block' }} />}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{invoice.customerSigName || '________________'}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Customer</p>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                {invoice.sellerSig && <img src={invoice.sellerSig} alt="Seller Sig" style={{ height: 48, margin: '0 auto 4px', display: 'block' }} />}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{invoice.sellerSigName || '________________'}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Seller</p>
                </div>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
            <button onClick={() => onDelete(invoice.id)} style={st.btnDanger}>Delete</button>
            <button onClick={onClose} style={{ ...st.btnGhost, flex: 1 }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalesLedger = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [settings, setSettings] = useState({ shopName: 'Dukan', shopAddress: '' });

  useEffect(() => {
    if (!currentUser) return;
    getSettings(currentUser.uid).then(setSettings);
    const unsub = subscribeInvoices(currentUser.uid, (data) => {
      setInvoices(data);
    });
    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (location.state?.highlightInvoice && invoices.length > 0) {
      const inv = invoices.find((i) => i.invoiceNumber === location.state.highlightInvoice);
      if (inv) setSelectedInvoice(inv);
    }
  }, [location.state, invoices]);

  useEffect(() => {
    let result = [...invoices];
    if (dateFrom) result = result.filter((inv) => inv.date >= dateFrom);
    if (dateTo) result = result.filter((inv) => inv.date <= dateTo);
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNumber?.toLowerCase().includes(term) ||
          inv.customerName?.toLowerCase().includes(term)
      );
    }
    setFiltered(result);
  }, [dateFrom, dateTo, searchTerm, invoices]);

  const totalSales = filtered.reduce((sum, inv) => sum + (inv.grandTotal || 0), 0);

  const handleDelete = async (id) => {
    if (!currentUser) return;
    if (!window.confirm('Delete this invoice?')) return;
    await deleteInvoice(currentUser.uid, id);
    setSelectedInvoice(null);
  };

  return (
    <div>
      <div className="hero-header">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Sales Ledger</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>All Invoices</p>
      </div>

      {/* Filter Card */}
      <div style={{ ...st.card, marginBottom: 24 }}>
        <div style={st.cardBody}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, alignItems: 'end' }}>
            <div>
              <label style={st.label}>From Date</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={st.input} />
            </div>
            <div>
              <label style={st.label}>To Date</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={st.input} />
            </div>
            <div>
              <label style={st.label}>Search</label>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Invoice # or customer" style={st.input} />
            </div>
            <div style={{ display: 'flex', alignItems: 'end', gap: 12, flexWrap: 'wrap' }}>
              <button onClick={() => { setDateFrom(''); setDateTo(''); setSearchTerm(''); }} style={st.btnPrimary}>Clear</button>
              <div style={{ marginLeft: 'auto' }}>
                <span className="desktop-only" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total: </span>
                <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(totalSales)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div style={st.card}>
        <div className="table-scroll">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={st.th}>Invoice #</th>
                <th style={st.th}>Customer</th>
                <th style={st.th}>Date</th>
                <th style={st.thCenter}>Items</th>
                <th style={st.thRight}>Total</th>
                <th style={st.thCenter}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" style={{ ...st.td, textAlign: 'center', padding: 32, color: '#64748b' }}>No invoices found. Create one from Cash Memo!</td></tr>
              ) : (
                [...filtered].reverse().map((inv, idx) => (
                  <tr key={inv.id || idx}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ ...st.td, fontWeight: 600, color: 'var(--primary)' }}>{inv.invoiceNumber}</td>
                    <td style={st.td}>{inv.customerName || 'Walk-in'}</td>
                    <td style={st.td}>{formatDate(inv.date)}</td>
                    <td style={st.tdCenter}>{inv.items?.length || 0}</td>
                    <td style={{ ...st.tdRight, fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(inv.grandTotal)}</td>
                    <td style={st.tdCenter}>
                      <button onClick={() => setSelectedInvoice(inv)} style={{ ...st.btnPrimary, padding: '5px 12px', fontSize: 12, borderRadius: 8 }}>View</button>
                      <button
                        onClick={() => {
                          const itemsList = (inv.items || []).map(i => `${i.name} x ${i.quantity} = Tk. ${(i.quantity * i.unitPrice).toFixed(2)}`).join('\n');
                          const msg = `🧾 *${inv.shopName || settings.shopName || 'Dukan'}*\n📍 ${settings.shopAddress || ''}\n─────────────────\n📅 Date: ${inv.date}\n🧾 Invoice: #${inv.invoiceNumber}\n👤 Customer: ${inv.customerName || 'Walk-in'}\n\n📦 *Items:*\n${itemsList}\n\n─────────────────\n🔢 Subtotal: Tk. ${(inv.subtotal || 0).toFixed(2)}\n🏷️ Discount: Tk. ${(inv.discount || 0).toFixed(2)}\n💰 *Total: Tk. ${(inv.grandTotal || 0).toFixed(2)}*\n\nThank you for shopping! 🙏\n*Dukan App*`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        style={{ background: '#25D366', color: 'white', border: 'none', padding: '5px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer', marginLeft: 6 }}
                      >
                        📱
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && currentUser && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDelete={handleDelete}
          uid={currentUser.uid}
        />
      )}
    </div>
  );
};

export default SalesLedger;
