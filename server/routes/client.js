const express = require('express');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Plan = require('../models/Plan');
const Workflow = require('../models/Workflow');

const router = express.Router();

// ✅ Welcome route with org name and populated plan
router.get('/portal', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user || !user.orgId) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    const org = await Organization.findById(user.orgId).populate('plan');
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.json({
      orgName: org.name,
      orgId: org._id,
      orgCode: org.orgId,
      planName: org.plan?.name || 'None',
      allowedIntegrations: org.plan?.integrations || [],
      enabledFeatures: org.enabledFeatures || []
    });
  } catch (err) {
    console.error('Error fetching client portal data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Save workflow
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

// ✅ Get single workflow for editing
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

// ✅ Update existing workflow
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

// [All other routes remain unchanged]

module.exports = router;


// ✅ Get workflows for current org
router.get('/workflows', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const workflows = await Workflow.find({ orgId: user.orgId });
    res.json({ workflows });
  } catch (err) {
    console.error('Error fetching workflows:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Enable workflow
router.post('/workflows/:id/enable', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    workflow.status = 'active';
    await workflow.save();
    res.json({ message: 'Workflow enabled' });
  } catch (err) {
    console.error('Enable workflow error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Disable workflow
router.post('/workflows/:id/disable', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    workflow.status = 'inactive';
    await workflow.save();
    res.json({ message: 'Workflow disabled' });
  } catch (err) {
    console.error('Disable workflow error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Delete a workflow
router.delete('/workflows/:id', protect, hasRole('client_admin'), async (req, res) => {
  try {
    await Workflow.findByIdAndDelete(req.params.id);
    res.json({ message: 'Workflow deleted.' });
  } catch (err) {
    console.error('Error deleting workflow:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Get client allowed + enabled integrations (updated with fallback)
router.get('/integrations', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.orgId) {
      return res.status(404).json({ message: 'User or organization not found.' });
    }

    const org = await Organization.findById(user.orgId).populate('plan');
    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    const allowed = org.plan?.integrations || [];

    res.json({
      allowed,
      enabled: user.integrations || []
    });
  } catch (err) {
    console.error('Error fetching client integrations:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Save client enabled integrations
router.post('/integrations', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { integrations } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { integrations },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'Integrations updated.', integrations: user.integrations });
  } catch (err) {
    console.error('Error updating integrations:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Profile - Get client profile details
router.get('/profile', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('orgId');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organization: user.orgId?.name || ''
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Profile - Update client profile
router.post('/profile', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const { firstName, lastName, organization } = req.body;

    const user = await User.findById(req.user._id).populate('orgId');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    if (organization && user.orgId) {
      const org = await Organization.findById(user.orgId);
      if (org) {
        org.name = organization;
        await org.save();
      }
    }

    await user.save();

    res.json({ message: 'Profile updated.' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Profile - Update password
router.post('/profile/password', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(req.user._id, { password: hashedPassword });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Client Admin: Create new user within own organization
router.post('/users', protect, hasRole('client_admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!['client_admin', 'client_editor', 'client_viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for client user.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const creator = await User.findById(req.user._id);
    if (!creator) {
      return res.status(404).json({ message: 'Creating user not found.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
      role,
      firstName,
      lastName,
      orgId: creator.orgId
    });

    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    console.error('Error creating client user:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Client Admin: Get users in their organization
router.get('/users', protect, hasRole('client_admin'), async (req, res) => {
  try {
    const clientAdmin = await User.findById(req.user._id);
    if (!clientAdmin || !clientAdmin.orgId) {
      return res.status(403).json({ message: 'Unauthorized or no organization.' });
    }

    const users = await User.find({ orgId: clientAdmin.orgId }).select('-password');
    res.json({ users });
  } catch (err) {
    console.error('Error fetching client organization users:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Receive trigger from external system
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
        await runStep(step, payload);
      }
    }

    res.json({ message: `Executed ${workflows.length} workflows.` });
  } catch (err) {
    console.error('Error processing webhook:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

async function runStep(step, payload) {
  const { type, config } = step;

  switch (type) {
    case 'slack':
      console.log(`Sending Slack message to #${config.channel}: ${config.message}`);
      break;
    case 'gmail':
      console.log(`Sending Gmail to ${config.to}: ${config.subject}`);
      break;
    case 'log':
      console.log('Log Step:', config.message || payload);
      break;
    default:
      console.warn('Unknown step type:', type);
      throw new Error(`Unsupported step type: ${type}`);
  }
}

module.exports = router;
