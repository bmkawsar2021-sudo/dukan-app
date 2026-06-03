import React, { useState, useEffect, useRef } from 'react';
import { getSettings, saveSettings } from '../utils/storage';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, addDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../context/ToastContext';
import { useShop } from '../context/ShopContext';

const COLLECTIONS = ['invoices', 'expenses', 'products', 'stock_entries', 'events', 'customers', 'dues'];

// Shop Modal
function ShopModal({ shop, onClose, onSave }) {
  const [form, setForm] = useState(shop || { name: '', address: '', phone: '' });
  const { addShop, updateShop } = useShop();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (shop?.id) {
      await updateShop(shop.id, form);
    } else {
      await addShop(form);
    }
    setSaving(false);
    onSave();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: 'var(--card)', borderRadius: 16, padding: 24, maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: 'var(--text)' }}>
          {shop?.id ? 'শপ সম্পাদনা / Edit Shop' : 'নতুন শপ / New Shop'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>শপের নাম / Shop Name *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Amar Dukan" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>ঠিকানা / Address</label>
            <input className="input" value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="123 Main Road, Dhaka" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>ফোন / Phone</label>
            <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            {saving ? <span className="spinner" /> : 'সংরক্ষণ / Save'}
          </button>
          <button onClick={onClose} className="btn btn-ghost">বাতিল</button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { success, error } = useToast();
  const { shops, currentShopId, switchShop, deleteShop, showWelcome } = useShop();
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastBackup, setLastBackup] = useState(localStorage.getItem('lastBackupDate') || '');
  const [showShopModal, setShowShopModal] = useState(false);
  const [editShop, setEditShop] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getSettings().then((s) => {
      setShopName(s.shopName || '');
      setShopAddress(s.shopAddress || '');
      setShopPhone(s.shopPhone || '');
    });
  }, []);

  // Show welcome modal if no shops
  useEffect(() => {
    if (showWelcome) setShowShopModal(true);
  }, [showWelcome]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSettings({ shopName, shopAddress, shopPhone });
      success('সেটিংস সংরক্ষিত হয়েছে ✅');
    } catch (e) {
      console.error('Save settings error:', e);
      error('সমস্যা হয়েছে ❌');
    }
    setSaving(false);
  };

  const handleExport = async () => {
    try {
      const exportData = { exportDate: new Date().toISOString(), version: '1.0', data: {} };
      for (const colName of COLLECTIONS) {
        const snap = await getDocs(collection(db, colName));
        exportData.data[colName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
      const settingsSnap = await getDoc(doc(db, 'app', 'settings'));
      if (settingsSnap.exists()) exportData.data.settings = settingsSnap.data();
      const counterSnap = await getDoc(doc(db, 'app', 'counter'));
      if (counterSnap.exists()) exportData.data.counter = counterSnap.data();
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dukan-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const now = new Date().toISOString();
      localStorage.setItem('lastBackupDate', now);
      setLastBackup(now);
      success('ব্যাকআপ সফলভাবে ডাউনলোড হয়েছে ✅');
    } catch (e) {
      console.error('Export error:', e);
      error('ব্যাকআপ ডাউনলোড করতে সমস্যা হয়েছে ❌');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!window.confirm('এই ব্যাকআপ রিস্টোর করলে ডেটা যোগ হবে। নিশ্চিত?')) {
      e.target.value = '';
      return;
    }
    setImporting(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      if (!json.data) {
        error('ফাইল পড়তে সমস্যা হয়েছে ❌');
        setImporting(false);
        e.target.value = '';
        return;
      }
      for (const colName of COLLECTIONS) {
        if (json.data[colName] && Array.isArray(json.data[colName])) {
          for (const item of json.data[colName]) {
            const { id, ...rest } = item;
            await addDoc(collection(db, colName), { ...rest, restoredAt: serverTimestamp() });
          }
        }
      }
      if (json.data.settings) {
        await setDoc(doc(db, 'app', 'settings'), json.data.settings, { merge: true });
      }
      success('ব্যাকআপ সফলভাবে রিস্টোর হয়েছে ✅');
    } catch (err) {
      console.error('Import error:', err);
      error('ফাইল পড়তে সমস্যা হয়েছে ❌');
    }
    setImporting(false);
    e.target.value = '';
  };

  return (
    <div>
      <div className="hero-header">
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Settings</h1>
        <p style={{ opacity: 0.85, fontSize: 14 }}>Shop Configuration</p>
      </div>

      {/* Shop Profiles */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Shop Profiles</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage your shops</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditShop(null); setShowShopModal(true); }}>
            + New Shop
          </button>
        </div>
        {shops.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', padding: 24 }}>No shops yet. Create your first shop!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {shops.map(shop => (
              <div key={shop.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12,
                borderRadius: 10, border: shop.id === currentShopId ? '2px solid #6366f1' : '1px solid var(--border)',
                background: shop.id === currentShopId ? 'rgba(99,102,241,0.05)' : 'var(--card)',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)' }}>{shop.name}</span>
                    {shop.id === currentShopId && <span className="badge badge-info">Active</span>}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {shop.address || 'No address'} {shop.phone ? `| ${shop.phone}` : ''}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {shop.id !== currentShopId && (
                    <button onClick={() => switchShop(shop.id)} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Switch</button>
                  )}
                  <button onClick={() => { setEditShop(shop); setShowShopModal(true); }} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }}>Edit</button>
                  <button onClick={() => {
                    if (window.confirm(`"${shop.name}" delete?`)) deleteShop(shop.id);
                  }} className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, color: '#ef4444' }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shop Info */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>Invoice Info</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>This appears on invoices and PDFs</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Shop Name</label>
            <input className="input" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="e.g., Amar Dukan" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Shop Address</label>
            <input className="input" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="e.g., 123 Main Road, Dhaka" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Phone Number</label>
            <input className="input" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="e.g., 01XXXXXXXXX" />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
            {saving ? <span className="spinner" /> : 'Save'}
          </button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="card" style={{ padding: 24, marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>Backup & Restore</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Download or restore all your data
          {lastBackup && (
            <span style={{ display: 'block', marginTop: 4, fontWeight: 600, color: '#10b981' }}>
              Last backup: {new Date(lastBackup).toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          )}
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={handleExport} className="btn btn-success">Download Backup</button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="btn btn-primary">
            {importing ? <span className="spinner" /> : 'Restore Backup'}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Shop Modal */}
      {showShopModal && (
        <ShopModal
          shop={editShop}
          onClose={() => { setShowShopModal(false); setEditShop(null); }}
          onSave={() => { setShowShopModal(false); setEditShop(null); }}
        />
      )}
    </div>
  );
}
