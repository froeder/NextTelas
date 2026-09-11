import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper para ler variáveis de ambiente do Vite (import.meta.env) ou Node/Expo (process.env)
const getEnv = (key) => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

/**
 * CONFIGURAÇÃO DO FIREBASE (Vite Web + Firebase Hosting)
 * 
 * Substitua os valores abaixo pelas credenciais do seu projeto Firebase Console:
 * https://console.firebase.google.com/
 * 
 * Ou defina-as em um arquivo .env com o prefixo VITE_ ou EXPO_PUBLIC_:
 * VITE_FIREBASE_API_KEY=sua_api_key
 * VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
 * VITE_FIREBASE_PROJECT_ID=seu_project_id
 * VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
 * VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
 * VITE_FIREBASE_APP_ID=seu_app_id
 */
const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY') || getEnv('EXPO_PUBLIC_FIREBASE_API_KEY') || "AIzaSyD_INSIRA_SUA_API_KEY_AQUI",
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || getEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN') || "nexttelas-filmes.firebaseapp.com",
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || getEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID') || "nexttelas-filmes",
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || getEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET') || "nexttelas-filmes.appspot.com",
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || getEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID') || "123456789012",
  appId: getEnv('VITE_FIREBASE_APP_ID') || getEnv('EXPO_PUBLIC_FIREBASE_APP_ID') || "1:123456789012:web:abcdef123456",
};

// Verifica se as chaves ainda são as de demonstração
export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("INSIRA_SUA_API_KEY")
  );
};

// Inicialização segura da aplicação Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth padrão web com persistência automática em localStorage/IndexedDB
const auth = getAuth(app);

// Inicializa Firestore Database
const db = getFirestore(app);

export { app, auth, db };
