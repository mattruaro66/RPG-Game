import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './data/campaign';
import './styles/global.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
