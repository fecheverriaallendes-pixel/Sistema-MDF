import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

// Limpiar claves antiguas/pesadas de localStorage que pueden saturar la cuota de 5MB del navegador
if (typeof window !== 'undefined' && window.localStorage) {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (
        key.startsWith('firestore_') ||
        key === 'mdf_sales' ||
        key === 'mdf_stock' ||
        key === 'mdf_stock_history' ||
        key === 'mdf_label_prints' ||
        key === 'mdf_deleted_sales' ||
        key === 'mdf_salary_deductions'
      ) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => {
      try {
        window.localStorage.removeItem(k);
      } catch {}
    });
  } catch {}
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
