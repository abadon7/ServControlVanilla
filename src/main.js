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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(registration => {
      console.log('SW registered: ', registration);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('New worker installing...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available; please refresh.
            console.log('New update available');
            showNotification(
              'New version available',
              'info',
              {
                label: 'Reload',
                callback: () => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                }
              },
              0 // Persistent
            );
          }
        });
      });
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });

  // Reload when the new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      window.location.reload();
      refreshing = true;
    }
  });
}
