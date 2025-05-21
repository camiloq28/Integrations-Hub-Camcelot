const express = require('express');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Plan = require('../models/Plan');
const Workflow = require('../models/Workflow');
const resolveTokens = require('../utils/resolveTokens');

const router = express.Router();

// ✅ Temporary test route to verify response format
router.get('/portal-debug', (req, res) => {
  console.log('✅ /portal-debug hit');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ test: 'ok', timestamp: new Date() }, null, 2));
});

// ✅ Client Portal Info
router.get('/portal', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const userId = req.user?._id;
    const token = req.headers.authorization || '(none)';
    console.log('🔐 Portal access - Token Header Received:', token);
    console.log('🔒 req.headers:', req.headers);
    console.log('🔍 Fetching portal for user:', userId);

    if (!userId) {
      console.warn('❌ No user ID on request');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user || !user.orgId) {
      console.warn('⚠️ No user/org found for portal');
      return res.status(404).json({ message: 'Organization not found' });
    }

    const org = await Organization.findById(user.orgId).populate('plan');
    if (!org) {
      console.warn('⚠️ Organization not found by ID:', user.orgId);
      return res.status(404).json({ message: 'Organization not found' });
    }

    const response = {
      orgName: org.name || 'N/A',
      orgId: org._id?.toString() || '',
      orgCode: org.orgId || '',
      planName: org.plan?.name || 'Unassigned',
      allowedIntegrations: Array.isArray(org.plan?.integrations) ? org.plan.integrations : [],
      enabledFeatures: Array.isArray(org.enabledFeatures) ? org.enabledFeatures : []
    };

    const responseText = JSON.stringify(response, null, 2);
    console.log('📦 Portal Response JSON:', responseText);

    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(responseText); // send() to avoid double-serialization issues
  } catch (err) {
    console.error('❌ Error fetching client portal data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});



// ✅ Create workflow
router.post('/workflows', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { name, trigger, steps, status } = req.body;

    if (!name || !trigger?.type || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ message: 'Name, trigger type, and steps are required.' });
    }

    const user = await User.findById(req.user._id);
    if (!user || !user.orgId) {
      return res.status(400).json({ message: 'Invalid user/org context.' });
    }

    const workflow = await Workflow.create({
      name,
      orgId: user.orgId,
      trigger,
      steps,
      status: status || 'inactive'
    });

    res.status(201).json({ message: 'Workflow created.', workflow });
  } catch (err) {
    console.error('Error saving workflow:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Get workflow for editing
router.get('/workflows/:id', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) return res.status(404).json({ message: 'Workflow not found.' });
    res.json({ workflow });
  } catch (err) {
    console.error('Error fetching workflow:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Update workflow
router.put('/workflows/:id', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { name, trigger, steps, status } = req.body;

    if (!name || !trigger?.type || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ message: 'Name, trigger type, and steps are required.' });
    }

    const workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      { name, trigger, steps, status },
      { new: true, runValidators: true }
    );

    if (!workflow) return res.status(404).json({ message: 'Workflow not found.' });

    res.json({ message: 'Workflow updated.', workflow });
  } catch (err) {
    console.error('Error updating workflow:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Webhook trigger processing
router.post('/webhook', async (req, res) => {
  const { triggerType, payload, orgId } = req.body;

  if (!triggerType || !orgId) {
    return res.status(400).json({ message: 'Missing triggerType or orgId' });
  }

  try {
    const workflows = await Workflow.find({ orgId, 'trigger.type': triggerType, status: 'active' });

    if (!workflows.length) {
      return res.status(200).json({ message: 'No workflows matched this trigger.' });
    }

    for (const workflow of workflows) {
      for (const step of workflow.steps) {
        const resolvedConfig = resolveTokens(step.config, payload);
        await runStep(step.type, resolvedConfig);
      }
    }

    res.json({ message: `Executed ${workflows.length} workflows.` });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Basic simulated step runner
async function runStep(type, config) {
  switch (type) {
    case 'slack':
      console.log(`Sending Slack message to #${config.channel}: ${config.message}`);
      break;
    case 'gmail':
      console.log(`Sending Gmail to ${config.to}: ${config.subject}`);
      break;
    case 'log':
      console.log('Log Step:', config.message);
      break;
    default:
      console.warn('Unknown step type:', type);
      throw new Error(`Unsupported step type: ${type}`);
  }
}


// GET enabled integrations for client organization
router.get('/integrations', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('orgId');
    if (!user || !user.orgId) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const enabled = user.orgId.enabledIntegrations || [];
    res.json({ enabled });
  } catch (err) {
    console.error('❌ Error fetching enabled integrations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST update enabled integrations for client organization
router.post('/integrations', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.orgId) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const org = await Organization.findById(user.orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    org.enabledIntegrations = req.body.integrations || [];
    await org.save();

    res.json({ message: 'Integrations updated successfully.' });
  } catch (err) {
    console.error('❌ Error saving enabled integrations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
