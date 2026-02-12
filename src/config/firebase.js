import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB278dfq5JrGOzp8-h4cby1PrKfJBifFwY",
  authDomain: "pencas-futsal.firebaseapp.com",
  projectId: "pencas-futsal",
  storageBucket: "pencas-futsal.firebasestorage.app",
  messagingSenderId: "701017979724",
  appId: "1:701017979724:web:592b9ad07d581c83edede9",
  databaseURL: "https://pencas-futsal-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);

// Debug: Verificar conexión
console.log('Firebase inicializado');
console.log('Database URL:', firebaseConfig.databaseURL);

export default app;
