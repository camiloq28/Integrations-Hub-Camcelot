import { useEffect, useState } from 'react';
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
    const storedRole = localStorage.getItem('role');
    const storedOrgId = localStorage.getItem('orgId');
    const storedOrgName = localStorage.getItem('orgName');
    setRole(storedRole);
    setOrgId(storedOrgId);
    setOrgName(storedOrgName);
  }, []);

  useEffect(() => {
    fetch('/api/client/workflows', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setWorkflows(data.workflows || []);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to fetch workflows');
        setLoading(false);
      });
  }, [token]);

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const deleteWorkflow = async (id) => {
    if (!window.confirm('Delete this workflow?')) return;

    try {
      const res = await fetch(`/api/client/workflows/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
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

    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'enable' : 'disable'} this workflow?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/client/workflows/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Error response:', data);
        toast.error(data.message || 'Failed to toggle workflow');
        return;
      }

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
