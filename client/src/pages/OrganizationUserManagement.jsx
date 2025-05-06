import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function OrganizationUserManagement() {
  const { orgId: paramOrgId } = useParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [orgName, setOrgName] = useState('');
  const [orgPlan, setOrgPlan] = useState(null);
  const [orgIntegrations, setOrgIntegrations] = useState([]);
  const [role, setRole] = useState('');
  const [orgId, setOrgId] = useState('');
  const [availablePlans, setAvailablePlans] = useState([]);

  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'client_editor'
  });

  const [editingUser, setEditingUser] = useState(null);
  const [editFields, setEditFields] = useState({});

  const token = localStorage.getItem('token');

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const storedOrgId = localStorage.getItem('orgId');
    setRole(storedRole);

    const resolvedOrgId = (storedRole === 'admin' || storedRole === 'platform_editor') ? paramOrgId : storedOrgId;
    setOrgId(resolvedOrgId);

    if (!token) {
      toast.error('Unauthorized');
      navigate('/');
    }
  }, [paramOrgId, token, navigate]);

  useEffect(() => {
    if (!orgId || !token) return;

    fetch(`/api/admin/orgs/${orgId}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || []);
        setOrgName(data.orgName || '');
        const selectedPlan = availablePlans.find(p => p._id === data.plan || p.name === data.plan);
        setOrgPlan(selectedPlan || null);
        setOrgIntegrations(data.allowedIntegrations || []);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to fetch users.');
      });

    fetch('/api/plan/plans', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setAvailablePlans(data.plans || []))
      .catch(err => console.error('Error fetching plans:', err));
  }, [orgId, token]);

  const fetchUsers = () => {
    fetch(`/api/admin/orgs/${orgId}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(err => toast.error('Failed to reload users.'));
  };

  const updateOrgPlan = async (planId) => {
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan: planId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Organization plan updated');
        setOrgPlan(data.plan?._id || '');
        setOrgIntegrations(data.allowedIntegrations || []);
      } else {
        toast.error(data.message || 'Failed to update plan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error updating plan');
    }
  };

  const toggleStatus = async (email, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const res = await fetch(`/api/users/${email}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Status updated');
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.email === email ? { ...user, status: newStatus } : user
          )
        );
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while updating status');
    }
  };

  const handleCreateUser = async () => {
    const { firstName, lastName, email, password, role } = newUser;
    if (!firstName || !lastName || !email || !password || !role) {
      toast.error('All fields are required.');
      return;
    }

    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('User created successfully');
        setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'client_editor' });
        setUsers(prev => [...prev, data.user]);
      } else {
        toast.error(data.message || 'Failed to create user');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while creating user');
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setEditFields({ firstName: user.firstName, lastName: user.lastName, role: user.role });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editFields)
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('User updated');
        setEditingUser(null);
        setEditFields({});
        fetchUsers();
      } else {
        toast.error(data.message || 'Failed to update user');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error during update');
    }
  };

  const deleteUser = async (email) => {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const res = await fetch(`/api/users/${email}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setUsers(prev => prev.filter(u => u.email !== email));
      } else {
        toast.error(data.message || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while deleting user');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>
      <h2>{orgName || 'Organization'} Users</h2>

      {(role === 'admin' || role === 'platform_editor') && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label><strong>Plan:</strong></label>
            <select
              value={orgPlan?._id || ''}
              onChange={(e) => updateOrgPlan(e.target.value)}
              style={{ marginLeft: '10px' }}
            >
              {availablePlans.map(plan => (
                <option key={plan._id} value={plan._id}>
                  {plan.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label><strong>Plan Integrations:</strong></label>
            <ul style={{ paddingLeft: '20px' }}>
              {orgPlan?.integrations?.map(integration => (
                <li key={integration} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: '#4CAF50' }}>✓</span> {integration}
                </li>
              ))}
              {(!orgPlan?.integrations || orgPlan.integrations.length === 0) && (
                <li style={{ color: '#888' }}>No integrations available in this plan</li>
              )}
            </ul>
          </div>
        </>
      )}

      <h3>Create New User</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <input type="text" placeholder="First Name" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} />
        <input type="text" placeholder="Last Name" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} />
        <input type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
        <input type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
        <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
          <option value="client_admin">Client Admin</option>
          <option value="client_editor">Client Editor</option>
          <option value="client_viewer">Client Viewer</option>
        </select>
        <button onClick={handleCreateUser}>Create</button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td>
                {editingUser?.email === user.email ? (
                  <>
                    <input value={editFields.firstName} onChange={(e) => setEditFields({ ...editFields, firstName: e.target.value })} style={{ width: '90px' }} />
                    <input value={editFields.lastName} onChange={(e) => setEditFields({ ...editFields, lastName: e.target.value })} style={{ width: '90px', marginLeft: '5px' }} />
                  </>
                ) : (
                  `${user.firstName} ${user.lastName}`
                )}
              </td>
              <td>{user.email}</td>
              <td>
                {editingUser?.email === user.email ? (
                  <select value={editFields.role} onChange={(e) => setEditFields({ ...editFields, role: e.target.value })}>
                    <option value="client_admin">Client Admin</option>
                    <option value="client_editor">Client Editor</option>
                    <option value="client_viewer">Client Viewer</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td>
                <button onClick={() => toggleStatus(user.email, user.status)} style={{ backgroundColor: user.status === 'active' ? 'green' : 'red', color: 'white', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                  {user.status === 'active' ? 'Active' : 'Disabled'}
                </button>
              </td>
              <td>
                {(role === 'admin' || role === 'platform_editor' || role === 'client_admin') && (
                  editingUser?.email === user.email ? (
                    <>
                      <button onClick={handleSaveEdit}>Save</button>
                      <button onClick={() => setEditingUser(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(user)}>Edit</button>
                      <button onClick={() => deleteUser(user.email)} style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}>Delete</button>
                    </>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={() => navigate(role === 'admin' || role === 'platform_editor' ? '/users' : '/client')} style={{ marginTop: '30px' }}>
        Back
      </button>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default OrganizationUserManagement;
