import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const getEnv = (key) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

/**
 * CONFIGURAÇÃO DO FIREBASE (Expo Mobile + AsyncStorage)
 */
const firebaseConfig = {
  apiKey: getEnv('EXPO_PUBLIC_FIREBASE_API_KEY') || getEnv('VITE_FIREBASE_API_KEY') || "AIzaSyBeelBeczrkFkMVamOxqFr8LSqzCWjEm7A",
  authDomain: getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') || getEnv('VITE_FIREBASE_AUTH_DOMAIN') || "nexttelas.firebaseapp.com",
  projectId: getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID') || getEnv('VITE_FIREBASE_PROJECT_ID') || "nexttelas",
  storageBucket: getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') || getEnv('VITE_FIREBASE_STORAGE_BUCKET') || "nexttelas.firebasestorage.app",
  messagingSenderId: getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || "1:913654975072:web:25998e16c4aee81a929105",
  appId: getEnv('EXPO_PUBLIC_FIREBASE_APP_ID') || getEnv('VITE_FIREBASE_APP_ID') || "G-88VX46MK9K",
};

export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("INSIRA_SUA_API_KEY")
  );
};

// Inicialização segura da aplicação Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configura Auth com persistência nativa AsyncStorage no Mobile ou padrão no Web
let auth;
if (Platform.OS === 'web') {
  auth = getAuth(app);
} else {
  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (_) {
    auth = getAuth(app);
  }
}

// Inicializa Firestore Database
const db = getFirestore(app);

export { app, auth, db };
