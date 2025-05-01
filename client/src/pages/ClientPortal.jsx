import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ClientPortal() {
  const navigate = useNavigate();
  const [enabledIntegrations, setEnabledIntegrations] = useState([]);
  const [allowedIntegrations, setAllowedIntegrations] = useState([]);
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const clientRoles = ['client_admin', 'client_editor', 'client_viewer'];

    if (!token || !clientRoles.includes(role)) {
      toast.error('Unauthorized – redirecting to login.');
      navigate('/');
      return;
    }

    // Fetch org name from /portal
    fetch('/api/client/portal', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setOrgName(data.orgName || 'Client');
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to fetch organization info');
      });

    // Fetch integrations
    fetch('/api/client/integrations', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setAllowedIntegrations(data.allowed || []);
        setEnabledIntegrations(data.enabled || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to fetch integrations');
        setLoading(false);
      });
  }, [navigate]);

  const toggleIntegration = (integration) => {
    setEnabledIntegrations(prev =>
      prev.includes(integration)
        ? prev.filter(i => i !== integration)
        : [...prev, integration]
    );
  };

  const saveChanges = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/client/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ integrations: enabledIntegrations })
      });

      const data = await res.json();
      toast.success(data.message || 'Integrations saved.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save integrations');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '500px', margin: 'auto' }}>
      <h2>{orgName} Client Portal</h2>

      <button onClick={() => navigate('/profile')} style={{ marginBottom: '10px' }}>
        My Profile
      </button>

      {localStorage.getItem('role') === 'client_admin' && (
        <button onClick={() => navigate('/users')} style={{ marginBottom: '10px' }}>
          User Management
        </button>
      )}


      <button onClick={logout} style={{ marginBottom: '20px' }}>
        Logout
      </button>

      <h3>Manage Your Integrations:</h3>

      {allowedIntegrations.length === 0 ? (
        <p>No integrations available for your plan.</p>
      ) : (
        <ul>
          {allowedIntegrations.map((integration, index) => (
            <li key={index}>
              <label>
                <input
                  type="checkbox"
                  checked={enabledIntegrations.includes(integration)}
                  onChange={() => toggleIntegration(integration)}
                />
                {integration}
              </label>
            </li>
          ))}
        </ul>
      )}

      {allowedIntegrations.length > 0 && (
        <button onClick={saveChanges} style={{ marginTop: '20px' }}>
          Save Changes
        </button>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default ClientPortal;
