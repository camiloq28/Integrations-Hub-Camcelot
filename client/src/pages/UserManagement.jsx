import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
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
  }, [navigate, token]);

  const fetchUsers = () => {
    fetch('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUsers(data.users || []))
      .catch(err => {
        console.error(err);
        toast.error('Failed to fetch users.');
      });
  };

  const fetchOrganizations = () => {
    fetch('/api/admin/orgs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setOrgs(data.orgs || []))
      .catch(err => {
        console.error(err);
        toast.error('Failed to fetch organizations.');
      });
  };

  const handlePlanChange = async (orgId, newPlan) => {
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ plan: newPlan })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Plan updated');
        fetchOrganizations();
      } else {
        toast.error(data.message || 'Failed to update plan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error during update');
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
        fetchUsers();
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
      const res = await fetch('/api/users', {
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
        fetchUsers();
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
        fetchUsers();
      } else {
        toast.error(data.message || 'Delete failed');
      }
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
            {orgs.map((org, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td>{org.name}</td>
                <td>{org.orgId}</td>
                <td>{org.userCount || 0}</td>
                <td>
                  <select value={org.plan || ''} onChange={(e) => handlePlanChange(org._id, e.target.value)}>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td>
                  <button onClick={() => navigate(`/org/${org._id}/users`)}>Manage</button>
                </td>
              </tr>
            ))}
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
