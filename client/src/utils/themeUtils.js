
// Theme utility functions
export const loadAndApplyTheme = () => {
  try {
    const savedTheme = localStorage.getItem('customTheme');
    if (savedTheme) {
      const themeColors = JSON.parse(savedTheme);
      applyThemeToDOM(themeColors);
      console.log('✅ Custom theme loaded and applied');
      return themeColors;
    } else {
      // Apply default theme silently
      const defaultTheme = getDefaultTheme();
      applyThemeToDOM(defaultTheme);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to load saved theme:', error);
    // Fallback to default theme
    const defaultTheme = getDefaultTheme();
    applyThemeToDOM(defaultTheme);
    return null;
  }
};

export const applyThemeToDOM = (themeColors) => {
  const root = document.documentElement;
  Object.entries(themeColors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
};

export const saveAndApplyTheme = (themeColors) => {
  try {
    applyThemeToDOM(themeColors);
    localStorage.setItem('customTheme', JSON.stringify(themeColors));
    console.log('✅ Custom theme saved and applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to save theme:', error);
    return false;
  }
};

export const getDefaultTheme = () => ({
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  light: '#f8f9fa',
  dark: '#343a40',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#212529',
  textSecondary: '#6c757d',
  border: '#dee2e6',
  accent: '#17a2b8'
});
