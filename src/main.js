import './style.css';
import { auth, onAuthStateChanged } from './firebase.js';
import { mountLogin } from './pages/Login.js';
import { mountApp } from './pages/App.js';

// mount appropriate UI based on auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    mountApp('#app');
  } else {
    mountLogin('#app');
  }
});
