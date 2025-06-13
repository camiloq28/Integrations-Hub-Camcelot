
import { useState, useEffect } from 'react';
import { loadAndApplyTheme, getDefaultTheme } from './themeUtils';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(getDefaultTheme());

  useEffect(() => {
    // Load initial theme
    const savedTheme = loadAndApplyTheme();
    if (savedTheme) {
      setCurrentTheme(savedTheme);
    }

    // Listen for theme changes
    const handleThemeChange = (event) => {
      if (event.detail && event.detail.themeColors) {
        setCurrentTheme(event.detail.themeColors);
      }
    };

    window.addEventListener('themeChanged', handleThemeChange);

    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return currentTheme;
};
