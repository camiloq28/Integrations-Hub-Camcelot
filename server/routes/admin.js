const express = require('express');
const bcrypt = require('bcryptjs');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Plan = require('../models/Plan');

const router = express.Router();

// 📊 Get all organizations with user count, excluding "Camcelot"
router.get('/orgs', protect, adminOnly, async (req, res) => {
  try {
    const orgs = await Organization.find({ name: { $ne: 'Camcelot' } });

    const results = await Promise.all(orgs.map(async (org) => {
      const userCount = await User.countDocuments({ orgId: org._id });
      let planName = org.plan;
      if (org.plan && typeof org.plan === 'string' && org.plan.match(/^[a-f\d]{24}$/i)) {
        const fullPlan = await Plan.findById(org.plan);
        if (fullPlan) planName = fullPlan.name;
      }
      return {
        _id: org._id,
        name: org.name,
        orgId: org.orgId,
        plan: planName || 'starter',
        allowedIntegrations: org.allowedIntegrations || [],
        userCount
      };
    }));

    res.json({ orgs: results });
  } catch (err) {
    console.error('Error fetching organizations:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// 🔍 Get users by organization ID
router.get('/orgs/:orgId/users', protect, hasRole('admin', 'platform_editor', 'client_admin'), async (req, res) => {
  const { orgId } = req.params;

  try {
    const org = await Organization.findById(orgId).catch(() => null)
                || await Organization.findOne({ orgId });

    if (!org) return res.status(404).json({ message: 'Organization not found.' });

    const users = await User.find({ orgId: org._id });

    let allowedIntegrations = org.allowedIntegrations || [];
    let planName = org.plan || 'starter';

    if (org.plan && typeof org.plan === 'string' && org.plan.match(/^[a-f\d]{24}$/i)) {
      const fullPlan = await Plan.findById(org.plan);
      if (fullPlan) {
        planName = fullPlan.name;
        allowedIntegrations = fullPlan.integrations;
      }
    }

    res.json({
      users,
      orgName: org.name,
      plan: planName,
      allowedIntegrations
    });
  } catch (err) {
    console.error('Error fetching users by org:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// 🔧 Update organization plan
router.post('/orgs/:orgId/plan', protect, adminOnly, async (req, res) => {
  const { orgId } = req.params;
  const { planId } = req.body;

  if (!planId) return res.status(400).json({ message: 'Missing planId.' });

  try {
    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found.' });

    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found.' });

    org.plan = plan._id;
    org.allowedIntegrations = plan.integrations;
    await org.save();

    res.json({
      message: 'Organization plan updated.',
      plan: plan.name,
      allowedIntegrations: plan.integrations
    });
  } catch (err) {
    console.error('Error updating organization plan:', err);
    res.status(500).json({ message: 'Server error during organization update.' });
  }
});

// 🔧 Update allowed integrations manually
router.post('/orgs/:orgId/integrations', protect, adminOnly, async (req, res) => {
  const { orgId } = req.params;
  const { integrations } = req.body;

  if (!Array.isArray(integrations)) {
    return res.status(400).json({ message: 'Integrations must be an array.' });
  }

  try {
    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: 'Organization not found.' });

    org.allowedIntegrations = integrations;
    await org.save();

    res.json({
      message: 'Allowed integrations updated.',
      allowedIntegrations: org.allowedIntegrations
    });
  } catch (err) {
    console.error('Error updating integrations:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ... All other unchanged routes continue below
