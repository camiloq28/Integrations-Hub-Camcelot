const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const { protect } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');

// ✅ Create a new workflow
router.post('/', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { name, trigger, steps } = req.body;

    if (!name || !trigger || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({ message: 'Missing required fields: name, trigger, steps[]' });
    }

    const workflow = new Workflow({
      name,
      orgId: req.user.orgId,
      trigger,
      steps
    });

    await workflow.save();
    res.status(201).json({ message: 'Workflow created', workflow });
  } catch (err) {
    console.error('❌ Error saving workflow:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get all workflows for the current organization
router.get('/client/workflows', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    console.log('🔐 Authenticated user:', req.user);

    const orgId = req.user?.orgId;
    if (!orgId) {
      console.warn('⚠️ Missing orgId on authenticated user');
      return res.status(400).json({ message: 'Missing organization ID on user' });
    }

    console.log('🔍 Fetching workflows for orgId:', orgId);
    const workflows = await Workflow.find({ orgId });

    console.log(`📦 Found ${workflows.length} workflows`);
    res.json({ workflows });
  } catch (err) {
    console.error('❌ Error fetching client workflows:', err);
    res.status(500).json({ message: 'Failed to load workflows' });
  }
});

// ✅ Toggle workflow status (enable/disable)
router.post('/client/workflows/:id', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value.' });
    }

    const workflow = await Workflow.findOne({ _id: id, orgId: req.user.orgId });
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found or unauthorized' });
    }

    workflow.status = status;
    await workflow.save();

    res.json({ message: `Workflow ${status === 'active' ? 'enabled' : 'disabled'} successfully.`, workflow });
  } catch (err) {
    console.error('❌ Error updating workflow status:', err);
    res.status(500).json({ message: 'Server error while updating status.' });
  }
});

// ✅ Delete a workflow by ID for the current org
router.delete('/:id', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const workflow = await Workflow.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user.orgId
    });

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found or unauthorized' });
    }

    res.json({ message: 'Workflow deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting workflow:', err);
    res.status(500).json({ message: 'Failed to delete workflow' });
  }
});

module.exports = router;
