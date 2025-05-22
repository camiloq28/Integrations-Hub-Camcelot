import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ClientPortal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const formatIntegrationSlug = (name) =>
    name?.toLowerCase().replace(/\s+/g, '-');

  useEffect(() => {
    const fetchData = async () => {
      const storedUserRaw = localStorage.getItem('user');
      if (!storedUserRaw) {
        console.warn("⚠️ No user in localStorage, redirecting to login");
        navigate('/login');
        return;
      }

      let storedUser;
      try {
        storedUser = JSON.parse(storedUserRaw);
      } catch (err) {
        console.warn("⚠️ Failed to parse user from localStorage, redirecting");
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      if (!storedUser || !storedUser.token) {
        console.warn("⚠️ Missing token in stored user, redirecting");
        localStorage.removeItem('user');
        navigate('/login');
        return;
      }

      setUser(storedUser);

      try {
        const token = storedUser.token;

        const orgRes = await fetch('/api/client/portal', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!orgRes.ok) {
          const raw = await orgRes.text();
          throw new Error(`❌ Failed to fetch portal: ${orgRes.status} ${raw}`);
        }

        const orgJson = await orgRes.json();
        console.log("📦 Parsed portal JSON:", orgJson);
        setOrgData(orgJson);

        const statuses = {};
        for (const integration of orgJson.allowedIntegrations || []) {
          const slug = formatIntegrationSlug(integration);
          const res = await fetch(`/api/integrations/${slug}/credentials`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          statuses[integration] = res.ok;
        }
        console.log("🔧 Parsed integrations JSON:", statuses);
        setIntegrationStatus(statuses);
      } catch (err) {
        console.error('❌ Failed to load portal:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div>Loading portal...</div>;
  if (!user || !orgData) return <div>Error loading portal data.</div>;

  const { role, orgId } = user;
  const { orgName = 'Org', planName = 'N/A', allowedIntegrations = [] } = orgData;

  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <h2>{orgName} Client Portal</h2>

      <button onClick={() => navigate('/profile')} style={{ marginRight: '10px' }}>My Profile</button>
      {['client_admin', 'client_editor'].includes(role) && (
        <button onClick={() => navigate('/client/workflows')} style={{ marginRight: '10px' }}>
          Manage Workflows
        </button>
      )}
      {['client_admin', 'client_editor'].includes(role) && (
        <button onClick={() => navigate(`/org/${orgId}/users`)} style={{ marginRight: '10px' }}>
          User Management
        </button>
      )}
      <button onClick={logout}>Logout</button>

      <h3 style={{ marginTop: '30px' }}>Plan: {planName}</h3>

      <h3>Allowed Integrations</h3>
      <ul>
        {allowedIntegrations.map((integration) => {
          const slug = formatIntegrationSlug(integration);
          return (
            <li key={integration} style={{ marginBottom: '10px' }}>
              <strong>{integration}</strong>
              <span style={{ marginLeft: '10px', color: integrationStatus[integration] ? 'green' : 'red' }}>
                {integrationStatus[integration] ? '✅ Connected' : '❌ Not Connected'}
              </span>
              <button
                style={{ marginLeft: '10px' }}
                onClick={() => navigate(`/client/integrations/${slug}`)}
              >
                Configure
              </button>
              {slug === 'greenhouse' && integrationStatus[integration] && (
                <button
                  style={{ marginLeft: '10px' }}
                  onClick={() => navigate('/client/integrations/greenhouse/dashboard')}
                >
                  Open Dashboard
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ClientPortal;
