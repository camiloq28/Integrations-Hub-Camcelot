// /client/src/pages/integrations/GreenhouseSetup.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const GreenhouseSetup = () => {
  const [apiKey, setApiKey] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const token = storedUser?.token;

        if (!token) {
          console.warn('⚠️ Missing token');
          return;
        }

        const res = await fetch('/api/integrations/greenhouse/status', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (err) {
          console.error('❌ Invalid JSON in greenhouse/status response:', text);
          return;
        }

        if (res.ok && data?.credentials?.accessToken) {
          setApiKey(data.credentials.accessToken);
          setExpiresAt(data.credentials.expiresAt || '');
          setTestPassed(true);
        } else {
          console.warn('⚠️ No existing Greenhouse credentials found');
        }
      } catch (err) {
        console.error('❌ Failed to fetch credentials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  useEffect(() => {
    setTestPassed(false);
    setTestStatus(null);
  }, [apiKey]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const token = storedUser?.token;

      if (!token) throw new Error('Missing token');
      if (!testPassed) throw new Error('API key must be tested and valid before saving');

      const res = await fetch('/api/integrations/greenhouse/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ accessToken: apiKey, expiresAt })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Server response was not valid JSON');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Failed to save integration credentials');
      }

      const updatedUser = { ...storedUser, setupComplete: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      navigate('/client');
    } catch (err) {
      console.error('❌ Save error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestStatus(null);
    setError(null);

    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const token = storedUser?.token;

      if (!token) throw new Error('Missing token');

      const res = await fetch('/api/integrations/greenhouse/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ accessToken: apiKey })
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Invalid response from test endpoint');
      }

      if (!res.ok) throw new Error(data.message || 'API test failed');

      setTestStatus('✅ Token is valid');
      setTestPassed(true);
    } catch (err) {
      console.error('❌ Test failed:', err);
      setTestStatus(`❌ ${err.message}`);
      setTestPassed(false);
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div>Loading Greenhouse credentials...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <h2>Greenhouse Integration Setup</h2>
      <p>Enter and save your API credentials to complete integration setup.</p>

      <label>Access Token:</label>
      <input
        type="text"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter Greenhouse API Token"
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSave} disabled={!testPassed || saving}>
          {saving ? 'Saving...' : 'Save and Continue'}
        </button>
        <button onClick={handleTest} disabled={testing || !apiKey}>
          {testing ? 'Testing...' : 'Test API Key'}
        </button>
      </div>

      {testStatus && <p style={{ marginTop: '10px', color: testStatus.startsWith('✅') ? 'green' : 'red' }}>{testStatus}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default GreenhouseSetup;
