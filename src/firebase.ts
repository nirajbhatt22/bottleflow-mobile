import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Auth, Persistence } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { getAuth, initializeAuth } = FirebaseAuth;
const getReactNativePersistence = (
  FirebaseAuth as typeof FirebaseAuth & {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  }
).getReactNativePersistence;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const missingFirebaseConfig = Object.entries(firebaseConfig)
  .filter(([, value]) => !value?.trim() || value.startsWith('replace-me'))
  .map(([key]) => key);
export const configured = missingFirebaseConfig.length === 0;
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
if (configured) {
  firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  try {
    firebaseAuth = initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch (error) {
    const code = (error as {code?: string})?.code;
    if (code !== 'auth/already-initialized') throw error;
    firebaseAuth = getAuth(firebaseApp);
  }
  firebaseDb = getFirestore(firebaseApp);
}
export const auth = firebaseAuth;
export const db = firebaseDb;
