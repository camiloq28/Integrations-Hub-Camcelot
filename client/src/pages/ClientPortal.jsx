import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ClientPortal() {
  const navigate = useNavigate();
  const [enabledIntegrations, setEnabledIntegrations] = useState([]);
  const [allowedIntegrations, setAllowedIntegrations] = useState([]);
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');
    if (storedRole) setRole(storedRole);

    const clientRoles = ['client_admin', 'client_editor', 'client_viewer'];

    if (!token || !clientRoles.includes(storedRole)) {
      toast.error('Unauthorized – redirecting to login.');
      navigate('/');
      return;
    }

    // Fetch org name and orgId
    fetch('/api/client/portal', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        console.log('portal data:', data); // 👈 Add this to debug
        setOrgName(data.orgName || 'Client');
        setOrgId(data.orgId || '');

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

      {orgId && role?.toLowerCase() === 'client_admin' && (
        <button onClick={() => navigate(`/org/${orgId}/users`)} style={{ marginBottom: '10px' }}>
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
