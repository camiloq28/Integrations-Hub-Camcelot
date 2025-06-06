
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosWithAuth from '../utils/axiosWithAuth';

function EnvironmentVariables() {
  const navigate = useNavigate();
  const [envVars, setEnvVars] = useState({});
  const [newVar, setNewVar] = useState({ key: '', value: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Environment variables grouped by platform
  const envVarGroups = {
    'System Configuration': [
      { key: 'MONGODB_URI', description: 'MongoDB connection string' },
      { key: 'JWT_SECRET', description: 'JWT signing secret' },
      { key: 'BASE_URL', description: 'Base URL of the application' },
      { key: 'CLIENT_URL', description: 'Frontend URL of the application' }
    ],
    'Email & Communication': [
      { key: 'GMAIL_CLIENT_ID', description: 'Google OAuth Client ID for Gmail integration' },
      { key: 'GMAIL_CLIENT_SECRET', description: 'Google OAuth Client Secret for Gmail integration' },
      { key: 'SLACK_CLIENT_ID', description: 'Slack OAuth Client ID for Slack integration' },
      { key: 'SLACK_CLIENT_SECRET', description: 'Slack OAuth Client Secret for Slack integration' }
    ],
    'HR & Recruiting': [
      { key: 'GREENHOUSE_API_KEY', description: 'Greenhouse API key for recruiting integration' },
      { key: 'BAMBOOHR_API_KEY', description: 'BambooHR API key for HR integration' },
      { key: 'BAMBOOHR_SUBDOMAIN', description: 'BambooHR company subdomain' }
    ],
    'Development & Monitoring': [
      { key: 'NODE_ENV', description: 'Node.js environment (development/production)' },
      { key: 'LOG_LEVEL', description: 'Application logging level' },
      { key: 'SENTRY_DSN', description: 'Sentry error tracking DSN' }
    ]
  };

  useEffect(() => {
    fetchEnvVars();
  }, []);

  const fetchEnvVars = async () => {
    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.get('/api/admin/env-vars');
      setEnvVars(res.data.envVars || {});
    } catch (err) {
      console.error('Error fetching environment variables:', err);
      toast.error('Failed to load environment variables');
    } finally {
      setLoading(false);
    }
  };

  const saveEnvVar = async (key, value, description = '') => {
    try {
      const axiosAuth = axiosWithAuth();
      await axiosAuth.post('/api/admin/env-vars', { key, value, description });
      await fetchEnvVars();
      toast.success(`${key} saved successfully`);
      setNewVar({ key: '', value: '', description: '' });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving environment variable:', err);
      toast.error('Failed to save environment variable');
    }
  };

  const deleteEnvVar = async (key) => {
    if (!confirm(`Are you sure you want to delete ${key}?`)) return;
    
    try {
      const axiosAuth = axiosWithAuth();
      await axiosAuth.delete(`/api/admin/env-vars/${key}`);
      await fetchEnvVars();
      toast.success(`${key} deleted successfully`);
    } catch (err) {
      console.error('Error deleting environment variable:', err);
      toast.error('Failed to delete environment variable');
    }
  };

  const getAllDefinedVars = () => {
    const allDefined = [];
    Object.values(envVarGroups).forEach(group => {
      group.forEach(varDef => allDefined.push(varDef.key));
    });
    return allDefined;
  };

  if (loading) return <div>Loading environment variables...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>
      <button onClick={() => navigate('/admin')} style={{ marginBottom: '20px' }}>
        Back to Admin Dashboard
      </button>

      <h2>Environment Variables Management</h2>
      <p style={{ color: '#888', marginBottom: '30px' }}>
        Manage environment variables for integrations and system configuration.
      </p>

      {!showAddForm && (
        <button 
          onClick={() => setShowAddForm(true)}
          style={{ marginBottom: '20px', background: '#4CAF50', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px' }}
        >
          Add Custom Variable
        </button>
      )}

      {showAddForm && (
        <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <h3>Add Custom Environment Variable</h3>
          <div style={{ marginBottom: '15px' }}>
            <label>Key:</label>
            <input
              type="text"
              value={newVar.key}
              onChange={(e) => setNewVar({ ...newVar, key: e.target.value })}
              placeholder="CUSTOM_VARIABLE_NAME"
              style={{ width: '100%', padding: '8px', marginTop: '5px', background: '#333', border: '1px solid #555', color: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Value:</label>
            <input
              type="password"
              value={newVar.value}
              onChange={(e) => setNewVar({ ...newVar, value: e.target.value })}
              placeholder="Variable value"
              style={{ width: '100%', padding: '8px', marginTop: '5px', background: '#333', border: '1px solid #555', color: 'white' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Description:</label>
            <input
              type="text"
              value={newVar.description}
              onChange={(e) => setNewVar({ ...newVar, description: e.target.value })}
              placeholder="Description of this variable"
              style={{ width: '100%', padding: '8px', marginTop: '5px', background: '#333', border: '1px solid #555', color: 'white' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => saveEnvVar(newVar.key, newVar.value, newVar.description)}
              disabled={!newVar.key || !newVar.value}
              style={{ background: '#4CAF50', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px' }}
            >
              Save
            </button>
            <button 
              onClick={() => setShowAddForm(false)}
              style={{ background: '#666', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {Object.entries(envVarGroups).map(([groupName, variables]) => (
        <div key={groupName} style={{ marginBottom: '40px' }}>
          <h3 style={{ 
            color: '#4CAF50', 
            borderBottom: '2px solid #4CAF50', 
            paddingBottom: '5px',
            marginBottom: '20px'
          }}>
            {groupName}
          </h3>
          <div style={{ display: 'grid', gap: '15px' }}>
            {variables.map(({ key, description }) => {
              const isSet = envVars[key];
              return (
                <div key={key} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{key}</strong>
                      <span style={{ marginLeft: '10px', color: isSet ? 'green' : 'red' }}>
                        {isSet ? '✅ Set' : '❌ Not Set'}
                      </span>
                      <p style={{ color: '#888', fontSize: '14px', margin: '5px 0 0 0' }}>{description}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => {
                          setNewVar({ key, value: '', description });
                          setShowAddForm(true);
                        }}
                        style={{ background: '#2196F3', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                      >
                        {isSet ? 'Update' : 'Set'}
                      </button>
                      {isSet && !['MONGODB_URI', 'JWT_SECRET'].includes(key) && (
                        <button 
                          onClick={() => deleteEnvVar(key)}
                          style={{ background: '#f44336', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <h3 style={{ 
        color: '#FF9800', 
        borderBottom: '2px solid #FF9800', 
        paddingBottom: '5px',
        marginBottom: '20px'
      }}>
        Custom Variables
      </h3>
      <div style={{ display: 'grid', gap: '15px' }}>
        {Object.entries(envVars).filter(([key]) => !getAllDefinedVars().includes(key)).map(([key, data]) => (
          <div key={key} style={{ background: '#1e1e1e', padding: '15px', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{key}</strong>
                <span style={{ marginLeft: '10px', color: 'green' }}>✅ Set</span>
                {data.description && (
                  <p style={{ color: '#888', fontSize: '14px', margin: '5px 0 0 0' }}>{data.description}</p>
                )}
              </div>
              <button 
                onClick={() => deleteEnvVar(key)}
                style={{ background: '#f44336', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', fontSize: '12px' }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {Object.entries(envVars).filter(([key]) => !getAllDefinedVars().includes(key)).length === 0 && (
          <p style={{ color: '#888', fontStyle: 'italic' }}>No custom variables defined</p>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default EnvironmentVariables;
