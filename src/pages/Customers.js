import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeCustomers, addCustomer, updateCustomer, deleteCustomer } from '../utils/storage';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const CustomerModal = ({ customer, onClose, onSave, uid }) => {
  const [form, setForm] = useState(customer || { name: '', phone: '', address: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const handleSave = async () => {
    if (!form.name.trim()) { error('নাম আবশ্যক ❌'); return; }
    if (!form.phone.trim()) { error('ফোন নম্বর আবশ্যক ❌'); return; }
    setSaving(true);
    try {
      if (customer?.id) {
        await updateCustomer(uid, customer.id, form);
        success('গ্রাহক আপডেট হয়েছে ✅');
      } else {
        await addCustomer(uid, form);
        success('গ্রাহক সফলভাবে যোগ হয়েছে ✅');
      }
      onSave();
    } catch (e) {
      console.error('Save customer error:', e);
      error('সমস্যা হয়েছে ❌');
    }
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
          {customer?.id ? 'গ্রাহক সম্পাদনা / Edit Customer' : 'নতুন গ্রাহক / New Customer'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>নাম / Name *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="গ্রাহকের নাম" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>ফোন নম্বর / Phone *</label>
            <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>ঠিকানা / Address</label>
            <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="ঠিকানা" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>নোট / Notes</label>
            <textarea className="input" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="অতিরিক্ত তথ্য..." style={{ resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? <span className="spinner" /> : (customer?.id ? 'আপডেট / Update' : 'সংরক্ষণ / Save')}
          </button>
          <button onClick={onClose} className="btn btn-ghost">বাতিল</button>
        </div>
      </div>
    </div>
  );
};

export default function Customers() {
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { currentUser } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeCustomers(currentUser.uid, (data) => {
      setCustomers(data);
      setLoading(false);
    });
    return () => unsub();
  }, [currentUser]);

  const filtered = customers.filter(c => {
    const term = search.toLowerCase();
    return !term || c.name?.toLowerCase().includes(term) || c.phone?.toLowerCase().includes(term);
  });

  const handleDelete = async (id, name) => {
    if (!currentUser) return;
    if (!window.confirm(`"${name}" গ্রাহক মুছে ফেলবেন?`)) return;
    try {
      await deleteCustomer(currentUser.uid, id);
      success('গ্রাহক মুছে ফেলা হয়েছে ✅');
    } catch (e) {
      console.error('Delete customer error:', e);
      error('সমস্যা হয়েছে ❌');
    }
  };

  return (
    <div>
      <div className="hero-header">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>গ্রাহক তালিকা / Customers</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Manage your customer database</p>
      </div>

      {/* Top bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: 16 }}>🔍</span>
          <input
            className="input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="নাম বা ফোন দিয়ে খুঁজুন..."
            style={{ paddingLeft: 40 }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => { setEditCustomer(null); setShowModal(true); }}>
          ➕ নতুন গ্রাহক
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--border)', borderTopColor: 'var(--primary)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>লোড হচ্ছে...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 12 }}>👥</p>
          <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
            {search ? 'কোনো গ্রাহক পাওয়া যায়নি' : 'কোনো গ্রাহক নেই'}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {search ? 'অন্য নাম বা ফোন দিয়ে খুঁজুন' : 'প্রথম গ্রাহক যোগ করুন! 👆'}
          </p>
        </div>
      )}

      {/* Customer cards grid */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(c => (
            <div key={c.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 16, flexShrink: 0
                }}>
                  {getInitials(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>{c.name}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>📞 {c.phone}</p>
                  {c.address && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {c.address}</p>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                  onClick={() => { setEditCustomer(c); setShowModal(true); }}
                >
                  ✏️ সম্পাদনা
                </button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                  onClick={() => navigate(`/sales-ledger?customer=${encodeURIComponent(c.name)}`)}
                >
                  📋 ইনভয়েস
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && currentUser && (
        <CustomerModal
          customer={editCustomer}
          uid={currentUser.uid}
          onClose={() => { setShowModal(false); setEditCustomer(null); }}
          onSave={() => { setShowModal(false); setEditCustomer(null); }}
        />
      )}
    </div>
  );
}
