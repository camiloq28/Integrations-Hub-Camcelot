import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function WorkflowBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('greenhouse.new_candidate');
  const [steps, setSteps] = useState([]);
  const [orgId, setOrgId] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const storedOrgId = localStorage.getItem('orgId');
    if (storedOrgId && token) {
      fetch(`/api/admin/orgs/by-custom-id/${storedOrgId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data._id) {
            setOrgId(data._id);
          }
        })
        .catch(err => console.error('❌ Error resolving orgId:', err));
    }
  }, [token]);

  useEffect(() => {
    if (id && token) {
      fetch(`/api/client/workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          const workflow = data.workflow;
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
  }, [id, token]);

  const addStep = () => {
    setSteps([...steps, { order: steps.length + 1, type: '', config: {} }]);
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...steps];
    newSteps[index].config = newSteps[index].config || {};
    if (field === 'type') {
      newSteps[index] = { ...newSteps[index], type: value };
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

    if (!orgId || !token) {
      console.error('❗ Missing id or token:', { id, token });
      return toast.error('Missing organization or token');
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
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`❌ ${method} failed:`, text);
        toast.error(`Error ${res.status}: ${text.slice(0, 100)}`);
        return;
      }

      const data = await res.json();
      toast.success(`Workflow ${id ? 'updated' : 'created'} successfully`);

      if (!id) {
        setName('');
        setTrigger('greenhouse.new_candidate');
        setSteps([]);
      }
    } catch (err) {
      console.error('❌ Exception during submission:', err);
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
          <option value="greenhouse.new_candidate">Greenhouse - New Candidate</option>
          <option value="greenhouse.new_hire">Greenhouse - New Hire</option>
          <option value="greenhouse.stage_change">Greenhouse - Stage Change</option>
        </select>
      </div>

      <h3>Steps</h3>
      {steps.map((step, index) => (
        <div key={index} style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
          <div>
            <label>Step Type:</label>
            <select value={step.type} onChange={(e) => updateStep(index, 'type', e.target.value)}>
              <option value="">Select</option>
              <option value="slack">Slack Message</option>
              <option value="log">Log Entry</option>
              <option value="email">Send Email</option>
            </select>
          </div>

          {step.type === 'slack' && (
            <>
              <input
                placeholder="Channel"
                value={step.config.channel || ''}
                onChange={(e) => updateStep(index, 'channel', e.target.value)}
              />
              <input
                placeholder="Message"
                value={step.config.message || ''}
                onChange={(e) => updateStep(index, 'message', e.target.value)}
              />
            </>
          )}

          {step.type === 'log' && (
            <input
              placeholder="Log Message"
              value={step.config.message || ''}
              onChange={(e) => updateStep(index, 'message', e.target.value)}
            />
          )}

          {step.type === 'email' && (
            <>
              <input
                placeholder="To Email"
                value={step.config.to || ''}
                onChange={(e) => updateStep(index, 'to', e.target.value)}
              />
              <input
                placeholder="Subject"
                value={step.config.subject || ''}
                onChange={(e) => updateStep(index, 'subject', e.target.value)}
              />
              <textarea
                placeholder="Body"
                value={step.config.body || ''}
                onChange={(e) => updateStep(index, 'body', e.target.value)}
              />
            </>
          )}

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
