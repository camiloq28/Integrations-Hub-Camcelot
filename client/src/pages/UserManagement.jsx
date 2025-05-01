
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserManagement() {
  const [users, setUsers] = useState([]);
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
  const role = localStorage.getItem('role');

  const isAdmin = role === 'admin';
  const canCreate = isAdmin || role === 'client_admin';

  // Fetch users from API
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

  useEffect(() => {
    if (!token) {
      toast.error('Unauthorized – redirecting to login.');
      navigate('/');
      return;
    }
    fetchUsers();
  }, [navigate, token]);

  // Handle new user creation
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

  // Start editing a user
  const startEdit = (user) => {
    setEditingUser(user);
    setEditFields({ firstName: user.firstName, lastName: user.lastName, role: user.role, status: user.status });
  };

  // Save edited user
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

  // Delete user
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

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>
      <h2>User Management</h2>

      {canCreate && (
        <>
          <h3>Create New User</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="First Name"
              value={newUser.firstName}
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            >
              {isAdmin && <option value="admin">Super Admin</option>}
              {isAdmin && <option value="platform_editor">Platform Editor</option>}
              {isAdmin && <option value="platform_viewer">Platform Viewer</option>}
              <option value="client_admin">Client Admin</option>
              <option value="client_editor">Client Editor</option>
              <option value="client_viewer">Client Viewer</option>
            </select>
            <button onClick={handleCreateUser}>Create</button>
          </div>
        </>
      )}

      <h3>User List</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
          {users.map((user, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
              <td>
                {editingUser?.email === user.email ? (
                  <>
                    <input
                      value={editFields.firstName}
                      onChange={(e) => setEditFields({ ...editFields, firstName: e.target.value })}
                      style={{ width: '90px' }}
                    />
                    <input
                      value={editFields.lastName}
                      onChange={(e) => setEditFields({ ...editFields, lastName: e.target.value })}
                      style={{ width: '90px', marginLeft: '5px' }}
                    />
                  </>
                ) : (
                  `${user.firstName} ${user.lastName}`
                )}
              </td>
              <td>{user.email}</td>
              <td>
                {editingUser?.email === user.email ? (
                  <select
                    value={editFields.role}
                    onChange={(e) => setEditFields({ ...editFields, role: e.target.value })}
                  >
                    <option value="client_admin">Client Admin</option>
                    <option value="client_editor">Client Editor</option>
                    <option value="client_viewer">Client Viewer</option>
                    {isAdmin && <option value="platform_editor">Platform Editor</option>}
                    {isAdmin && <option value="platform_viewer">Platform Viewer</option>}
                    {isAdmin && <option value="admin">Super Admin</option>}
                  </select>
                ) : (
                  user.role
                )}
              </td>
              <td>{user.orgId?.name || '-'}</td>
              <td>
                {editingUser?.email === user.email ? (
                  <select
                    value={editFields.status}
                    onChange={(e) => setEditFields({ ...editFields, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                ) : (
                  user.status
                )}
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
                      <button
                        onClick={() => deleteUser(user.email)}
                        style={{ marginLeft: '10px', backgroundColor: '#dc3545', color: 'white' }}
                      >
                        Delete
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={() => navigate(role === 'admin' ? '/admin' : '/client')}
        style={{ marginTop: '30px' }}
      >
        Back to Dashboard
      </button>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default UserManagement;
