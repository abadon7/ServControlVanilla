import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

// Realtime Database imports
import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  onValue,
  get,
  child
} from "firebase/database";

// Replace these with your Firebase project's config
const firebaseConfig = {
  apiKey: "AIzaSyAwY0QM8UO9QsYhBKQc9IAeLE7iu4KBKqQ",
  authDomain: "stlist-4402f.firebaseapp.com",
  databaseURL: "https://stlist-4402f.firebaseio.com",
  projectId: "stlist-4402f",
  storageBucket: "stlist-4402f.appspot.com",
  messagingSenderId: "955361731943",
  appId: "1:955361731943:web:c677216bc1e4bc5c767bc2"
};

const app = initializeApp(firebaseConfig);

// Auth setup
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function signOutUser() {
  return signOut(auth);
}

export { auth, onAuthStateChanged };

// Realtime Database setup
const db = getDatabase(app);

/**
 * Helpers for Realtime Database
 */
export function dbRef(path) {
  return ref(db, path);
}

export function writeData(path, value) {
  return set(ref(db, path), value);
}

export function pushData(path, value) {
  return push(ref(db, path), value);
}

export function updateData(path, value) {
  return update(ref(db, path), value);
}

export function removeData(path) {
  return remove(ref(db, path));
}

export function subscribeToPath(path, cb) {
  const r = ref(db, path);
  const unsub = onValue(r, (snapshot) => {
    cb(snapshot.val(), snapshot);
  });
  return () => unsub(); // returns unsubscribe (Firebase onValue returns a function when used this way)
}

export async function getData(path) {
  const r = ref(db, path);
  const snap = await get(r);
  return snap.exists() ? snap.val() : null;
}