import { db } from '../firebase';
import {
  collection, doc, setDoc, getDoc, addDoc, onSnapshot, deleteDoc,
  query, orderBy, serverTimestamp
} from 'firebase/firestore';

// Format currency as Tk. 1,000.00
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

// ─── SETTINGS ───
const SETTINGS_DOC = doc(db, 'app', 'settings');

export const getSettings = async () => {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    if (snap.exists()) return snap.data();
  } catch (e) { console.error('getSettings error:', e); }
  return { shopName: 'Amar Dukan', shopAddress: '', shopPhone: '', shopLogo: null, invoiceTitle: 'CASH MEMO' };
};

export const saveSettings = async (settings) => {
  try { await setDoc(SETTINGS_DOC, settings, { merge: true }); } catch (e) { console.error('saveSettings error:', e); }
};

// ─── INVOICES ───
export const subscribeInvoices = (callback) => {
  const q = query(collection(db, 'invoices'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log('Invoices updated:', data.length, 'documents');
    callback(data);
  }, (err) => { console.error('subscribeInvoices error:', err); callback([]); });
};

export const addInvoice = async (invoice) => {
  try {
    console.log('Adding invoice to Firestore:', invoice);
    const docRef = await addDoc(collection(db, 'invoices'), {
      ...invoice,
      createdAt: serverTimestamp()
    });
    console.log('Invoice saved with ID:', docRef.id);
    // Update counter
    const counterRef = doc(db, 'app', 'counter');
    const counterSnap = await getDoc(counterRef);
    const current = counterSnap.exists() ? counterSnap.data().value || 1000 : 1000;
    await setDoc(counterRef, { value: current + 1 }, { merge: true });
    return docRef.id;
  } catch (e) { console.error('addInvoice error:', e); return null; }
};

export const deleteInvoice = async (id) => {
  try { await deleteDoc(doc(db, 'invoices', id)); } catch (e) { console.error('deleteInvoice error:', e); }
};

export const getNextInvoiceNumber = async () => {
  try {
    const counterRef = doc(db, 'app', 'counter');
    const snap = await getDoc(counterRef);
    const current = snap.exists() ? snap.data().value || 1000 : 1000;
    return `INV-${current + 1}`;
  } catch (e) { return `INV-${Date.now()}`; }
};

// ─── EXPENSES ───
export const subscribeExpenses = (callback) => {
  const q = query(collection(db, 'expenses'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeExpenses error:', err); callback([]); });
};

export const addExpense = async (expense) => {
  try {
    const ref = doc(collection(db, 'expenses'));
    await setDoc(ref, { ...expense, id: ref.id, createdAt: serverTimestamp() });
  } catch (e) { console.error('addExpense error:', e); }
};

export const deleteExpense = async (id) => {
  try { await deleteDoc(doc(db, 'expenses', id)); } catch (e) { console.error('deleteExpense error:', e); }
};

// ─── PRODUCTS ───
export const subscribeProducts = (callback) => {
  const q = query(collection(db, 'products'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeProducts error:', err); callback([]); });
};

export const addProduct = async (product) => {
  try {
    const ref = doc(collection(db, 'products'));
    await setDoc(ref, { ...product, id: ref.id, createdAt: serverTimestamp() });
  } catch (e) { console.error('addProduct error:', e); }
};

export const deleteProduct = async (id) => {
  try { await deleteDoc(doc(db, 'products', id)); } catch (e) { console.error('deleteProduct error:', e); }
};

// ─── STOCK ENTRIES ───
export const subscribeStockEntries = (callback) => {
  const q = query(collection(db, 'stock_entries'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeStockEntries error:', err); callback([]); });
};

export const addStockEntry = async (entry) => {
  try {
    const ref = doc(collection(db, 'stock_entries'));
    await setDoc(ref, { ...entry, id: ref.id, createdAt: serverTimestamp() });
  } catch (e) { console.error('addStockEntry error:', e); }
};

export const deleteStockEntry = async (id) => {
  try { await deleteDoc(doc(db, 'stock_entries', id)); } catch (e) { console.error('deleteStockEntry error:', e); }
};

// ─── EVENTS ───
export const subscribeEvents = (callback) => {
  const q = query(collection(db, 'events'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeEvents error:', err); callback([]); });
};

export const saveEvent = async (event) => {
  try {
    if (event.id) {
      // Update existing event
      const ref = doc(db, 'events', event.id);
      await setDoc(ref, { ...event, createdAt: serverTimestamp() }, { merge: true });
      return event.id;
    } else {
      // Create new event
      const docRef = await addDoc(collection(db, 'events'), {
        ...event,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    }
  } catch (e) { console.error('saveEvent error:', e); return null; }
};

export const deleteEvent = async (id) => {
  try { await deleteDoc(doc(db, 'events', id)); } catch (e) { console.error('deleteEvent error:', e); }
};

// ─── CUSTOMERS ───
export const subscribeCustomers = (callback) => {
  const q = query(collection(db, 'customers'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeCustomers error:', err); callback([]); });
};

export const addCustomer = async (customer) => {
  try {
    const docRef = await addDoc(collection(db, 'customers'), {
      ...customer,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) { console.error('addCustomer error:', e); return null; }
};

export const updateCustomer = async (id, data) => {
  try {
    await setDoc(doc(db, 'customers', id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch (e) { console.error('updateCustomer error:', e); }
};

export const deleteCustomer = async (id) => {
  try { await deleteDoc(doc(db, 'customers', id)); } catch (e) { console.error('deleteCustomer error:', e); }
};

// ─── DUES ───
export const subscribeDues = (callback) => {
  const q = query(collection(db, 'dues'));
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(data);
  }, (err) => { console.error('subscribeDues error:', err); callback([]); });
};

export const addDue = async (due) => {
  try {
    const docRef = await addDoc(collection(db, 'dues'), {
      ...due,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (e) { console.error('addDue error:', e); return null; }
};

export const markDuePaid = async (id) => {
  try {
    await setDoc(doc(db, 'dues', id), { status: 'paid', paidAt: new Date().toISOString() }, { merge: true });
  } catch (e) { console.error('markDuePaid error:', e); }
};

export const deleteDue = async (id) => {
  try { await deleteDoc(doc(db, 'dues', id)); } catch (e) { console.error('deleteDue error:', e); }
};

// ─── BACKWARD COMPAT (legacy aliases) ───
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
