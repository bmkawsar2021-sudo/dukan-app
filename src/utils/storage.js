import { db } from '../firebase';
import {
  collection, doc, setDoc, getDoc, addDoc, onSnapshot, deleteDoc,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';

// ─── Helpers ───
export const formatCurrency = (amount) => {
  return 'Tk. ' + Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-BD', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const getToday = () => {
  return new Date().toISOString().split('T')[0];
};

// Per-user settings path
const settingsDoc = (uid) => doc(db, 'users', uid, 'app', 'settings');
// Per-user invoice counter path
const counterDoc = (uid) => doc(db, 'users', uid, 'app', 'counter');

// ─── SETTINGS ───
export const getSettings = async (uid) => {
  if (!uid) return { shopName: 'Amar Dukan', shopAddress: '', shopPhone: '', shopLogo: null, invoiceTitle: 'CASH MEMO' };
  try {
    const snap = await getDoc(settingsDoc(uid));
    if (snap.exists()) return snap.data();
  } catch (e) { console.error('getSettings error:', e); }
  return { shopName: 'Amar Dukan', shopAddress: '', shopPhone: '', shopLogo: null, invoiceTitle: 'CASH MEMO' };
};

export const saveSettings = async (uid, settings) => {
  if (!uid) return;
  try { await setDoc(settingsDoc(uid), settings, { merge: true }); }
  catch (e) { console.error('saveSettings error:', e); }
};

// ─── INVOICES ───
export const subscribeInvoices = (uid, callback) => {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'invoices'), where('ownerUid', '==', uid));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeInvoices error:', err); callback([]); });
};

export const addInvoice = async (uid, invoice) => {
  if (!uid) return null;
  try {
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...invoice,
      ownerUid: uid,
      createdAt: serverTimestamp()
    });
    // Bump the per-user counter
    const cref = counterDoc(uid);
    const csnap = await getDoc(cref);
    const current = csnap.exists() ? csnap.data().value || 1000 : 1000;
    await setDoc(cref, { value: current + 1 }, { merge: true });
    return docRef.id;
  } catch (e) { console.error('addInvoice error:', e); return null; }
};

export const deleteInvoice = async (uid, id) => {
  if (!uid || !id) return;
  try { await deleteDoc(doc(db, 'invoices', id)); }
  catch (e) { console.error('deleteInvoice error:', e); }
};

export const getNextInvoiceNumber = async (uid) => {
  if (!uid) return `INV-${Date.now()}`;
  try {
    const cref = counterDoc(uid);
    const snap = await getDoc(cref);
    const current = snap.exists() ? snap.data().value || 1000 : 1000;
    return `INV-${current + 1}`;
  } catch (e) { return `INV-${Date.now()}`; }
};

// ─── EXPENSES ───
export const subscribeExpenses = (uid, callback) => {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'expenses'), where('ownerUid', '==', uid));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeExpenses error:', err); callback([]); });
};

export const addExpense = async (uid, expense) => {
  if (!uid) return;
  try {
    const ref = doc(collection(db, 'expenses'));
    await setDoc(ref, { ...expense, ownerUid: uid, id: ref.id, createdAt: serverTimestamp() });
  } catch (e) { console.error('addExpense error:', e); }
};

export const deleteExpense = async (uid, id) => {
  if (!uid || !id) return;
  try { await deleteDoc(doc(db, 'expenses', id)); }
  catch (e) { console.error('deleteExpense error:', e); }
};

// ─── PRODUCTS ───
export const subscribeProducts = (uid, callback) => {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'products'), where('ownerUid', '==', uid));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeProducts error:', err); callback([]); });
};

export const addProduct = async (uid, product) => {
  if (!uid) return;
  try {
    const ref = doc(collection(db, 'products'));
    await setDoc(ref, { ...product, ownerUid: uid, id: ref.id, createdAt: serverTimestamp() });
  } catch (e) { console.error('addProduct error:', e); }
};

export const deleteProduct = async (uid, id) => {
  if (!uid || !id) return;
  try { await deleteDoc(doc(db, 'products', id)); }
  catch (e) { console.error('deleteProduct error:', e); }
};

// ─── STOCK ENTRIES ───
export const subscribeStockEntries = (uid, callback) => {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'stock_entries'), where('ownerUid', '==', uid));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeStockEntries error:', err); callback([]); });
};

export const addStockEntry = async (uid, entry) => {
  if (!uid) return;
  try {
    const ref = doc(collection(db, 'stock_entries'));
    await setDoc(ref, { ...entry, ownerUid: uid, id: ref.id, createdAt: serverTimestamp() });
  } catch (e) { console.error('addStockEntry error:', e); }
};

export const deleteStockEntry = async (uid, id) => {
  if (!uid || !id) return;
  try { await deleteDoc(doc(db, 'stock_entries', id)); }
  catch (e) { console.error('deleteStockEntry error:', e); }
};

// ─── EVENTS ───
export const subscribeEvents = (uid, callback) => {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'events'), where('ownerUid', '==', uid));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeEvents error:', err); callback([]); });
};

export const saveEvent = async (uid, event) => {
  if (!uid) return null;
  try {
    if (event.id) {
      const ref = doc(db, 'events', event.id);
      await setDoc(ref, { ...event, ownerUid: uid, createdAt: serverTimestamp() }, { merge: true });
      return event.id;
    } else {
      const docRef = await addDoc(collection(db, 'events'), {
        ...event,
        ownerUid: uid,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    }
  } catch (e) { console.error('saveEvent error:', e); return null; }
};

export const deleteEvent = async (uid, id) => {
  if (!uid || !id) return;
  try { await deleteDoc(doc(db, 'events', id)); }
  catch (e) { console.error('deleteEvent error:', e); }
};

// ─── CUSTOMERS ───
export const subscribeCustomers = (uid, callback) => {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'customers'), where('ownerUid', '==', uid));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeCustomers error:', err); callback([]); });
};

export const addCustomer = async (uid, customer) => {
  if (!uid) return null;
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customer,
      ownerUid: uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) { console.error('addCustomer error:', e); return null; }
};

export const updateCustomer = async (uid, id, data) => {
  if (!uid || !id) return;
  try {
    await setDoc(doc(db, 'customers', id), { ...data, ownerUid: uid, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { console.error('updateCustomer error:', e); }
};

export const deleteCustomer = async (uid, id) => {
  if (!uid || !id) return;
  try { await deleteDoc(doc(db, 'customers', id)); }
  catch (e) { console.error('deleteCustomer error:', e); }
};

// ─── DUES ───
export const subscribeDues = (uid, callback) => {
  if (!uid) { callback([]); return () => {}; }
  const q = query(collection(db, 'dues'), where('ownerUid', '==', uid));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeDues error:', err); callback([]); });
};

export const addDue = async (uid, due) => {
  if (!uid) return null;
  try {
    const docRef = await addDoc(collection(db, 'dues'), {
      ...due,
      ownerUid: uid,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) { console.error('addDue error:', e); return null; }
};

export const markDuePaid = async (uid, id) => {
  if (!uid || !id) return;
  try {
    await setDoc(doc(db, 'dues', id), { status: 'paid', paidAt: new Date().toISOString() }, { merge: true });
  } catch (e) { console.error('markDuePaid error:', e); }
};

export const deleteDue = async (uid, id) => {
  if (!uid || !id) return;
  try { await deleteDoc(doc(db, 'dues', id)); }
  catch (e) { console.error('deleteDue error:', e); }
};

// ─── Migration helper: claim legacy data for a new user ───
//
// For each data collection, finds docs that have no `ownerUid` field and
// writes `ownerUid = uid` on them in batches of up to 500 (Firestore limit).
// Returns the total number of documents claimed.
//
export const claimLegacyData = async (uid) => {
  if (!uid) return 0;
  const collections = ['invoices', 'expenses', 'products', 'stock_entries', 'events', 'customers', 'dues', 'shops'];
  const { writeBatch, getDocs, setDoc } = await import('firebase/firestore');
  let total = 0;
  for (const colName of collections) {
    const snap = await getDocs(query(collection(db, colName), where('ownerUid', '==', null)));
    if (snap.empty) continue;
    let batch = writeBatch(db);
    let opsInBatch = 0;
    for (const d of snap.docs) {
      batch.update(d.ref, { ownerUid: uid });
      opsInBatch++;
      total++;
      if (opsInBatch === 500) {
        await batch.commit();
        batch = writeBatch(db);
        opsInBatch = 0;
      }
    }
    if (opsInBatch > 0) await batch.commit();
  }
  // Record the claim so we never ask again.
  await setDoc(doc(db, 'app', 'meta'), { firstUserClaimed: true, firstUserClaimedBy: uid, firstUserClaimedAt: serverTimestamp() }, { merge: true });
  return total;
};

// ─── Meta: has anyone claimed legacy data yet? ───
export const hasLegacyDataBeenClaimed = async () => {
  try {
    const snap = await getDoc(doc(db, 'app', 'meta'));
    if (!snap.exists()) return false;
    return !!snap.data().firstUserClaimed;
  } catch (e) {
    console.error('hasLegacyDataBeenClaimed error:', e);
    return true; // fail safe — don't bug the user if we can't read the flag
  }
};

// ─── Detect whether there is un-owned legacy data (for the claim prompt) ───
export const hasUnownedData = async () => {
  const collections = ['invoices', 'expenses', 'products', 'stock_entries', 'events', 'customers', 'dues', 'shops'];
  for (const colName of collections) {
    try {
      const snap = await getDocs(query(collection(db, colName), where('ownerUid', '==', null)));
      if (!snap.empty) return true;
    } catch (e) {
      // If the query is rejected (e.g. index missing), assume there is data worth claiming.
      return true;
    }
  }
  return false;
};

// ─── BACKWARD COMPAT (legacy aliases — no-op stubs) ───
export const getInvoices = () => [];
export const saveInvoices = () => {};
export const getExpenses = () => [];
export const saveExpenses = () => {};
export const getProducts = () => [];
export const saveProducts = () => {};
export const getStockEntries = () => [];
export const saveStockEntries = () => {};
export const getEvents = () => [];
export const saveEvents = () => {};
