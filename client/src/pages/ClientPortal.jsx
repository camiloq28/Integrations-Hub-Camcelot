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
  const [orgPlan, setOrgPlan] = useState('');
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

    // Fetch org info and integrations
    const fetchOrgData = async () => {
      try {
        const orgRes = await fetch('/api/client/portal', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const orgData = await orgRes.json();

        if (!orgRes.ok) {
          throw new Error(orgData.message || 'Failed to load portal data');
        }

        console.log('Portal Data:', orgData);

        setOrgName(orgData.orgName || 'Client');
        setOrgId(orgData.orgId || '');
        setOrgPlan(orgData.planName || '');
        setAllowedIntegrations(orgData.allowedIntegrations || []);

        const integrationsRes = await fetch('/api/client/integrations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const integrationsData = await integrationsRes.json();
        setEnabledIntegrations(integrationsData.enabled || []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load portal data');
        setLoading(false);
      }
    };

    fetchOrgData();
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
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <h2>{orgName} Client Portal</h2>

      <button onClick={() => navigate('/profile')} style={{ marginRight: '10px' }}>My Profile</button>
      {['client_admin', 'client_editor'].includes(role) && (
        <button onClick={() => navigate('/client/workflows')}>
          Manage Workflows
        </button>
      )}
      {(role === 'client_admin' || role === 'client_editor') && (
        <button onClick={() => navigate(`/org/${orgId}/users`)} style={{ marginRight: '10px' }}>User Management</button>
      )}
      <button onClick={logout}>Logout</button>

      <div style={{ marginTop: '30px' }}>
        <h3>Plan: <span style={{ color: '#4CAF50' }}>{orgPlan || 'None'}</span></h3>
        <h4>Manage Your Integrations:</h4>

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
                    disabled={role === 'client_viewer'}
                  />
                  {integration}
                </label>
              </li>
            ))}
          </ul>
        )}

        {(allowedIntegrations.length > 0 && (role === 'client_admin' || role === 'client_editor')) && (
          <button onClick={saveChanges} style={{ marginTop: '20px' }}>
            Save Changes
          </button>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default ClientPortal;
