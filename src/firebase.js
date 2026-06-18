import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDKREdz2Dm5-w-YlPJuaiIIAFr0pqE4lX8",
  authDomain: "dukan-app-3acdd.firebaseapp.com",
  projectId: "dukan-app-3acdd",
  storageBucket: "dukan-app-3acdd.firebasestorage.app",
  messagingSenderId: "139239500275",
  appId: "1:139239500275:web:a423b5c470dbd0fcff4a86"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Firestore offline persistence — caches data for offline reads.
try {
  import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(db).catch((err) => {
      console.warn('Firestore persistence unavailable:', err.code);
    });
  });
} catch (e) {
  console.warn('Firebase init warning:', e);
}
