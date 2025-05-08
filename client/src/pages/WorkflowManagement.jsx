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
      .catch((err) => {
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
    const action = currentStatus === 'active' ? 'disable' : 'enable';
    try {
      const res = await fetch(`/api/client/workflows/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const error = await res.text();
        console.error('Error response:', error);
        toast.error('Failed to toggle workflow');
        return;
      }

      toast.success(`Workflow ${action}d`);
      setWorkflows(workflows.map((wf) =>
        wf._id === id ? { ...wf, status: action === 'disable' ? 'inactive' : 'active' } : wf
      ));
    } catch (err) {
      console.error('Toggle error:', err);
      toast.error('Server error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto' }}>
      <h2>{orgName} Client Portal</h2>
      <button onClick={() => navigate('/profile')} style={{ marginRight: '10px' }}>My Profile</button>
      {['client_admin', 'client_editor'].includes(role) && (
        <button onClick={() => navigate('/client/workflows')}>Manage Workflows</button>
      )}
      {['client_admin', 'client_editor'].includes(role) && (
        <button onClick={() => navigate(`/org/${orgId}/users`)} style={{ marginRight: '10px' }}>User Management</button>
      )}
      <button onClick={logout}>Logout</button>

      <h2>Workflow Management</h2>
      <button onClick={() => navigate('/create-workflow')}>Create Workflow</button>

      {loading ? (
        <p>Loading...</p>
      ) : workflows.length === 0 ? (
        <p>No workflows found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf) => (
              <tr key={wf._id}>
                <td>{wf.name}</td>
                <td>{wf.trigger.type}</td>
                <td>{wf.status}</td>
                <td>
                  <button onClick={() => toggleStatus(wf._id, wf.status)}>
                    {wf.status === 'active' ? 'Disable' : 'Enable'}
                  </button>
                  <Link to={`/client/workflows/edit/${wf._id}`} style={{ marginLeft: '10px' }}>Edit</Link>
                  <button onClick={() => deleteWorkflow(wf._id)} style={{ marginLeft: '10px' }}>
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
