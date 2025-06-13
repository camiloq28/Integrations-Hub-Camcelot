
// Theme utility functions
let isThemeLoading = false;
let loadedTheme = null;

export const loadAndApplyTheme = () => {
  // Prevent multiple simultaneous loads
  if (isThemeLoading && loadedTheme) {
    return loadedTheme;
  }
  
  isThemeLoading = true;
  
  try {
    const savedTheme = localStorage.getItem('customTheme');
    if (savedTheme) {
      const themeColors = JSON.parse(savedTheme);
      applyThemeToDOM(themeColors);
      loadedTheme = themeColors;
      console.log('✅ Custom theme loaded and applied');
      return themeColors;
    } else {
      // Apply default theme
      const defaultTheme = getDefaultTheme();
      applyThemeToDOM(defaultTheme);
      loadedTheme = defaultTheme;
      console.log('Using default theme');
      return defaultTheme;
    }
  } catch (error) {
    console.error('❌ Failed to load saved theme:', error);
    // Fallback to default theme
    const defaultTheme = getDefaultTheme();
    applyThemeToDOM(defaultTheme);
    loadedTheme = defaultTheme;
    return defaultTheme;
  } finally {
    isThemeLoading = false;
  }
};

export const applyThemeToDOM = (themeColors) => {
  if (!document.documentElement) {
    console.warn('DOM not ready, delaying theme application');
    setTimeout(() => applyThemeToDOM(themeColors), 100);
    return;
  }

  const root = document.documentElement;

  // Apply theme colors as CSS custom properties
  Object.entries(themeColors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });

  // Force immediate body styling
  if (themeColors.background) {
    document.body.style.setProperty('background-color', themeColors.background, 'important');
  }
  if (themeColors.text) {
    document.body.style.setProperty('color', themeColors.text, 'important');
  }

  // Create and inject dynamic CSS to ensure theme application
  let dynamicStyle = document.getElementById('dynamic-theme-style');
  if (!dynamicStyle) {
    dynamicStyle = document.createElement('style');
    dynamicStyle.id = 'dynamic-theme-style';
    document.head.appendChild(dynamicStyle);
  }

  const cssRules = `
    * {
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease !important;
    }
    
    html, body {
      background-color: ${themeColors.background} !important;
      color: ${themeColors.text} !important;
    }
    
    #root {
      background-color: ${themeColors.background} !important;
      color: ${themeColors.text} !important;
      min-height: 100vh;
    }
    
    .btn-primary, button[style*="background: #28a745"], button[style*="background-color: #28a745"] {
      background-color: ${themeColors.primary} !important;
      border-color: ${themeColors.primary} !important;
    }
    
    .card, .surface, [style*="background: #1e1e1e"], [style*="background-color: #1e1e1e"] {
      background-color: ${themeColors.surface} !important;
      border-color: ${themeColors.border} !important;
      color: ${themeColors.text} !important;
    }
    
    input, textarea, select {
      background-color: ${themeColors.surface} !important;
      border-color: ${themeColors.border} !important;
      color: ${themeColors.text} !important;
    }
    
    header, [style*="background: #343a40"], [style*="background-color: #343a40"] {
      background-color: ${themeColors.dark} !important;
      color: ${themeColors.light} !important;
    }

    /* Force theme on all page containers */
    div[style*="maxWidth"], div[style*="max-width"] {
      color: ${themeColors.text} !important;
    }
  `;

  dynamicStyle.textContent = cssRules;

  // Force a reflow and ensure styles are applied
  void document.body.offsetHeight;

  // Dispatch a custom event to notify all components
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('themeApplied', {
      detail: { themeColors }
    }));
  }, 0);
};

export const saveAndApplyTheme = (themeColors) => {
  try {
    applyThemeToDOM(themeColors);
    localStorage.setItem('customTheme', JSON.stringify(themeColors));
    loadedTheme = themeColors;
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
