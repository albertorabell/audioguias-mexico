import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppTheme = 'museum' | 'sun';

interface ThemeContextValue {
  theme: AppTheme;
  isSunMode: boolean;
  toggleTheme: () => void;
  setTheme: (t: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem('audioguias_theme');
      if (saved === 'sun' || saved === 'museum') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'museum';
  });

  const setTheme = (t: AppTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem('audioguias_theme', t);
    } catch {
      // ignore
    }
  };

  const toggleTheme = () => {
    const nextTheme: AppTheme = theme === 'museum' ? 'sun' : 'museum';
    setTheme(nextTheme);
  };

  // Sync class on root element and theme-color meta tag
  useEffect(() => {
    const isDark = theme === 'museum';
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('sun');
        root.setAttribute('data-theme', 'museum');
      } else {
        root.classList.remove('dark');
        root.classList.add('sun');
        root.setAttribute('data-theme', 'sun');
      }

      const metaThemeColor = document.querySelector("meta[name='theme-color']");
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#0B0B0E' : '#FAF8F5');
      }
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isSunMode: theme === 'sun',
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
};

export default ThemeContext;
