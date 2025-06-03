// /server/routes/admin.js

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
      let planId = null;
      let allowedTriggers = [];
      let allowedActions = [];

      if (org.plan && typeof org.plan === 'string' && org.plan.match(/^[a-f\d]{24}$/i)) {
        const fullPlan = await Plan.findById(org.plan);
        if (fullPlan) {
          planName = fullPlan.name;
          planId = fullPlan._id;
          allowedTriggers = fullPlan.allowedTriggers || [];
          allowedActions = fullPlan.allowedActions || [];
        }
      }

      return {
        _id: org._id,
        name: org.name,
        orgId: org.orgId,
        plan: planId || org.plan,
        planName: planName || 'starter',
        allowedIntegrations: org.allowedIntegrations || [],
        allowedTriggers,
        allowedActions,
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

// Get org by custom string orgId (e.g. ORG002)
router.get('/orgs/by-custom-id/:orgId', protect, hasRole('admin', 'platform_editor', 'client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const org = await Organization.findOne({ orgId: req.params.orgId });
    if (!org) return res.status(404).json({ message: 'Organization not found.' });

    let fullPlan = null;
    if (org.plan && typeof org.plan === 'string' && org.plan.match(/^[a-f\d]{24}$/i)) {
      fullPlan = await Plan.findById(org.plan);
    }

    res.json({
      orgName: org.name,
      orgId: org._id,
      orgCode: org.orgCode,
      plan: fullPlan ? fullPlan._id : null,
      planName: fullPlan ? fullPlan.name : org.plan,
      allowedIntegrations: fullPlan ? fullPlan.integrations : org.allowedIntegrations || [],
      allowedTriggers: fullPlan ? fullPlan.allowedTriggers || [] : [],
      allowedActions: fullPlan ? fullPlan.allowedActions || [] : []
    });
  } catch (err) {
    console.error('Error resolving orgId:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update an organization's plan
router.post('/orgs/:orgId/plan', protect, hasRole('admin', 'platform_editor'), async (req, res) => {
  const { plan } = req.body;
  const { orgId } = req.params;

  if (!plan) {
    return res.status(400).json({ message: 'Missing planId.' });
  }

  try {
    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    org.plan = plan; // Save the plan _id
    await org.save();

    // Fetch updated plan details
    const populatedPlan = await Plan.findById(plan);
    if (!populatedPlan) {
      return res.status(404).json({ message: 'Plan not found after update.' });
    }

    res.json({
      message: 'Plan updated successfully.',
      plan: populatedPlan,
      allowedIntegrations: populatedPlan.integrations || []
    });
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({ message: 'Server error.' });
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

module.exports = router;
