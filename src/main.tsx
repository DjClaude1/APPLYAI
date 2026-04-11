import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for fetch failures (common with Supabase config issues)
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message === 'Failed to fetch') {
    console.error('Supabase connection failed. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets menu.');
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
