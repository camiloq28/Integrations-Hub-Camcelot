
import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminHeader = () => {
  const navigate = useNavigate();
  
  const logout = () => {
    localStorage.clear();
    navigate('/');
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
          Admin Dashboard
        </h1>
        
        <nav style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            onClick={() => navigate('/admin')}
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
          
          <button 
            onClick={() => navigate('/users')}
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
          
          <button 
            onClick={() => navigate('/plans')}
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Manage Plans
          </button>
          
          <button 
            onClick={() => navigate('/admin/env-vars')}
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              padding: '8px 16px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Environment Variables
          </button>
          
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

export default AdminHeader;
