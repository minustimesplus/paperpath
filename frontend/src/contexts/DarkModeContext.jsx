import React, { createContext, useContext, useState, useEffect } from 'react';

const DarkModeContext = createContext();

export const useDarkMode = () => {
  return useContext(DarkModeContext);
};

export const DarkModeProvider = ({ children }) => {
  // Initialize dark mode from localStorage or system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first
    const savedMode = localStorage.getItem('darkMode');
    
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Update document classes when dark mode changes
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const value = {
    isDarkMode,
    toggleDarkMode
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};