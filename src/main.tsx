import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SimulatorProvider } from './context/SimulatorContext';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SimulatorProvider>
      <App />
    </SimulatorProvider>
  </StrictMode>,
);
