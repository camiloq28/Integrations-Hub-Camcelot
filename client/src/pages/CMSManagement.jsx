
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminHeader from '../components/AdminHeader';
import axiosWithAuth from '../utils/axiosWithAuth';

const CMSManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizations: 0,
    totalWorkflows: 0,
    activeIntegrations: 0
  });

  useEffect(() => {
    fetchCMSStats();
  }, []);

  const fetchCMSStats = async () => {
    setLoading(true);
    try {
      const axiosAuth = axiosWithAuth();
      // Fetch CMS statistics
      const response = await axiosAuth.get('/api/admin/cms-stats');
      setStats(response.data);
      toast.success('CMS statistics loaded');
    } catch (error) {
      console.error('Failed to fetch CMS stats:', error);
      toast.error('Failed to load CMS statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleContentManagement = (section) => {
    toast.info(`${section} management - Coming soon!`);
  };

  const handleSystemMaintenance = () => {
    toast.info('System maintenance tools - Coming soon!');
  };

  const handleDataExport = () => {
    toast.info('Data export functionality - Coming soon!');
  };

  const handleBackup = () => {
    toast.info('Backup management - Coming soon!');
  };

  if (loading) return <div>Loading CMS Management...</div>;

  return (
    <div>
      <AdminHeader />
      <div style={{ maxWidth: '1200px', margin: 'auto', padding: '20px' }}>
        <h2 style={{ marginBottom: '30px' }}>CMS Management Dashboard</h2>

        {/* Statistics Overview */}
        <div style={{ marginBottom: '40px' }}>
          <h3>System Overview</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4>Total Users</h4>
              <p style={{ fontSize: '24px', color: '#007bff' }}>{stats.totalUsers}</p>
            </div>
            <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4>Organizations</h4>
              <p style={{ fontSize: '24px', color: '#28a745' }}>{stats.totalOrganizations}</p>
            </div>
            <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4>Active Workflows</h4>
              <p style={{ fontSize: '24px', color: '#ffc107' }}>{stats.totalWorkflows}</p>
            </div>
            <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
              <h4>Integrations</h4>
              <p style={{ fontSize: '24px', color: '#dc3545' }}>{stats.activeIntegrations}</p>
            </div>
          </div>
        </div>

        {/* Content Management Section */}
        <div style={{ marginBottom: '40px' }}>
          <h3>Content Management</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <button
              onClick={() => handleContentManagement('User Content')}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              👥 User Content Management
            </button>
            <button
              onClick={() => handleContentManagement('Workflow Templates')}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🔄 Workflow Templates
            </button>
            <button
              onClick={() => handleContentManagement('Integration Configs')}
              style={{
                background: '#ffc107',
                color: 'black',
                border: 'none',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🔗 Integration Configs
            </button>
          </div>
        </div>

        {/* System Tools Section */}
        <div style={{ marginBottom: '40px' }}>
          <h3>System Tools</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <button
              onClick={handleSystemMaintenance}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🛠️ System Maintenance
            </button>
            <button
              onClick={handleDataExport}
              style={{
                background: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              📊 Data Export
            </button>
            <button
              onClick={handleBackup}
              style={{
                background: '#dc3545',
                color: 'white',
                border: 'none',
                padding: '20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              💾 Backup Management
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/users')}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Manage Users
            </button>
            <button
              onClick={() => navigate('/plans')}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Manage Plans
            </button>
            <button
              onClick={() => navigate('/admin/env-vars')}
              style={{
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Environment Variables
            </button>
            <button
              onClick={fetchCMSStats}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh Stats
            </button>
          </div>
        </div>

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default CMSManagement;
