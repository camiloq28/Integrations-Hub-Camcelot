import React from 'react';
import { useNavigate } from 'react-router-dom';

const ClientHeader = ({ orgName = 'Client Portal', user = {} }) => {
  const navigate = useNavigate();

  // Add null check to prevent destructuring error
  if (!user) {
    return (
      <header style={{ background: '#1e1e1e', padding: '15px 20px', color: 'white', marginBottom: '20px',
      borderBottom: '2px solid #333' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ 
          margin: '0 0 15px 0', 
          color: '#fff',
          fontSize: '24px'
        }}>{orgName}</h1>
          <div>Loading...</div>
        </div>
      </header>
    );
  }

  const { role, orgId } = user || {};

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header style={{ 
      backgroundColor: '#1e1e1e', 
      padding: '15px 20px', 
      marginBottom: '20px',
      borderBottom: '2px solid #333'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          margin: '0 0 15px 0', 
          color: '#fff',
          fontSize: '24px'
        }}>
          {orgName}
        </h1>

        <nav style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/client')}
            style={{ 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🏠 Home
          </button>

          <button 
            onClick={() => navigate('/profile')}
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            My Profile
          </button>

          {['client_admin', 'client_editor'].includes(role) && (
            <button 
              onClick={() => navigate('/client/workflows')}
              style={{ 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Manage Workflows
            </button>
          )}

          {['client_admin', 'client_editor'].includes(role) && (
            <button 
              onClick={() => navigate(`/org/${orgId}/users`)}
              style={{ 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              User Management
            </button>
          )}

          <button 
            onClick={logout}
            style={{ 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer',
              marginLeft: 'auto'
            }}
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
};

export default ClientHeader;