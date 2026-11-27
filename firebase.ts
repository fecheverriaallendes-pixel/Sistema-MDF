import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let dbInstance: Firestore;
if (typeof window !== 'undefined') {
  try {
    dbInstance = initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch (err) {
    console.warn('No se pudo activar caché local persistente de Firestore, usando modo estándar:', err);
    dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
} else {
  dbInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const storage = getStorage(app);
