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
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

let app;
let auth: any;
let db: any;
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
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  googleProvider = new GoogleAuthProvider();

  // Test the connection as instructed by the skill
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  };
  testConnection();
} catch (e) {
  console.error("Erro ao inicializar Firebase:", e);
  auth = { isMock: true };
  db = { isMock: true };
  googleProvider = {};
}

export { 
  auth,
  db,
  googleProvider,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider
};
