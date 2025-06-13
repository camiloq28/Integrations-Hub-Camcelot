// Default theme configuration
export const getDefaultTheme = () => ({
  primaryColor: '#007bff',
  secondaryColor: '#6c757d',
  backgroundColor: '#121212',
  textColor: '#ffffff',
  cardBackground: '#1e1e1e',
  borderColor: '#333333',
  buttonColor: '#007bff',
  buttonHoverColor: '#0056b3'
});

// Apply theme colors to DOM
export const applyThemeToDOM = (themeColors) => {
  try {
    const root = document.documentElement;
    if (root) {
      root.style.setProperty('--primary-color', themeColors.primaryColor || '#007bff');
      root.style.setProperty('--secondary-color', themeColors.secondaryColor || '#6c757d');
      root.style.setProperty('--background-color', themeColors.backgroundColor || '#121212');
      root.style.setProperty('--text-color', themeColors.textColor || '#ffffff');
      root.style.setProperty('--card-background', themeColors.cardBackground || '#1e1e1e');
      root.style.setProperty('--border-color', themeColors.borderColor || '#333333');
      root.style.setProperty('--button-color', themeColors.buttonColor || '#007bff');
      root.style.setProperty('--button-hover-color', themeColors.buttonHoverColor || '#0056b3');
    }
  } catch (error) {
    console.error('❌ Failed to apply theme to DOM:', error);
  }
};

// Load and apply saved theme from localStorage
export const loadAndApplyTheme = () => {
  try {
    const savedTheme = localStorage.getItem('customTheme');
    if (savedTheme) {
      const themeColors = JSON.parse(savedTheme);
      applyThemeToDOM(themeColors);
      console.log('✅ Custom theme loaded and applied');
      return themeColors;
    } else {
      // Always apply default theme to ensure consistent styling
      const defaultTheme = getDefaultTheme();
      applyThemeToDOM(defaultTheme);
      console.log('Using default theme');
      return defaultTheme;
    }
  } catch (error) {
    console.error('❌ Failed to load saved theme:', error);
    // Fallback to default theme
    const defaultTheme = getDefaultTheme();
    applyThemeToDOM(defaultTheme);
    return defaultTheme;
  }
};

// Save theme to localStorage
export const saveTheme = (themeColors) => {
  try {
    localStorage.setItem('customTheme', JSON.stringify(themeColors));
    applyThemeToDOM(themeColors);
    console.log('✅ Theme saved and applied');
    return true;
  } catch (error) {
    console.error('❌ Failed to save theme:', error);
    return false;
  }
};