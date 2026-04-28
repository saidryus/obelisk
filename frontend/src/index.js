import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#161b22',
          color: '#e6edf3',
          border: '1px solid #21262d',
          borderRadius: '8px',
          fontSize: '0.825rem',
          padding: '0.6rem 0.9rem',
        },
        success: { iconTheme: { primary: '#3fb950', secondary: '#161b22' } },
        error:   { iconTheme: { primary: '#f85149', secondary: '#161b22' } },
      }}
    />
  </React.StrictMode>
);
