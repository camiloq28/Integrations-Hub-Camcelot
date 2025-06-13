import React from 'react';
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

function ClientLayout({ children }) {
  return (
    <div>
      {/* You can add client-specific headers or navigation here */}
      {children}
    </div>
  );
}

function App() {
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