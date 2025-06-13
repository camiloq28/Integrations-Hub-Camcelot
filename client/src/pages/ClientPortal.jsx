import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosWithAuth from '../utils/axiosWithAuth';
import ClientHeader from '../components/ClientHeader';

const ClientPortal = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const formatIntegrationSlug = (name) =>
    name?.toLowerCase().replace(/\s+/g, '-');

  const fetchIntegrationStatus = async (allowedIntegrations) => {
    const axiosAuth = axiosWithAuth();
    const statuses = {};
    for (const integration of allowedIntegrations || []) {
      const slug = formatIntegrationSlug(integration);
      try {
        await axiosAuth.get(`/api/integrations/${slug}/credentials`);
        statuses[integration] = true;
      } catch {
        statuses[integration] = false;
      }
    }
    console.log("🔧 Parsed integrations JSON:", statuses);
    setIntegrationStatus(statuses);
  };

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
        const axiosAuth = axiosWithAuth();

        const orgRes = await axiosAuth.get('/api/client/portal');
        const orgJson = orgRes.data;
        console.log("📦 Parsed portal JSON:", orgJson);
        setOrgData(orgJson);

        await fetchIntegrationStatus(orgJson.allowedIntegrations);
      } catch (err) {
        console.error('❌ Failed to load portal:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Listen for integration status changes
    const handleIntegrationChange = (event) => {
      console.log('🔄 Integration status changed:', event.detail);
      // Use existing orgData to refresh integration status
      if (orgData?.allowedIntegrations) {
        fetchIntegrationStatus(orgData.allowedIntegrations);
      }
    };

    window.addEventListener('integrationStatusChanged', handleIntegrationChange);

    return () => {
      window.removeEventListener('integrationStatusChanged', handleIntegrationChange);
    };
  }, []); // Remove the problematic dependency

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div>Loading portal...</div>;
  if (!user || !orgData) return <div>Error loading portal data.</div>;

  const { role, orgId } = user;
  const { orgName = 'Org', planName = 'N/A', allowedIntegrations = [] } = orgData;

  return (
    <div>
      <ClientHeader orgName={`${orgName} Client Portal`} user={user} />
      <div style={{ maxWidth: '600px', margin: 'auto' }}>

      <h3>Plan: {planName}</h3>

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
    </div>
  );
};

export default ClientPortal;
