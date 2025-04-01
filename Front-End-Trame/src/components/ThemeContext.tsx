// ThemeContext.tsx
import React, { createContext, useState, ReactNode, useEffect } from 'react';

interface ThemeContextProps {
  theme: string;
  setTheme: (theme: string) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: '',
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize theme from localStorage if available
  const [theme, setThemeState] = useState<string>(() => {
    const storedTheme = localStorage.getItem('theme') || '';
    console.log("Initialized theme:", storedTheme);
    return localStorage.getItem('theme') || 'noel';
  });

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Optional: keep localStorage in sync if theme state changes outside of setTheme
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
