// GreenhouseSetup.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GreenhouseSetup = () => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const token = storedUser?.token;
        const orgId = storedUser?.orgId;

        if (!token || !orgId) {
          console.warn('⚠️ Missing user or token in localStorage');
          return;
        }

        const res = await fetch('/api/integrations/greenhouse/status', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error('❌ Failed to parse token response JSON:', text);
          return;
        }

        if (res.ok && data?.credentials?.accessToken) {
          setApiKey(data.credentials.accessToken);
        } else {
          console.warn('⚠️ No existing Greenhouse token found');
        }
      } catch (err) {
        console.error('❌ Failed to load stored token:', err);
      }
    };

    fetchToken();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const token = storedUser?.token;
      const orgId = storedUser?.orgId;

      if (!token || !orgId) {
        throw new Error('Missing user token or organization ID');
      }

      const res = await fetch('/api/integrations/greenhouse/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accessToken: apiKey, orgId }),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', text);
        throw new Error('Unexpected response from server');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save integration credentials');
      }

      storedUser.setupComplete = true;
      localStorage.setItem('user', JSON.stringify(storedUser));

      navigate('/client');
    } catch (err) {
      console.error('❌ Error saving Greenhouse credentials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <h2>Greenhouse Integration Setup</h2>
      <p>Configure your Greenhouse access token below:</p>
      <input
        type="text"
        placeholder="Enter Greenhouse API Key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save and Continue'}
      </button>
      {error && <p style={{ color: 'red' }}>❌ {error}</p>}
    </div>
  );
};

export default GreenhouseSetup;
