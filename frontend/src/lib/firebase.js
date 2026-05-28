import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, browserLocalPersistence, setPersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCxxCWrDj1FlDDUfvxAMWGD6PM3YQ-aNmE",
  authDomain: "swapwear-41b7f.firebaseapp.com",
  projectId: "swapwear-41b7f",
  storageBucket: "swapwear-41b7f.firebasestorage.app",
  messagingSenderId: "240864757785",
  appId: "1:240864757785:web:6858a92237daeb55ae0288"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence);
