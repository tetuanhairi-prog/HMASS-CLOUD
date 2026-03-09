
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Kod Service Worker dalam bentuk string untuk pendaftaran menggunakan teknik Blob.
 */
const swCode = `
const CACHE_NAME = 'hma-cloud-v3';
const ASSETS = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
`;

// Pendaftaran Service Worker PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      // Dapatkan path semasa secara selamat tanpa menggunakan constructor 'new URL' yang sensitif
      const path = window.location.pathname;
      const registrationScope = path.substring(0, path.lastIndexOf('/') + 1) || '/';

      // Cuba Teknik Blob: URL dicipta secara dinamik daripada string
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      
      navigator.serviceWorker.register(swUrl, { scope: registrationScope })
        .then(reg => {
          console.log('PWA: Service Worker (Blob) berjaya didaftarkan', reg);
        })
        .catch(err => {
          // Jika Blob gagal, cuba pendaftaran fail fizikal sw.js menggunakan path mutlak
          const physicalSwUrl = window.location.origin + registrationScope + 'sw.js';
          
          navigator.serviceWorker.register(physicalSwUrl, { scope: registrationScope })
            .then(reg => console.log('PWA: Service Worker (Physical) berjaya', reg))
            .catch(e => {
              if (e.message.includes('origin') || e.name === 'SecurityError') {
                console.warn('PWA: Pendaftaran Service Worker disekat oleh polisi origin persekitaran sandbox.');
              } else {
                console.error('PWA: Ralat pendaftaran:', e);
              }
            });
        });
    } catch (e) {
      console.error('PWA: Ralat permulaan pendaftaran:', e);
    }
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
