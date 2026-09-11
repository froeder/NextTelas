import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * CONFIGURAÇÃO DO FIREBASE
 * 
 * Substitua os valores abaixo pelas credenciais do seu projeto Firebase Console:
 * https://console.firebase.google.com/
 * 
 * Ou defina-as em um arquivo .env na raiz do projeto com o prefixo EXPO_PUBLIC_:
 * EXPO_PUBLIC_FIREBASE_API_KEY=sua_api_key
 * EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
 * EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_project_id
 * EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
 * EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
 * EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyD_INSIRA_SUA_API_KEY_AQUI",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "nexttelas-filmes.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "nexttelas-filmes",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "nexttelas-filmes.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:abcdef123456",
};

// Verifica se as chaves ainda são as de demonstração
export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("INSIRA_SUA_API_KEY")
  );
};

// Inicialização segura com suporte a Hot-Reload do Expo
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configura Auth com persistência via AsyncStorage para manter o usuário logado
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Caso o auth já tenha sido inicializado (em ciclos de Fast Refresh)
  auth = getAuth(app);
}

// Inicializa Firestore Database
const db = getFirestore(app);

export { app, auth, db };
