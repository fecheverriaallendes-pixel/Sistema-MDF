import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  Firestore
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const storage = getStorage(app);
