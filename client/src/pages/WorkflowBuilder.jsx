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
  const [trigger, setTrigger] = useState('');
  const [steps, setSteps] = useState([]);
  const [orgId, setOrgId] = useState('');
  const [availableActions, setAvailableActions] = useState({});
  const [availableTriggers, setAvailableTriggers] = useState([]);

  const axiosAuth = axiosWithAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const portalRes = await axiosAuth.get('/api/client/portal');
        const portalData = portalRes.data;
        setOrgId(portalData.orgId);

        const allowedActions = portalData.allowedActions || [];
        const allowedTriggers = portalData.allowedTriggers || [];
        const allowedIntegrations = portalData.allowedIntegrations || [];

        // Check which integrations are connected
        const connectedIntegrations = [];
        for (const integration of allowedIntegrations) {
          const slug = integration.toLowerCase().replace(/\s+/g, '-');
          try {
            await axiosAuth.get(`/api/integrations/${slug}/credentials`);
            connectedIntegrations.push(integration);
          } catch {
            // Integration not connected, skip it
          }
        }

        const metaRes = await axiosAuth.get('/api/integrations/meta');
        const { actionsByIntegration, triggersByIntegration } = metaRes.data;

        const filteredActions = {};
        for (const [integration, meta] of Object.entries(actionsByIntegration)) {
          // Only include integrations that are both allowed and connected
          if (!connectedIntegrations.includes(integration)) continue;

          const filtered = meta.actions.filter(action =>
            allowedActions.includes(`${integration}.${action.key}`)
          );
          if (filtered.length) filteredActions[integration] = { actions: filtered };
        }

        const filteredTriggers = [];
        for (const [integration, meta] of Object.entries(triggersByIntegration)) {
          // Only include integrations that are both allowed and connected
          if (!connectedIntegrations.includes(integration)) continue;

          const filtered = meta.triggers.filter(trigger =>
            allowedTriggers.includes(`${integration}.${trigger.key}`)
          ).map(trigger => ({ ...trigger, integration }));
          filteredTriggers.push(...filtered);
        }

        setAvailableActions(filteredActions);
        setAvailableTriggers(filteredTriggers);
      } catch (err) {
        console.error('❌ Error loading metadata or portal:', err);
      }
    };

    fetchData();
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
            setSteps(Array.isArray(workflow.steps) ? workflow.steps : []);
          }
        })
        .catch(() => toast.error('Failed to load workflow'));
    }
  }, [id]);

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, type: '', config: {} }]);
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    if (field === 'type') {
      const [integration, action] = value.split('.');
      newSteps[index] = {
        type: value,
        integration,
        action,
        config: {},
        order: index
      };
    } else {
      if (!newSteps[index].config) newSteps[index].config = {};
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

    if (!orgId) return toast.error('Missing organization');

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
      await axiosAuth[method](url, payload);
      toast.success(`Workflow ${id ? 'updated' : 'created'} successfully`);
      if (!id) {
        setName('');
        setTrigger('');
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
              {t.integration} - {t.label || t.key}
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