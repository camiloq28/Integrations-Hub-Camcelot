const express = require('express');
const router = express.Router();
const Workflow = require('../models/Workflow');
const { protect } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');

// ✅ Create a new workflow
router.post('/', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { name, trigger, steps } = req.body;

    if (!name || !trigger || !steps?.length) {
      return res.status(400).json({ message: 'Missing required fields' });
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
    console.error('Error saving workflow:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get all workflows for the current organization
router.get('/', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const workflows = await Workflow.find({ orgId: req.user.orgId });
    res.json({ workflows });
  } catch (err) {
    console.error('Error fetching workflows:', err);
    res.status(500).json({ message: 'Failed to load workflows' });
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
    console.error('Error deleting workflow:', err);
    res.status(500).json({ message: 'Failed to delete workflow' });
  }
});

module.exports = router;
