import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminHeader from '../components/AdminHeader';

function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: 'white' }}>
      <AdminHeader />
      <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>

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
    </div>
  );
}

export default AdminDashboard;
