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

  // Sync theme-color meta tag in document head for browser status bars
  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'sun' ? '#FAF8F5' : '#141414');
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
