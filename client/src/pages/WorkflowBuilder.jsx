// /client/src/pages/WorkflowBuilder.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import axiosWithAuth from '../utils/axiosWithAuth';
import 'react-toastify/dist/ReactToastify.css';

function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('greenhouse.new_candidate');
  const [steps, setSteps] = useState([]);
  const [orgId, setOrgId] = useState('');
  const [availableActions, setAvailableActions] = useState({});
  const [availableTriggers, setAvailableTriggers] = useState([]);

  const axiosAuth = axiosWithAuth();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const portalRes = await axiosAuth.get('/api/client/portal');
        const portalData = portalRes.data;
        console.log('📦 Portal Data:', portalData);
        setOrgId(portalData.orgId);

        const allowedActions = portalData.allowedActions || [];
        const allowedTriggers = portalData.allowedTriggers || [];

        const actionsRes = await axiosAuth.get('/api/integrations/actions');
        const grouped = actionsRes.data.actions.reduce((acc, action) => {
          if (!acc[action.integration]) acc[action.integration] = { actions: [] };
          acc[action.integration].actions.push(action);
          return acc;
        }, {});

        const allowedActionSet = new Set(allowedActions.map(String));

        const filtered = {};
        for (const [integration, meta] of Object.entries(grouped)) {
          const filteredActions = meta.actions.filter(action =>
            allowedActionSet.has(action.key)
          );
          if (filteredActions.length > 0) {
            filtered[integration] = { actions: filteredActions };
          }
        }

        console.log('✅ All Actions Grouped:', grouped);
        console.log('✅ Allowed Actions:', Array.from(allowedActionSet));
        console.log('✅ Filtered Actions:', filtered);

        Object.entries(filtered).forEach(([integration, meta]) => {
          meta.actions.forEach((action) => {
            console.log(`🔽 Rendering dropdown option for ${integration} - ${action.key}`);
          });
        });

        setAvailableActions(filtered);

        const triggersRes = await axiosAuth.get('/api/integrations/triggers');
        const filteredTriggers = triggersRes.data.triggers.filter(t =>
          allowedTriggers.includes(t.key)
        );
        console.log('✅ Allowed Triggers:', allowedTriggers);
        setAvailableTriggers(filteredTriggers);
      } catch (err) {
        console.error('❌ Error loading portal or plan:', err);
      }
    };

    fetchOrg();
  }, []);

  useEffect(() => {
    if (id) {
      axiosAuth.get(`/api/client/workflows/${id}`)
        .then(res => {
          const workflow = res.data.workflow;
          if (workflow) {
            setName(workflow.name || '');
            const { type, source } = workflow.trigger || {};
            if (type && source) setTrigger(`${source}.${type}`);
            else if (type) setTrigger(`greenhouse.${type}`);
            setSteps(Array.isArray(workflow.steps) ? workflow.steps : []);
          }
        })
        .catch(err => toast.error('Failed to load workflow'));
    }
  }, [id]);

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, type: '', config: {} }]);
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index].config = newSteps[index].config || {};
    if (field === 'type') {
      newSteps[index] = { ...newSteps[index], type: value, config: {} };
    } else {
      newSteps[index].config[field] = value;
    }
    setSteps(newSteps);
  };

  const removeStep = (index) => {
    const newSteps = steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, order: i + 1 }));
    setSteps(newSteps);
  };

  const handleSubmit = async () => {
    if (!name || !trigger || !steps.length || steps.some(step => !step.type || step.order == null)) {
      return toast.error('Please fill out all fields and ensure each step has a type and order');
    }

    if (!orgId) {
      return toast.error('Missing organization');
    }

    const payload = {
      name,
      orgId,
      trigger: {
        type: trigger.split('.')[1],
        source: trigger.split('.')[0]
      },
      steps
    };

    try {
      const url = id ? `/api/client/workflows/${id}` : '/api/client/workflows';
      const method = id ? 'put' : 'post';

      const res = await axiosAuth[method](url, payload);

      toast.success(`Workflow ${id ? 'updated' : 'created'} successfully`);

      if (!id) {
        setName('');
        setTrigger('greenhouse.new_candidate');
        setSteps([]);
      }
    } catch (err) {
      toast.error('Server error');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto' }}>
      <h2>{id ? 'Edit Workflow' : 'Create a New Workflow'}</h2>

      <div style={{ marginBottom: '15px' }}>
        <label><strong>Workflow Name:</strong></label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter workflow name"
          style={{ width: '100%', padding: '8px' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label><strong>Trigger:</strong></label>
        <select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
          <option value="">Select Trigger</option>
          {availableTriggers.map((t, idx) => (
            <option key={idx} value={`${t.integration}.${t.key}`}>
              {t.integration} - {t.label}
            </option>
          ))}
        </select>
      </div>

      {steps.map((step, index) => (
        <div key={index} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <label><strong>Step {index + 1}:</strong></label>
          <select
            value={step.type}
            onChange={(e) => updateStep(index, 'type', e.target.value)}
            style={{ display: 'block', marginBottom: '10px' }}
          >
            <option value="">Select Action</option>
            {Object.entries(availableActions).flatMap(([integration, meta]) =>
              meta.actions.map((action) => (
                <option
  key={`${integration}.${action.key}`}
  value={`${integration}.${action.key}`}
>
  {integration} - {action.label || action.key}
</option>
              ))
            )}
          </select>

          {(() => {
            const [integrationKey, actionKey] = step.type.split('.');
            const action = availableActions[integrationKey]?.actions?.find(a => a.key === actionKey);

            return action?.fields?.map(field => (
              <div key={field.name} style={{ marginBottom: '8px' }}>
                <label>{field.label}</label>
                <input
                  placeholder={field.label}
                  value={step.config[field.name] || ''}
                  onChange={(e) => updateStep(index, field.name, e.target.value)}
                  title="You can use dynamic tokens like {{candidate.first_name}}"
                  style={{ width: '100%', padding: '6px' }}
                />
                <small style={{ color: '#888' }}>Use tokens like <code>{'{candidate.first_name}'}</code></small>
              </div>
            ));
          })()}

          <button onClick={() => removeStep(index)} style={{ color: 'red', marginTop: '5px' }}>Remove Step</button>
        </div>
      ))}

      <button onClick={addStep}>+ Add Step</button>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleSubmit}>{id ? 'Save Changes' : 'Create Workflow'}</button>
        <button onClick={() => navigate('/client/workflows')} style={{ marginLeft: '10px' }}>Back to Workflows</button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default WorkflowBuilder;
