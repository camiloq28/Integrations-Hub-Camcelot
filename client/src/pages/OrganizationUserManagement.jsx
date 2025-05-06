import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function OrganizationUserManagement() {
  const { orgId: paramOrgId } = useParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [orgName, setOrgName] = useState('');
  const [orgPlan, setOrgPlan] = useState('');
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
        setOrgPlan(data.planId || '');
        setOrgIntegrations(data.allowedIntegrations || []);
      })
      .catch(err => {
        console.error(err);
        toast.error('Failed to fetch users.');
      });

    fetch('/api/admin/plans', {
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

  const updateOrgPlan = async (newPlanId) => {
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planId: newPlanId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Organization plan updated');
        setOrgPlan(data.planId);
        setOrgIntegrations(data.allowedIntegrations || []);
      } else {
        toast.error(data.message || 'Failed to update plan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Server error updating plan');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>
      <h2>{orgName || 'Organization'} Users</h2>

      {(role === 'admin' || role === 'platform_editor') && (
        <>
          <div style={{ marginBottom: '20px' }}>
            <label><strong>Plan:</strong></label>
            <select value={orgPlan} onChange={(e) => updateOrgPlan(e.target.value)}>
              <option value="">Select a Plan</option>
              {availablePlans.map(plan => (
                <option key={plan._id} value={plan._id}>{plan.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label><strong>Allowed Integrations:</strong></label>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {orgIntegrations.map(integration => (
                <span key={integration} style={{ marginRight: '15px' }}>✅ {integration}</span>
              ))}
            </div>
          </div>
        </>
      )}

      <button onClick={() => navigate('/users')} style={{ marginTop: '30px' }}>
        Back
      </button>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default OrganizationUserManagement;
