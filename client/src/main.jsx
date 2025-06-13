import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './theme.css'
import { loadAndApplyTheme } from './utils/themeUtils'

// Apply theme before React renders
try {
  loadAndApplyTheme();
} catch (error) {
  console.warn('Failed to load theme in main.jsx:', error);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);