import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function PlanManagement() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState([]);
  const [plans, setPlans] = useState([]);
  const [newIntegration, setNewIntegration] = useState('');
  const [selectedIntegrations, setSelectedIntegrations] = useState([]);
  const [availableTriggers, setAvailableTriggers] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [selectedActions, setSelectedActions] = useState([]);
  const [newPlanName, setNewPlanName] = useState('');
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  useEffect(() => {
    fetchIntegrations();
    fetchPlans();
    fetchTriggerAndActions();
  }, []);

  const fetchTriggerAndActions = async () => {
    try {
      const token = localStorage.getItem('token');
      const [triggerRes, actionRes] = await Promise.all([
        fetch('/api/integrations/triggers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/integrations/actions', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const triggerData = await triggerRes.json();
      const actionData = await actionRes.json();
      setAvailableTriggers(triggerData.triggers || []);
      setAvailableActions(actionData.actions || []);
    } catch (err) {
      console.error('Error loading triggers/actions:', err);
      toast.error('Failed to fetch triggers or actions');
    }
  };

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/plan/integrations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setIntegrations(data.integrations || []);
    } catch (err) {
      console.error('Integration fetch error:', err);
      toast.error('Failed to fetch integrations');
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plan/plans', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Plan fetch error:', err);
      toast.error('Failed to fetch plans');
    }
  };

  const addIntegration = async () => {
    if (!newIntegration.trim()) {
      toast.error('Integration name cannot be empty');
      return;
    }
    try {
      const res = await fetch('/api/plan/integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name: newIntegration })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Integration added');
        setNewIntegration('');
        fetchIntegrations();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Add integration error:', err);
      toast.error('Server error adding integration');
    }
  };

  const toggleIntegration = (name) => {
    setSelectedIntegrations(prev =>
      prev.includes(name)
        ? prev.filter(i => i !== name)
        : [...prev, name]
    );
  };

  const savePlan = async () => {
    if (!newPlanName || selectedIntegrations.length === 0) {
      toast.error('Plan name and at least one integration required');
      return;
    }

    const payload = {
      name: newPlanName,
      integrations: selectedIntegrations,
      allowedTriggers: selectedTriggers,
      allowedActions: selectedActions
    };

    const url = editingPlan ? `/api/plan/plans/${editingPlan._id}` : '/api/plan/plans';
    const method = editingPlan ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(editingPlan ? 'Plan updated' : 'Plan created');
        setNewPlanName('');
        setSelectedIntegrations([]);
        setShowPlanForm(false);
        setSelectedTriggers([]);
        setSelectedActions([]);
        setEditingPlan(null);
        fetchPlans();
      } else {
        toast.error(data.message || 'Failed to save plan');
      }
    } catch (err) {
      console.error('Save plan error:', err);
      toast.error('Server error saving plan');
    }
  };

  const deletePlan = async (id) => {
    try {
      const res = await fetch(`/api/plan/plans/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Plan deleted');
        fetchPlans();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      console.error('Delete plan error:', err);
      toast.error('Server error deleting plan');
    }
  };

  const startEditPlan = (plan) => {
    setEditingPlan(plan);
    setNewPlanName(plan.name);
    setSelectedIntegrations(plan.integrations);
    setShowPlanForm(true);
    setSelectedTriggers(plan.allowedTriggers || []);
    setSelectedActions(plan.allowedActions || []);
  };

  return (
    <div style={{ maxWidth: '900px', margin: 'auto', padding: '20px' }}>
      <h2>Plan Management</h2>

      <button onClick={() => navigate('/admin')} style={{ marginTop: '10px', marginBottom: '20px' }}>Back to Admin Dashboard</button>

      {/* SECTION 1: Manage Integrations */}
      <section style={{ marginBottom: '50px' }}>
        <h3>Manage Available Integrations</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Integration name"
            value={newIntegration}
            onChange={e => setNewIntegration(e.target.value)}
          />
          <button onClick={addIntegration}>Add Integration</button>
        </div>
        {integrations.length === 0 ? (
          <p>No integrations added yet.</p>
        ) : (
          <ul>
            {integrations.map((i, idx) => (
              <li key={idx}>{i.name}</li>
            ))}
          </ul>
        )}
      </section>

      {/* SECTION 2: Plan Creation */}
      <section style={{ marginBottom: '50px' }}>
        <h3>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
        {!showPlanForm ? (
          <button onClick={() => setShowPlanForm(true)}>+ Create Plan</button>
        ) : (
          <div style={{ border: '1px solid #444', padding: '20px', borderRadius: '10px', background: '#111' }}>
            <input
              type="text"
              placeholder="Plan name"
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '15px' }}
            />
            <h4>Select Triggers</h4>
            {availableTriggers.map((trigger, idx) => (
              <label key={idx} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={selectedTriggers.includes(trigger.key)}
                  onChange={() => setSelectedTriggers(prev =>
                    prev.includes(trigger.key)
                      ? prev.filter(k => k !== trigger.key)
                      : [...prev, trigger.key]
                  )}
                />{' '}
                [{trigger.integration}] {trigger.label}
              </label>
            ))}

            <h4 style={{ marginTop: '20px' }}>Select Actions</h4>
            {availableActions.map((action, idx) => (
              <label key={idx} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={selectedActions.includes(action.key)}
                  onChange={() => setSelectedActions(prev =>
                    prev.includes(action.key)
                      ? prev.filter(k => k !== action.key)
                      : [...prev, action.key]
                  )}
                />{' '}
                [{action.integration}] {action.label}
              </label>
            ))}

            <h4>Select Integrations</h4>
            {integrations.map((integration, idx) => (
              <label key={idx} style={{ display: 'block', marginBottom: '5px' }}>
                <input
                  type="checkbox"
                  checked={selectedIntegrations.includes(integration.name)}
                  onChange={() => toggleIntegration(integration.name)}
                />{' '}
                {integration.name}
              </label>
            ))}
            <div style={{ marginTop: '15px' }}>
              <button onClick={savePlan}>{editingPlan ? 'Update Plan' : 'Save Plan'}</button>
              <button onClick={() => {
                setShowPlanForm(false);
                setNewPlanName('');
                setSelectedIntegrations([]);
                setEditingPlan(null);
              }} style={{ marginLeft: '10px' }}>Cancel</button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 3: Existing Plans */}
      <section>
        <h3>Existing Plans</h3>
        {plans.length === 0 ? (
          <p>No plans found.</p>
        ) : (
          <ul>
            {plans.map((plan, index) => (
              <li key={index}>
                <strong>{plan.name}:</strong> {plan.integrations.join(', ')}
                <button onClick={() => startEditPlan(plan)} style={{ marginLeft: '10px' }}>Edit</button>
                <button onClick={() => deletePlan(plan._id)} style={{ marginLeft: '10px', color: 'red' }}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default PlanManagement;
