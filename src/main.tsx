import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { applyTextScale } from './utils/textSize';
import App from './App.tsx';
import { ThemeProvider } from './utils/ThemeContext';
import { LanguageProvider } from './utils/LanguageContext';
import './index.css';
import { activarAntiCopia } from './utils/antiCopia';

activarAntiCopia();

applyTextScale();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);
