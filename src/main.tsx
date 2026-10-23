import React from 'react';
import { createRoot } from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { App } from './App';
import { AuthProvider } from './lib/auth';
import { CACHE_MAX_AGE, persister, queryClient } from './lib/query';
import { ErrorBoundary } from './ui/ErrorBoundary';
import './styles.css';

// Pase lo que pase al arrancar, la app siempre dibuja algo.
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: CACHE_MAX_AGE }}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PersistQueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
