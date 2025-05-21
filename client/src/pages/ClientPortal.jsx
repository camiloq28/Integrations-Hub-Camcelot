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

    const fetchOrgData = async () => {
      try {
        console.log('🔐 Portal access - Token:', token);

        const orgRes = await fetch('/api/client/portal', {
          headers: { Authorization: `Bearer ${token}` },
        });

        let orgData;
        try {
          const cloned = orgRes.clone(); // clone before parsing
          orgData = await orgRes.json();
          console.log('📦 Parsed portal JSON:', orgData);
        } catch (jsonErr) {
          try {
            const rawText = await orgRes.clone().text();
            console.error('❌ Failed to parse JSON, raw text was:', rawText);
          } catch (textErr) {
            console.error('❌ Error reading raw text:', textErr);
          }
          throw new Error('Invalid JSON returned from portal');
        }


        if (!orgRes.ok) {
          console.error('❌ Server returned error:', orgData);
          throw new Error(orgData.message || 'Failed to fetch portal');
        }

        if (orgData.message === 'Unauthorized: Invalid token') {
          toast.error('Unauthorized: Invalid token');
          throw new Error('Unauthorized');
        }

        setOrgName(orgData.orgName || 'Client');
        setOrgId(orgData.orgId || '');
        setOrgPlan(orgData.planName || '');
        setAllowedIntegrations(orgData.allowedIntegrations || []);

        const integrationsRes = await fetch('/api/client/integrations', {
          headers: { Authorization: `Bearer ${token}` }
        });

        let integrationsData;
        try {
          const cloned = integrationsRes.clone();
          integrationsData = await cloned.json();
          console.log('🔧 Parsed integrations JSON:', integrationsData);
        } catch (jsonErr) {
          try {
            const rawText = await integrationsRes.clone().text();
            console.error('❌ Failed to parse integrations JSON, raw text was:', rawText);
          } catch (textErr) {
            console.error('❌ Also failed to read raw text from integrations response:', textErr);
          }
          throw new Error('Invalid JSON returned from integrations endpoint');
        }


        if (!integrationsRes.ok) {
          console.error('❌ Server error from /integrations:', integrationsData);
          throw new Error(integrationsData.message || 'Failed to fetch integrations');
        }

        setEnabledIntegrations(integrationsData.enabled || []);
        setLoading(false);
      } catch (err) {
        console.error('❌ Failed to load portal:', err);
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
