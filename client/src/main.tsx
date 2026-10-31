// src/main.tsx
import React from 'react@18.2.0';
import ReactDOM from 'react-dom/client@18.2.0';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
