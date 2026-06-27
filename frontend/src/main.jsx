// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { SWRConfig } from 'swr';
import App from './App';
import AppAuthProvider from '@/providers/AppAuthProvider';
import { swrConfig } from '@/lib/swr/config';
import '@/styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <SWRConfig value={swrConfig}>
      <AppAuthProvider>
        <App />
      </AppAuthProvider>
    </SWRConfig>
  </React.StrictMode>
);
