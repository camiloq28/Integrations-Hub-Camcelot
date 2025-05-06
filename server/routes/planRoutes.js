const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');
const Integration = require('../models/Integration');
const Plan = require('../models/Plan');

const router = express.Router();

// ✅ GET all integrations
router.get('/integrations', protect, hasRole('admin', 'platform_editor'), async (req, res) => {
  try {
    const integrations = await Integration.find();
    res.json({ integrations });
  } catch (err) {
    console.error('Failed to fetch integrations:', err);
    res.status(500).json({ message: 'Failed to fetch integrations' });
  }
});

// ✅ POST new integration
router.post('/integrations', protect, hasRole('admin', 'platform_editor'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Integration name is required' });

    const existing = await Integration.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Integration already exists' });

    const integration = await Integration.create({ name });
    res.status(201).json({ integration });
  } catch (err) {
    console.error('Failed to add integration:', err);
    res.status(500).json({ message: 'Failed to add integration' });
  }
});

// ✅ GET all plans
router.get('/plans', protect, hasRole('admin', 'platform_editor'), async (req, res) => {
  try {
    const plans = await Plan.find();
    res.json({ plans });
  } catch (err) {
    console.error('Failed to fetch plans:', err);
    res.status(500).json({ message: 'Failed to fetch plans' });
  }
});

// ✅ POST new plan
router.post('/plans', protect, hasRole('admin', 'platform_editor'), async (req, res) => {
  try {
    const { name, integrations } = req.body;
    if (!name || !Array.isArray(integrations)) {
      return res.status(400).json({ message: 'Plan name and integrations are required' });
    }

    const existing = await Plan.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Plan name already exists' });

    const plan = await Plan.create({ name, integrations });
    res.status(201).json({ plan });
  } catch (err) {
    console.error('Failed to create plan:', err);
    res.status(500).json({ message: 'Failed to create plan' });
  }
});

// ✅ PUT update plan
router.put('/plans/:id', protect, hasRole('admin', 'platform_editor'), async (req, res) => {
  try {
    const { name, integrations } = req.body;
    if (!name || !Array.isArray(integrations)) {
      return res.status(400).json({ message: 'Plan name and integrations are required' });
    }

    const updated = await Plan.findByIdAndUpdate(
      req.params.id,
      { name, integrations },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Plan not found' });

    res.json({ message: 'Plan updated', plan: updated });
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
