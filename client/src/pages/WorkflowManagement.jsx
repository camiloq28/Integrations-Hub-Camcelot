import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axiosWithAuth from '../utils/axiosWithAuth';
import ClientHeader from '../components/ClientHeader';

function WorkflowManagement() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
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

  useEffect(() => {
    const axiosAuth = axiosWithAuth();
    axiosAuth.get('/api/client/workflows')
      .then((res) => {
        setWorkflows(res.data.workflows || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to fetch workflows');
        setLoading(false);
      });
  }, []);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const deleteWorkflow = async (id) => {
    if (!window.confirm('Delete this workflow?')) return;

    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.delete(`/api/client/workflows/${id}`);
      toast.success('Workflow deleted');
      setWorkflows(workflows.filter((wf) => wf._id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Server error');
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.post(`/api/client/workflows/${id}`, { status: newStatus });
      const data = res.data;

      if (data.workflow) {
        setWorkflows((prev) =>
          prev.map((wf) => (wf._id === id ? data.workflow : wf))
        );
      } else {
        setWorkflows((prev) =>
          prev.map((wf) => (wf._id === id ? { ...wf, status: newStatus } : wf))
        );
      }

      toast.success(`Workflow ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error('Server error');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>
      <ClientHeader user={user} />

      <h3>Workflow Management</h3>
      <button onClick={() => navigate('/create-workflow')}>Create Workflow</button>

      {loading ? (
        <p>Loading...</p>
      ) : workflows.length === 0 ? (
        <p>No workflows found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #ccc' }}>
              <th style={{ textAlign: 'left' }}>Name</th>
              <th style={{ textAlign: 'left' }}>Trigger</th>
              <th style={{ textAlign: 'left' }}>Status</th>
              <th style={{ textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf) => (
              <tr key={wf._id} style={{ borderBottom: '1px solid #eee' }}>
                <td>{wf.name}</td>
                <td>{wf.trigger?.type}</td>
                <td style={{ textTransform: 'capitalize' }}>{wf.status}</td>
                <td>
                  <button onClick={() => toggleStatus(wf._id, wf.status)}>
                    {wf.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <Link to={`/client/workflows/edit/${wf._id}`} style={{ marginLeft: '10px' }}>Edit</Link>
                  <button onClick={() => deleteWorkflow(wf._id)} style={{ marginLeft: '10px', color: 'red' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default WorkflowManagement;