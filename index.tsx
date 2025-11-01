import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register service worker in production
// FIX: The triple-slash directive for Vite was causing a "Cannot find type definition file" error.
// Using a type assertion on `import.meta` is a pragmatic workaround to access Vite's environment
// variables when project-level type declarations are misconfigured or missing.
if ((import.meta as any).env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }).catch(registrationError => {
      console.log('ServiceWorker registration failed: ', registrationError);
    });
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