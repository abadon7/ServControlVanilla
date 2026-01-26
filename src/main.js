import './style.css';
import { auth, onAuthStateChanged } from './firebase.js';
import { mountLogin } from './pages/Login.js';
import { mountApp } from './pages/App.js';
import { showNotification } from './components/Notification.js';

// mount appropriate UI based on auth state
onAuthStateChanged(auth, (user) => {
  if (user) {
    mountApp('#app');
  } else {
    mountLogin('#app');
  }
});

import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    showNotification(
      'New version available',
      'info',
      {
        label: 'Reload',
        callback: () => {
          updateSW(true);
        }
      },
      0 // Persistent
    );
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  },
});
