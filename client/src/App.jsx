
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserProfile from './pages/UserProfile';
import UserManagement from './pages/UserManagement';
import OrganizationUserManagement from './pages/OrganizationUserManagement.jsx';
import WorkflowBuilder from './pages/WorkflowBuilder';
import PlanManagement from './pages/PlanManagement';
import EnvironmentVariables from './pages/EnvironmentVariables';
import ClientPortal from './pages/ClientPortal';
import WorkflowManagement from './pages/WorkflowManagement';
import GreenhouseSetup from './pages/integrations/GreenhouseSetup';
import GreenhouseDashboard from './pages/GreenhouseDashboard';
import GmailSetup from './pages/integrations/GmailSetup';
import BambooHRSetup from './pages/integrations/BambooHRSetup';
import CMSManagement from './pages/CMSManagement';
import { loadAndApplyTheme } from './utils/themeUtils';

function ClientLayout({ children }) {
  return (
    <div>
      {/* You can add client-specific headers or navigation here */}
      {children}
    </div>
  );
}

function App() {
  useEffect(() => {
    // Single theme load on app initialization
    const initializeTheme = () => {
      try {
        const result = loadAndApplyTheme();
        console.log('App theme initialized:', result ? 'loaded' : 'default');
      } catch (error) {
        console.warn('Theme initialization failed:', error);
      }
    };
    
    // Load theme immediately if DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeTheme);
    } else {
      initializeTheme();
    }
    
    // Listen for theme changes from CMS management
    const handleThemeChange = (event) => {
      if (event.detail && event.detail.themeColors) {
        console.log('Theme change detected from CMS');
        // Don't reload, just apply the new theme
        const root = document.documentElement;
        Object.entries(event.detail.themeColors).forEach(([key, value]) => {
          root.style.setProperty(`--color-${key}`, value);
        });
      }
    };

    // Listen for storage changes (when themes are saved in other tabs/windows)
    const handleStorageChange = (event) => {
      if (event.key === 'customTheme' && event.newValue) {
        try {
          const themeColors = JSON.parse(event.newValue);
          const root = document.documentElement;
          Object.entries(themeColors).forEach(([key, value]) => {
            root.style.setProperty(`--color-${key}`, value);
          });
        } catch (error) {
          console.error('Failed to apply theme from storage change:', error);
        }
      }
    };

    window.addEventListener('themeChanged', handleThemeChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('DOMContentLoaded', initializeTheme);
      window.removeEventListener('themeChanged', handleThemeChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/create-workflow" element={<WorkflowBuilder />} />
        <Route path="/plans" element={<PlanManagement />} />
        <Route path="/admin/env-vars" element={<EnvironmentVariables />} />
        <Route path="/admin/cms" element={<CMSManagement />} />
        <Route path="/client/integrations/greenhouse/dashboard" element={<GreenhouseDashboard />} />
        <Route path="/org/:orgId/users" element={<OrganizationUserManagement />} />

        {/* ✅ Client Routes under Layout */}
        <Route path="/client" element={<ClientLayout><ClientPortal /></ClientLayout>} />
        <Route path="/client/workflows" element={<ClientLayout><WorkflowManagement /></ClientLayout>} />
        <Route path="/client/workflows/edit/:id" element={<ClientLayout><WorkflowBuilder /></ClientLayout>} />
        <Route path="/client/integrations/gmail" element={<ClientLayout><GmailSetup /></ClientLayout>} />
        <Route path="/client/integrations/greenhouse" element={<ClientLayout><GreenhouseSetup /></ClientLayout>} />
        <Route path="/client/integrations/bamboo-hr" element={<ClientLayout><BambooHRSetup /></ClientLayout>} />

        {/* 🔚 Fallback route */}
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </Router>
  );
}

export default App;
