
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosWithAuth from '../../utils/axiosWithAuth';
import { toast, ToastContainer } from 'react-toastify';

const GmailSetup = () => {
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    // Check for OAuth callback results
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const accountName = searchParams.get('account');

    if (success) {
      toast.success(`Gmail account "${accountName}" connected successfully!`);
    } else if (error) {
      toast.error('Failed to connect Gmail account');
    }

    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.get('/api/integrations/gmail/credentials');
      setAccounts(res.data.accounts || []);
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error fetching accounts:', err);
        toast.error('Error loading Gmail accounts');
      }
    }
  };

  const initiateOAuth = async () => {
    if (!newAccountName.trim()) {
      toast.error('Please enter an account name');
      return;
    }

    // Check if account name already exists
    if (accounts.some(acc => acc.accountName === newAccountName.trim())) {
      toast.error('Account name already exists');
      return;
    }

    setLoading(true);
    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.get(`/api/integrations/gmail/oauth/url?accountName=${encodeURIComponent(newAccountName.trim())}`);
      window.location.href = res.data.authUrl;
    } catch (err) {
      console.error('Failed to initiate OAuth:', err);
      if (err.response?.status === 500) {
        toast.error('Gmail OAuth not configured. Please check environment variables.');
      } else {
        toast.error('Error initiating Gmail connection');
      }
      setLoading(false);
    }
  };

  const testConnection = async (accountName) => {
    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.post(`/api/integrations/gmail/test/${accountName}`);
      if (res.data.success) {
        toast.success(`Connection test successful for ${accountName}`);
      }
    } catch (err) {
      toast.error(`Connection test failed for ${accountName}`);
    }
  };

  const setDefaultAccount = async (accountName) => {
    try {
      const axiosAuth = axiosWithAuth();
      await axiosAuth.post(`/api/integrations/gmail/credentials/${accountName}/set-default`);
      toast.success(`${accountName} set as default account`);
      fetchAccounts(); // Refresh to show updated default status
    } catch (err) {
      toast.error('Error setting default account');
    }
  };

  const deleteAccount = async (accountName) => {
    if (!confirm(`Are you sure you want to delete the "${accountName}" Gmail account?`)) {
      return;
    }

    try {
      const axiosAuth = axiosWithAuth();
      await axiosAuth.delete(`/api/integrations/gmail/credentials/${accountName}`);
      toast.success(`${accountName} account deleted successfully`);
      
      // Refresh the accounts list
      await fetchAccounts();
      
      // Force a page refresh after a short delay to ensure integration status updates
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      toast.error('Error deleting account');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
      <h2>Gmail Integration Setup</h2>
      
      {accounts.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3>Connected Gmail Accounts</h3>
          {accounts.map((account) => (
            <div key={account.accountName} style={{ 
              border: '1px solid #ccc', 
              padding: '15px', 
              marginBottom: '10px', 
              borderRadius: '5px',
              backgroundColor: account.isDefault ? '#f0f8ff' : '#fff'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 5px 0' }}>
                    {account.accountName}
                    {account.isDefault && <span style={{ color: '#007bff', marginLeft: '10px' }}>(Default)</span>}
                  </h4>
                  <p style={{ margin: '0', color: '#666' }}>
                    Email: {account.metadata?.email}
                  </p>
                  <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                    Connected: {new Date(account.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => testConnection(account.accountName)}
                    style={{ backgroundColor: '#28a745', color: 'white' }}
                  >
                    Test
                  </button>
                  {!account.isDefault && (
                    <button 
                      onClick={() => setDefaultAccount(account.accountName)}
                      style={{ backgroundColor: '#007bff', color: 'white' }}
                    >
                      Set Default
                    </button>
                  )}
                  <button 
                    onClick={() => deleteAccount(account.accountName)}
                    style={{ backgroundColor: '#dc3545', color: 'white' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>Add New Gmail Account</h3>
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)}
            style={{ backgroundColor: '#007bff', color: 'white', padding: '10px 20px' }}
          >
            Add Gmail Account
          </button>
        ) : (
          <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
            <div style={{ marginBottom: '15px' }}>
              <label>Account Name:</label>
              <input
                type="text"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g., Marketing Gmail, Support Gmail"
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
              <small style={{ color: '#666' }}>
                Give this Gmail account a descriptive name to help you identify it later.
              </small>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={initiateOAuth}
                disabled={loading}
                style={{ 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  padding: '10px 20px',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Connecting...' : 'Connect Gmail Account'}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewAccountName('');
                }}
                style={{ 
                  backgroundColor: '#6c757d', 
                  color: 'white', 
                  padding: '10px 20px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {accounts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>No Gmail accounts connected yet.</p>
          <p>Add your first Gmail account to get started with email automation.</p>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default GmailSetup;
