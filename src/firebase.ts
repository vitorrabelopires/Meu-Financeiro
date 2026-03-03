import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup as firebaseSignInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged, 
  signInWithEmailAndPassword as firebaseSignInWithEmailAndPassword, 
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate config before initialization
const missingKeys = Object.entries(firebaseConfig)
  .filter(([key, value]) => !value && key !== 'measurementId')
  .map(([key]) => `VITE_FIREBASE_${key.replace(/[A-Z]/g, letter => `_${letter}`).toUpperCase()}`);

if (missingKeys.length > 0) {
  console.warn(`Configuração do Firebase incompleta. Faltam as seguintes variáveis: ${missingKeys.join(', ')}. Configure-as no painel de Secrets.`);
}

let app;
let auth: any;
let googleProvider: any;

const onAuthStateChanged = (authObj: any, callback: any) => {
  if (authObj?.isMock) {
    callback(null);
    return () => {};
  }
  return firebaseOnAuthStateChanged(authObj, callback);
};

const signOut = (authObj: any) => {
  if (authObj?.isMock) return Promise.resolve();
  return firebaseSignOut(authObj);
};

const signInWithPopup = (authObj: any, provider: any) => {
  if (authObj?.isMock) return Promise.reject(new Error("Firebase não configurado"));
  return firebaseSignInWithPopup(authObj, provider);
};

const signInWithEmailAndPassword = (authObj: any, email: any, pass: any) => {
  if (authObj?.isMock) return Promise.reject(new Error("Firebase não configurado"));
  return firebaseSignInWithEmailAndPassword(authObj, email, pass);
};

const createUserWithEmailAndPassword = (authObj: any, email: any, pass: any) => {
  if (authObj?.isMock) return Promise.reject(new Error("Firebase não configurado"));
  return firebaseCreateUserWithEmailAndPassword(authObj, email, pass);
};

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
} catch (e) {
  console.error("Erro ao inicializar Firebase:", e);
  auth = { isMock: true };
  googleProvider = {};
}

export { 
  auth,
  googleProvider,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider
};
