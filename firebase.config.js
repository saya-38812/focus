// firebase.config.js - 完全修正版
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyChIJFVwFAiFn8mKFgStOtT7Dl78nbkuPc",
  authDomain: "focus-app1.firebaseapp.com",
  projectId: "focus-app1",
  storageBucket: "focus-app1.firebasestorage.app",
  messagingSenderId: "310271165623",
  appId: "1:310271165623:web:79bf5b6d97798164fff932",
  measurementId: "G-KDBP7B2M74"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firestoreインスタンス
export const db = getFirestore(app);

console.log('✅ Firebase初期化完了');
