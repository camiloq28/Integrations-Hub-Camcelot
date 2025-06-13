import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosWithAuth from '../../utils/axiosWithAuth';
import ClientHeader from '../../components/ClientHeader';

function BambooHRSetup() {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const axiosAuth = axiosWithAuth();
        const res = await axiosAuth.get('/api/integrations/bamboohr/credentials');
        if (res.data.accessToken) {
          setApiKey(res.data.accessToken);
          setSubdomain(res.data.metadata?.subdomain || '');
          setStatus('connected');
        }
      } catch (err) {
        console.error('No existing credentials:', err);
        setStatus('not_connected');
      }
    };
    fetchCredentials();
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.post('/api/integrations/bamboohr/test', {
        apiKey,
        subdomain
      });

      if (res.data.success) {
        setStatus('valid');
        toast.success('BambooHR connection is valid!');
      } else {
        setStatus('invalid');
        toast.error('Invalid API key or subdomain');
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      setStatus('invalid');
      toast.error('Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  const saveCredentials = async () => {
    try {
      if (!apiKey || !subdomain) {
        return toast.error('Both API key and subdomain are required');
      }

      const axiosAuth = axiosWithAuth();
      await axiosAuth.post('/api/integrations/bamboohr/config', {
        accessToken: apiKey,
        metadata: { subdomain }
      });

      setStatus('connected');
      toast.success('BambooHR credentials saved successfully');
    } catch (err) {
      console.error('Failed to save credentials:', err);
      toast.error('Error saving credentials');
    }
  };

  const disconnect = async () => {
    try {
      const axiosAuth = axiosWithAuth();
      await axiosAuth.delete('/api/integrations/bamboohr/credentials');
      setApiKey('');
      setSubdomain('');
      setStatus('not_connected');
      toast.success('BambooHR disconnected');
    } catch (err) {
      console.error('Failed to disconnect:', err);
      toast.error('Error disconnecting BambooHR');
    }
  };

  const [user, setUser] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }
  }, []);

  return (
    <div>
      <ClientHeader orgName="Bamboo HR Setup" user={user} />
      <div style={{ maxWidth: '600px', margin: 'auto' }}>
        <h2>BambooHR Integration Setup</h2>
        <p>Connect your BambooHR account using your API key and subdomain.</p>

        <div style={{ marginBottom: '20px' }}>
          <h3>How to get your BambooHR API Key:</h3>
          <ol>
            <li>Log in to your BambooHR account</li>
            <li>Go to Settings → API Keys</li>
            <li>Generate a new API key with appropriate permissions</li>
            <li>Your subdomain is the first part of your BambooHR URL (e.g., 'yourcompany' from yourcompany.bamboohr.com)</li>
          </ol>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            <strong>Subdomain:</strong>
          </label>
          <input
            type="text"
            placeholder="yourcompany (from yourcompany.bamboohr.com)"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />

          <label style={{ display: 'block', marginBottom: '5px' }}>
            <strong>API Key:</strong>
          </label>
          <input
            type="password"
            placeholder="Enter your BambooHR API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={testConnection} disabled={loading}>
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          <button onClick={saveCredentials} disabled={status !== 'valid'}>
            Save Credentials
          </button>
          {status === 'connected' && (
            <button onClick={disconnect} style={{ backgroundColor: '#d32f2f' }}>
              Disconnect
            </button>
          )}
        </div>

        {status === 'valid' && <p style={{ color: 'green' }}>✅ Connection is valid.</p>}
        {status === 'invalid' && <p style={{ color: 'red' }}>❌ Invalid credentials.</p>}
        {status === 'connected' && <p style={{ color: 'green' }}>✅ BambooHR is connected and saved.</p>}

        <button onClick={() => navigate('/client')} style={{ marginTop: '20px' }}>
          Back to Dashboard
        </button>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}

export default BambooHRSetup;