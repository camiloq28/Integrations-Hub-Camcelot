import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientPortal from './pages/ClientPortal';
import UserProfile from './pages/UserProfile';
import PlanManagement from './pages/PlanManagement';
import UserManagement from './pages/UserManagement';
import WorkflowBuilder from './pages/WorkflowBuilder';
import WorkflowManagement from './pages/WorkflowManagement';
import OrganizationUserManagement from './pages/OrganizationUserManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/client" element={<ClientPortal />} />
        <Route path="/profile" element={<UserProfile />}
/>
        <Route path="/users" element={<UserManagement />} />
        <Route path="/client/workflows" element={<WorkflowManagement />} />
        <Route path="/create-workflow" element={<WorkflowBuilder />} />
        <Route path="/client/workflows/edit/:id" element={<WorkflowBuilder />} />
        <Route path="/plans" element={<PlanManagement />} />
        <Route path="/org/:orgId/users" element={<OrganizationUserManagement />} />
      </Routes>
    </Router>
  );
}

export default App;

