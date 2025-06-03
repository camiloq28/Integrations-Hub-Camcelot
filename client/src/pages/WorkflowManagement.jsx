import { useEffect, useState } from 'react';
import axiosWithAuth from '../utils/axiosWithAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function WorkflowManagement() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

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
      const data = res.data;
      if (res.ok) {
        toast.success('Workflow deleted');
        setWorkflows(workflows.filter((wf) => wf._id !== id));
      } else {
        toast.error(data.message || 'Delete failed');
      }
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

      toast.success(`Workflow ${newStatus === 'active' ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error('Server error');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>
      <h2>{orgName} Client Portal</h2>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/profile')} style={{ marginRight: '10px' }}>My Profile</button>
        {['client_admin', 'client_editor'].includes(role) && (
          <>
            <button onClick={() => navigate('/client/workflows')} style={{ marginRight: '10px' }}>Manage Workflows</button>
            <button onClick={() => navigate(`/org/${orgId}/users`)} style={{ marginRight: '10px' }}>User Management</button>
          </>
        )}
        <button onClick={logout}>Logout</button>
      </div>

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