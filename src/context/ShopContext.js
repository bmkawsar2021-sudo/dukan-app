import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, addDoc, deleteDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useToast } from './ToastContext';

const ShopContext = createContext();

export function useShop() {
  return useContext(ShopContext);
}

export function ShopProvider({ children }) {
  const { success, error } = useToast();
  const [shops, setShops] = useState([]);
  const [currentShopId, setCurrentShopId] = useState(localStorage.getItem('currentShopId') || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let unsub = () => {};

    // Safety timeout: if Firestore doesn't respond in 2s, continue anyway
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    try {
      unsub = onSnapshot(collection(db, 'shops'), (snap) => {
        clearTimeout(timeout);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setShops(data);
        setLoading(false);

        // If no current shop selected, pick first one
        if (!currentShopId && data.length > 0) {
          setCurrentShopId(data[0].id);
          localStorage.setItem('currentShopId', data[0].id);
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
  }, []); // eslint-disable-line

  const currentShop = shops.find(s => s.id === currentShopId) || shops[0] || null;

  const switchShop = useCallback((id) => {
    setCurrentShopId(id);
    localStorage.setItem('currentShopId', id);
  }, []);

  const addShop = useCallback(async (shopData) => {
    try {
      const ref = await addDoc(collection(db, 'shops'), {
        ...shopData,
        createdAt: serverTimestamp()
      });
      success('শপ তৈরি হয়েছে ✅');
      return ref.id;
    } catch (e) {
      console.error('addShop error:', e);
      error('শপ তৈরি করতে সমস্যা হয়েছে ❌');
      return null;
    }
  }, [success, error]);

  const updateShop = useCallback(async (id, data) => {
    try {
      await setDoc(doc(db, 'shops', id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
      success('শপ আপডেট হয়েছে ✅');
    } catch (e) {
      console.error('updateShop error:', e);
      error('আপডেট করতে সমস্যা হয়েছে ❌');
    }
  }, [success, error]);

  const deleteShop = useCallback(async (id) => {
    try {
      await deleteDoc(doc(db, 'shops', id));
      // If deleted shop was current, switch to first remaining
      if (id === currentShopId) {
        const remaining = shops.filter(s => s.id !== id);
        if (remaining.length > 0) {
          setCurrentShopId(remaining[0].id);
          localStorage.setItem('currentShopId', remaining[0].id);
        } else {
          setCurrentShopId('');
          localStorage.removeItem('currentShopId');
        }
      }
      success('শপ মুছে ফেলা হয়েছে ✅');
    } catch (e) {
      console.error('deleteShop error:', e);
      error('মুছে ফেলতে সমস্যা হয়েছে ❌');
    }
  }, [currentShopId, shops, success, error]);

  const value = {
    shops,
    currentShop,
    currentShopId,
    switchShop,
    addShop,
    updateShop,
    deleteShop,
    loading,
    showWelcome: !loading && shops.length === 0,
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
}
