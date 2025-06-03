import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosWithAuth from '../utils/axiosWithAuth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [role, setRole] = useState('');
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'client_editor'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [editFields, setEditFields] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAdmin = role === 'admin';
  const isPlatform = role === 'platform_editor';

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
    if (!token || !storedRole) {
      toast.error('Unauthorized – redirecting to login.');
      navigate('/');
      return;
    }
    fetchUsers();
    fetchOrganizations();
    fetchPlans();
  }, [navigate, token]);

  const fetchUsers = () => {
    const axiosAuth = axiosWithAuth();
    axiosAuth.get('/api/users')
      .then(res => setUsers(res.data.users || []))
      .catch(err => {
        console.error(err);
        toast.error('Failed to fetch users.');
      });
  };

  const fetchOrganizations = () => {
    const axiosAuth = axiosWithAuth();
    axiosAuth.get('/api/admin/orgs')
      .then(res => setOrgs(res.data.orgs || []))
      .catch(err => {
        console.error(err);
        toast.error('Failed to fetch organizations.');
      });
  };

  const fetchPlans = () => {
    const axiosAuth = axiosWithAuth();
    axiosAuth.get('/api/plan/plans')
      .then(res => setPlans(res.data.plans || []))
      .catch(err => {
        console.error(err);
        toast.error('Failed to fetch plans');
      });
  };

  const handlePlanChange = async (orgId, newPlanId) => {
    if (!newPlanId) {
      toast.error('Missing planId');
      return;
    }

    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.post(`/api/admin/orgs/${orgId}/plan`, { plan: newPlanId });
      const data = res.data;
      if (res.status >= 200 && res.status < 300) {
        toast.success('Plan updated');
        fetchOrganizations();
      } else {
        toast.error(data.message || 'Failed to update plan');
      }
    } catch (err) {
      console.error('Error updating plan:', err);
      toast.error('Server error during update');
    }
  };

  const toggleStatus = async (email, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.put(`/api/users/${email}/status`, { status: newStatus });
      toast.success('Status updated');
      fetchUsers();
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
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.post('/api/users', newUser);
      toast.success('User created successfully');
      setNewUser({ firstName: '', lastName: '', email: '', password: '', role: 'client_editor' });
      fetchUsers();
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
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.put(`/api/users/${editingUser.email}`, editFields);
      toast.success('User updated');
      setEditingUser(null);
      setEditFields({});
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('Server error during update');
    }
  };

  const deleteUser = async (email) => {
    if (!window.confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.delete(`/api/users/${email}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error('Server error while deleting user');
    }
  };

  const platformRoles = ['admin', 'platform_editor', 'platform_viewer'];
  const platformUsers = users.filter(user => platformRoles.includes(user.role));

  return (
    <div style={{ maxWidth: '1100px', margin: 'auto' }}>
      <h2>User Management</h2>

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
          {isAdmin && <option value="admin">Super Admin</option>}
          {isAdmin && <option value="platform_editor">Platform Editor</option>}
          {isAdmin && <option value="platform_viewer">Platform Viewer</option>}
        </select>
        <button onClick={handleCreateUser}>Create</button>
      </div>

      <h3>Platform Users</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Organization</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {platformUsers.map((user, i) => (
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
                    <option value="admin">Super Admin</option>
                    <option value="platform_editor">Platform Editor</option>
                    <option value="platform_viewer">Platform Viewer</option>
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td>{user.orgId?.name || '-'}</td>
              <td>
                <button onClick={() => toggleStatus(user.email, user.status)} style={{ backgroundColor: user.status === 'active' ? 'green' : 'red', color: 'white', padding: '4px 10px', borderRadius: '5px', cursor: 'pointer' }}>
                  {user.status === 'active' ? 'Active' : 'Disabled'}
                </button>
              </td>
              <td>
                {editingUser?.email === user.email ? (
                  <>
                    <button onClick={handleSaveEdit}>Save</button>
                    <button onClick={() => setEditingUser(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => startEdit(user)}>Edit</button>
                    {user.role !== 'admin' && (
                      <button onClick={() => deleteUser(user.email)} style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}>Delete</button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Client Organizations</h3>
      {orgs.length === 0 ? (
        <p>No organizations found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th>Org Name</th>
              <th>Org ID</th>
              <th>User Count</th>
              <th>Plan</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org, i) => {
              const selectedPlan = plans.find(p => p._id === org.plan || p.name === org.plan)?._id || '';
              return (
                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                  <td>{org.name}</td>
                  <td>{org.orgId}</td>
                  <td>{org.userCount || 0}</td>
                  <td>
                    <select
                      value={selectedPlan}
                      onChange={(e) => handlePlanChange(org._id, e.target.value)}
                    >
                      {plans.map(plan => (
                        <option key={plan._id} value={plan._id}>{plan.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button onClick={() => navigate(`/org/${org._id}/users`)}>Manage</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <button onClick={() => navigate(role === 'admin' ? '/admin' : '/client')} style={{ marginTop: '30px' }}>
        Back to Dashboard
      </button>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default UserManagement;
