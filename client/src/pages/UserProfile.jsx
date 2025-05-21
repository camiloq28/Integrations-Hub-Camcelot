import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function UserProfile() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    if (!token || !storedRole) {
      toast.error('Unauthorized – redirecting to login.');
      navigate('/');
      return;
    }

    setRole(storedRole);

    const profileUrl = `/api/users/profile`;

    fetch(profileUrl, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async res => {
        const raw = await res.text();
        try {
          const data = JSON.parse(raw);
          console.log('📦 Parsed profile JSON:', data);

          setEmail(data.email || '');
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setOrganization(data.organization || '');
        } catch (e) {
          console.error('❌ Failed to parse profile JSON. Raw response:', raw);
          toast.error('Error loading profile.');
        }
      })
      .catch(err => {
        console.error('❌ Fetch error:', err);
        toast.error('Failed to load profile.');
      });
  }, [navigate]);

  const handleChangePassword = async () => {
    const token = localStorage.getItem('token');

    if (!password || password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await fetch(`/api/users/profile/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Password updated successfully.');
        setPassword('');
      } else {
        toast.error(data.message || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while updating password.');
    }
  };

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`/api/users/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ firstName, lastName, organization })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Profile updated successfully.');
        localStorage.setItem('firstName', firstName);
        localStorage.setItem('lastName', lastName);
        localStorage.setItem('organization', organization);
      } else {
        toast.error(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error while updating profile.');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  const goBack = () => {
    if (role === 'admin' || role === 'platform_editor' || role === 'platform_viewer') {
      navigate('/admin');
    } else {
      navigate('/client');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: 'auto' }}>
      <h2>User Profile</h2>

      <p><strong>Email:</strong> {email}</p>

      <label>First Name</label>
      <input
        type="text"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        style={{ width: '100%', marginBottom: '10px' }}
      />

      <label>Last Name</label>
      <input
        type="text"
        value={lastName}
        onChange={e => setLastName(e.target.value)}
        style={{ width: '100%', marginBottom: '10px' }}
      />

      <label>Organization</label>
      <input
        type="text"
        value={organization}
        onChange={e => setOrganization(e.target.value)}
        style={{ width: '100%', marginBottom: '20px' }}
      />

      <button onClick={handleUpdateProfile} style={{ width: '100%', marginBottom: '20px' }}>
        Save Profile
      </button>

      <h4>Change Password</h4>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <button onClick={handleChangePassword} style={{ width: '100%' }}>
        Update Password
      </button>

      <button onClick={goBack} style={{ marginTop: '20px', width: '100%' }}>
        Back to Dashboard
      </button>

      <button onClick={logout} style={{ marginTop: '10px', width: '100%' }}>
        Logout
      </button>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default UserProfile;
