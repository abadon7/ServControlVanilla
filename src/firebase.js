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
  child,
  orderByChild,
  orderByValue,
  query
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

// ...existing code...
export function subscribeToPath(path, cb) {
  console.log("Subscribing to path:", path);
  const r = query(ref(db, path), orderByChild("date"));
  //console.log("Query created:", r);

  // Attach listener and build a keyed object for the listener callback.
  const unsub = onValue(r, (snapshot) => {
    const data = {};
    snapshot.forEach((child) => {
      data[child.key] = child.val();
    });
    console.log("Snapshot data (keyed):", JSON.stringify(data));
    //console.log("Sanpshot values", snapshot.val());
    cb(data, snapshot);
  }, (err) => {
    console.error("onValue error:", err);
    cb(null);
  });

  // Return the Firebase unsubscribe function so callers can call it.
  return unsub;
}

export async function getData(path) {
  console.log("Getting data from path:", path);
   const r = query(ref(db, path), orderByChild("date"));
  const snap = await get(r);
  return snap.exists() ? snap.val() : null;
}