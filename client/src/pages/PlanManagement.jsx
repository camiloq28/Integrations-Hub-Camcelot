// /client/src/pages/PlanManagement.jsx

import { useEffect, useState } from 'react';
import axiosWithAuth from '../utils/axiosWithAuth';
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
  }, []);

  useEffect(() => {
    if (selectedIntegrations.length > 0) {
      fetchTriggerAndActions();
    } else {
      setAvailableTriggers([]);
      setAvailableActions([]);
    }
  }, [selectedIntegrations]);

  useEffect(() => {
    if (!editingPlan || availableTriggers.length === 0 || availableActions.length === 0) return;

    const matchedTriggers = [];
    const matchedActions = [];

    for (const integration of editingPlan.integrations) {
      const triggerMeta = availableTriggers.filter(t => t.integration === integration);
      const actionMeta = availableActions.filter(a => a.integration === integration);

      triggerMeta.forEach(t => {
        if ((editingPlan.allowedTriggers || []).includes(t.key)) matchedTriggers.push(t);
      });

      actionMeta.forEach(a => {
        if ((editingPlan.allowedActions || []).includes(a.key)) matchedActions.push(a);
      });
    }

    setSelectedTriggers(matchedTriggers);
    setSelectedActions(matchedActions);
  }, [availableTriggers, availableActions, editingPlan]);

  const fetchTriggerAndActions = async () => {
    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.get('/api/integrations/meta');
      const data = res.data;

      const filteredTriggers = [];
      const filteredActions = [];

      for (const integration of selectedIntegrations) {
        const triggerGroup = data.triggersByIntegration[integration] || { triggers: [] };
        const actionGroup = data.actionsByIntegration[integration] || { actions: [] };

        if (Array.isArray(triggerGroup.triggers)) {
          triggerGroup.triggers.forEach(trigger => filteredTriggers.push({ ...trigger, integration, id: `${integration}.${trigger.key}` }));
        }

        if (Array.isArray(actionGroup.actions)) {
          actionGroup.actions.forEach(action => filteredActions.push({ ...action, integration, id: `${integration}.${action.key}` }));
        }
      }

      setAvailableTriggers(filteredTriggers);
      setAvailableActions(filteredActions);
    } catch (err) {
      console.error('Error loading triggers/actions:', err);
      toast.error('Failed to fetch triggers or actions');
    }
  };

  const fetchIntegrations = async () => {
    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.get('/api/plan/integrations');
      setIntegrations(res.data.integrations || []);
    } catch (err) {
      console.error('Integration fetch error:', err);
      toast.error('Failed to fetch integrations');
    }
  };

  const fetchPlans = async () => {
    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.get('/api/plan/plans');
      setPlans(res.data.plans || []);
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
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.post('/api/plan/integrations', { name: newIntegration });
      if (res.status >= 200 && res.status < 300) {
        toast.success('Integration added');
        setNewIntegration('');
        fetchIntegrations();
      } else {
        toast.error(res.data.message);
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
      allowedTriggers: selectedTriggers.map(t => t.key),
      allowedActions: selectedActions.map(a => a.key)
    };

    const url = editingPlan ? `/api/plan/plans/${editingPlan._id}` : '/api/plan/plans';
    const method = editingPlan ? 'PUT' : 'POST';

    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth({ url, method, data: payload });

      if (res.status >= 200 && res.status < 300) {
        toast.success(editingPlan ? 'Plan updated' : 'Plan created');
        setNewPlanName('');
        setSelectedIntegrations([]);
        setShowPlanForm(false);
        setSelectedTriggers([]);
        setSelectedActions([]);
        setEditingPlan(null);
        fetchPlans();
      } else {
        toast.error(res.data.message || 'Failed to save plan');
      }
    } catch (err) {
      console.error('Save plan error:', err);
      toast.error('Server error saving plan');
    }
  };

  const deletePlan = async (id) => {
    try {
      const axiosAuth = axiosWithAuth();
      const res = await axiosAuth.delete(`/api/plan/plans/${id}`);
      if (res.status === 200) {
        toast.success('Plan deleted');
        fetchPlans();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error('Delete plan error:', err);
      toast.error('Server error deleting plan');
    }
  };

  const startEditPlan = (plan) => {
    setEditingPlan(plan);
    setNewPlanName(plan.name);
    setSelectedIntegrations(plan.integrations || []);
    setSelectedTriggers([]);
    setSelectedActions([]);
    setShowPlanForm(true);
  };

  return (
    <div style={{ maxWidth: '900px', margin: 'auto' }}>
      <button onClick={() => navigate('/admin')} style={{ marginBottom: '20px' }}>Back to Admin Dashboard</button>

      <h3>Manage Available Integrations</h3>
      <input
        value={newIntegration}
        onChange={(e) => setNewIntegration(e.target.value)}
        placeholder="Integration name"
      />
      <button onClick={addIntegration}>Add Integration</button>
      <ul>
        {integrations.map((i, idx) => (
          <li key={`integration-${i}-${idx}`}>{i}</li>
        ))}
      </ul>

      {!showPlanForm && (
        <button onClick={() => setShowPlanForm(true)}>Create New Plan</button>
      )}

      {showPlanForm && (
        <>
          <h3>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
          <input
            value={newPlanName}
            onChange={(e) => setNewPlanName(e.target.value)}
            placeholder="Plan Name"
          />

          <h4>Select Integrations</h4>
          {integrations.map((i, idx) => (
            <div key={`select-${i}-${idx}`}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedIntegrations.includes(i)}
                  onChange={() => toggleIntegration(i)}
                />
                {i}
              </label>
            </div>
          ))}

          {selectedIntegrations.length > 0 && (
            <>
              <h4>Select Triggers</h4>
              {availableTriggers.map((t) => (
                <div key={`trigger-${t.integration}-${t.key}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedTriggers.some(sel => sel.key === t.key && sel.integration === t.integration)}
                      onChange={() =>
                        setSelectedTriggers((prev) =>
                          prev.some(sel => sel.key === t.key && sel.integration === t.integration)
                            ? prev.filter(sel => sel.key !== t.key || sel.integration !== t.integration)
                            : [...prev, t]
                        )
                      }
                    />
                    [{t.integration}] {t.label}
                  </label>
                </div>
              ))}

              <h4>Select Actions</h4>
              {availableActions.map((a) => (
                <div key={`action-${a.integration}-${a.key}`}>
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedActions.some(sel => sel.key === a.key && sel.integration === a.integration)}
                      onChange={() =>
                        setSelectedActions((prev) =>
                          prev.some(sel => sel.key === a.key && sel.integration === a.integration)
                            ? prev.filter(sel => sel.key !== a.key || sel.integration !== a.integration)
                            : [...prev, a]
                        )
                      }
                    />
                    [{a.integration}] {a.label}
                  </label>
                </div>
              ))}
            </>
          )}

          <button onClick={savePlan}>Save Plan</button>
          <button onClick={() => setShowPlanForm(false)}>Cancel</button>
        </>
      )}

      <h3>Existing Plans</h3>
      <ul>
        {plans.map((plan) => (
          <li key={plan._id}>
            <strong>{plan.name}</strong> – {plan.integrations.join(', ')}
            <button onClick={() => startEditPlan(plan)} style={{ marginLeft: '10px' }}>Edit</button>
            <button onClick={() => deletePlan(plan._id)} style={{ marginLeft: '5px', color: 'red' }}>Delete</button>
          </li>
        ))}
      </ul>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default PlanManagement;
