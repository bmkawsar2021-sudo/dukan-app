import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, addDoc, deleteDoc, onSnapshot, serverTimestamp, query, where } from 'firebase/firestore';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

const ShopContext = createContext();

export function useShop() {
  return useContext(ShopContext);
}

export function ShopProvider({ children }) {
  const { currentUser } = useAuth();
  const { success, error } = useToast();
  const [shops, setShops] = useState([]);
  const [currentShopId, setCurrentShopId] = useState('');
  const [loading, setLoading] = useState(false);

  const uid = currentUser?.uid || null;

  // Initialize selected shop from localStorage (per-uid namespace).
  useEffect(() => {
    if (!uid) {
      setCurrentShopId('');
      return;
    }
    const stored = localStorage.getItem(`currentShopId:${uid}`);
    setCurrentShopId(stored || '');
  }, [uid]);

  // Subscribe to this user's shops.
  useEffect(() => {
    let unsub = () => {};
    setShops([]);
    if (!uid) {
      setLoading(false);
      return;
    }

    // Safety timeout: don't keep showing a spinner if Firestore is slow / blocked.
    const timeout = setTimeout(() => setLoading(false), 2000);

    try {
      const q = query(collection(db, 'shops'), where('ownerUid', '==', uid));
      unsub = onSnapshot(q, (snap) => {
        clearTimeout(timeout);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setShops(data);
        setLoading(false);

        // If we have no current shop, auto-select the first one (or a remembered one).
        if (!currentShopId && data.length > 0) {
          const remembered = data.find(s => s.id === localStorage.getItem(`currentShopId:${uid}`));
          const pick = remembered || data[0];
          setCurrentShopId(pick.id);
          localStorage.setItem(`currentShopId:${uid}`, pick.id);
        }
      }, (err) => {
        clearTimeout(timeout);
        console.error('subscribeShops error:', err);
        setLoading(false);
      });
    } catch (err) {
      clearTimeout(timeout);
      console.error('onSnapshot init error:', err);
      setLoading(false);
    }

    return () => {
      clearTimeout(timeout);
      unsub();
    };
  }, [uid]); // eslint-disable-line

  const currentShop = shops.find(s => s.id === currentShopId) || shops[0] || null;

  const switchShop = useCallback((id) => {
    setCurrentShopId(id);
    if (uid) localStorage.setItem(`currentShopId:${uid}`, id);
  }, [uid]);

  const addShop = useCallback(async (shopData) => {
    if (!uid) {
      error('You must be signed in to add a shop');
      return null;
    }
    try {
      const ref = await addDoc(collection(db, 'shops'), {
        ...shopData,
        ownerUid: uid,
        createdAt: serverTimestamp()
      });
      success('শপ তৈরি হয়েছে ✅');
      return ref.id;
    } catch (e) {
      console.error('addShop error:', e);
      error('শপ তৈরি করতে সমস্যা হয়েছে ❌');
      return null;
    }
  }, [uid, success, error]);

  const updateShop = useCallback(async (id, data) => {
    if (!uid) return;
    try {
      await setDoc(doc(db, 'shops', id), { ...data, ownerUid: uid, updatedAt: serverTimestamp() }, { merge: true });
      success('শপ আপডেট হয়েছে ✅');
    } catch (e) {
      console.error('updateShop error:', e);
      error('আপডেট করতে সমস্যা হয়েছে ❌');
    }
  }, [uid, success, error]);

  const deleteShop = useCallback(async (id) => {
    if (!uid) return;
    try {
      await deleteDoc(doc(db, 'shops', id));
      if (id === currentShopId) {
        const remaining = shops.filter(s => s.id !== id);
        if (remaining.length > 0) {
          setCurrentShopId(remaining[0].id);
          localStorage.setItem(`currentShopId:${uid}`, remaining[0].id);
        } else {
          setCurrentShopId('');
          localStorage.removeItem(`currentShopId:${uid}`);
        }
      }
      success('শপ মুছে ফেলা হয়েছে ✅');
    } catch (e) {
      console.error('deleteShop error:', e);
      error('মুছে ফেলতে সমস্যা হয়েছে ❌');
    }
  }, [uid, currentShopId, shops, success, error]);

  const value = {
    shops,
    currentShop,
    currentShopId,
    switchShop,
    addShop,
    updateShop,
    deleteShop,
    loading,
    showWelcome: !!uid && !loading && shops.length === 0,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}
