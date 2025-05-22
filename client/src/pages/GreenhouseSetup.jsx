// client/src/pages/GreenhouseSetup.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function GreenhouseSetup() {
  const [accessToken, setAccessToken] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const res = await fetch('/api/integrations/greenhouse/credentials', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to load credentials');
        const data = await res.json();
        setAccessToken(data.token || '');
        setExpiresAt(data.expiresAt ? new Date(data.expiresAt).toISOString().split('T')[0] : '');
        if (data.token) {
          console.log('✅ Loaded existing Greenhouse token');
        }
      } catch (err) {
        console.warn('⚠️ No existing Greenhouse token found:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCredentials();
  }, [token]);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/integrations/greenhouse/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ accessToken, expiresAt })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save credentials');

      setMessage('✅ Credentials saved');
      setError('');
      setTimeout(() => navigate('/client'), 1000);
    } catch (err) {
      setError(err.message);
      setMessage('');
    }
  };

  if (loading) return <div>Loading credentials...</div>;

  return (
    <div style={{ maxWidth: '500px', margin: 'auto' }}>
      <h2>Greenhouse Integration Setup</h2>
      <label>Access Token:</label>
      <input
        type="text"
        value={accessToken}
        onChange={e => setAccessToken(e.target.value)}
        placeholder="Enter Greenhouse API Token"
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <label>Expires At (optional):</label>
      <input
        type="date"
        value={expiresAt}
        onChange={e => setExpiresAt(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
      />
      <button onClick={handleSave}>Save and Continue</button>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default GreenhouseSetup;
