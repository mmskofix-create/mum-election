import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {
  getFirestore,
  serverTimestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  writeBatch,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export const firebaseConfig = {
  apiKey: 'AIzaSyBX4yg4feUeDM-5519AF45qc2vg5phRtZ8',
  authDomain: 'election-madrsa.firebaseapp.com',
  projectId: 'election-madrsa',
  storageBucket: 'election-madrsa.firebasestorage.app',
  messagingSenderId: '764714650183',
  appId: '1:764714650183:web:105111b3fff92d3f933f62',
  measurementId: 'G-FC5894S63V',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export {
  serverTimestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  runTransaction,
  writeBatch,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
};
