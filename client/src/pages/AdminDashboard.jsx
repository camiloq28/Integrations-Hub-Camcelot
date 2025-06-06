import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminDashboard() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto' }}>
      <h2>Admin Dashboard</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button onClick={() => navigate('/profile')}>My Profile</button>
        <button onClick={() => navigate('/users')}>User Management</button>
        <button onClick={() => navigate('/plans')}>Manage Plans</button>
        <button onClick={() => navigate('/admin/env-vars')}>Environment Variables</button>
        <button onClick={logout}>Logout</button>
      </div>

      <h3>Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
          <h4>Total Users</h4>
          <p>Coming soon...</p>
        </div>
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
          <h4>Total Organizations</h4>
          <p>Coming soon...</p>
        </div>
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
          <h4>Most Popular Integration</h4>
          <p>Coming soon...</p>
        </div>
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px' }}>
          <h4>Last Login Activity</h4>
          <p>Coming soon...</p>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default AdminDashboard;
