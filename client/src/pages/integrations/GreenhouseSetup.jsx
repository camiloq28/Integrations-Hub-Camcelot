import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosWithAuth from '../../utils/axiosWithAuth';
import ClientHeader from '../../components/ClientHeader';

function GreenhouseSetup() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const axiosAuth = axiosWithAuth();
        const res = await axiosAuth.get('/api/integrations/greenhouse/credentials');
        if (res.data.token) setToken(res.data.token);
      } catch (err) {
        console.error('Failed to fetch token:', err);
      }
    };
    fetchCredentials();
  }, []);

  const testToken = async () => {
    try {
      setLoading(true);
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.post('/api/integrations/greenhouse/test');
      setStatus(res.data.success ? 'valid' : 'invalid');
      toast.success('Token is valid!');
    } catch (err) {
      console.error('Token test failed:', err);
      setStatus('invalid');
      toast.error('Token is invalid');
    } finally {
      setLoading(false);
    }
  };

  const saveToken = async () => {
    try {
      if (!token) return toast.error('Token is required');
      const axiosAuth = axiosWithAuth();
      await axiosAuth.post('/api/integrations/greenhouse/config', { accessToken: token });
      toast.success('Token saved successfully');
    } catch (err) {
      console.error('Failed to save token:', err);
      toast.error('Error saving token');
    }
  };

  return (
    <div>
      <ClientHeader orgName="Greenhouse Setup" user={{}} />
      <div style={{ maxWidth: '600px', margin: 'auto' }}>
        <h2>Greenhouse Integration Setup</h2>
        <p>Enter and test your Greenhouse Harvest API key below:</p>

        <input
          type="text"
          placeholder="Enter Greenhouse API Token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />

        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button onClick={testToken} disabled={loading}>Test Token</button>
          <button onClick={saveToken} disabled={status !== 'valid'}>Save Token</button>
        </div>

        {status === 'valid' && <p style={{ color: 'green' }}>✅ Token is valid.</p>}
        {status === 'invalid' && <p style={{ color: 'red' }}>❌ Token is invalid.</p>}

        <button onClick={() => navigate('/client')}>Back to Dashboard</button>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}

export default GreenhouseSetup;