/** Punto de entrada: monta los proveedores de tema e idioma, activa la protección anti-copia y dibuja <App />. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './utils/ThemeContext';
import { LanguageProvider } from './utils/LanguageContext';
import './index.css';
import { activarAntiCopia } from './utils/antiCopia';

activarAntiCopia();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
