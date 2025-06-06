
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosWithAuth from '../../utils/axiosWithAuth';

function GmailSetup() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);

  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const axiosAuth = axiosWithAuth();
        const res = await axiosAuth.get('/api/integrations/gmail/credentials');
        setCredentials(res.data);
        setStatus('connected');
      } catch (err) {
        console.error('No existing credentials:', err);
        setStatus('not_connected');
      }
    };
    fetchCredentials();
  }, []);

  const initiateOAuth = async () => {
    try {
      setLoading(true);
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.get('/api/integrations/gmail/oauth/url');
      window.location.href = res.data.authUrl;
    } catch (err) {
      console.error('Failed to initiate OAuth:', err);
      toast.error('Error initiating Gmail connection');
      setLoading(false);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.post('/api/integrations/gmail/test');
      if (res.data.success) {
        toast.success('Gmail connection is working!');
        setStatus('connected');
      } else {
        toast.error('Gmail connection failed');
        setStatus('error');
      }
    } catch (err) {
      console.error('Connection test failed:', err);
      toast.error('Connection test failed');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      const axiosAuth = axiosWithAuth();
      await axiosAuth.delete('/api/integrations/gmail/credentials');
      setCredentials(null);
      setStatus('not_connected');
      toast.success('Gmail disconnected');
    } catch (err) {
      console.error('Failed to disconnect:', err);
      toast.error('Error disconnecting Gmail');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <h2>Gmail Integration Setup</h2>
      <p>Connect your Gmail account to send emails through workflows.</p>

      {status === 'not_connected' && (
        <div>
          <p>Gmail is not connected to your account.</p>
          <button onClick={initiateOAuth} disabled={loading}>
            {loading ? 'Connecting...' : 'Connect Gmail Account'}
          </button>
        </div>
      )}

      {status === 'connected' && credentials && (
        <div>
          <p style={{ color: 'green' }}>✅ Gmail is connected!</p>
          <p><strong>Email:</strong> {credentials.metadata?.email || 'N/A'}</p>
          <p><strong>Connected:</strong> {new Date(credentials.createdAt).toLocaleString()}</p>
          
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={testConnection} disabled={loading}>
              Test Connection
            </button>
            <button onClick={disconnect} style={{ backgroundColor: '#d32f2f' }}>
              Disconnect
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div>
          <p style={{ color: 'red' }}>❌ Connection error. Please try reconnecting.</p>
          <button onClick={initiateOAuth} disabled={loading}>
            Reconnect Gmail
          </button>
        </div>
      )}

      <button onClick={() => navigate('/client')} style={{ marginTop: '20px' }}>
        Back to Dashboard
      </button>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default GmailSetup;
