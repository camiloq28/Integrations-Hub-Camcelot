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