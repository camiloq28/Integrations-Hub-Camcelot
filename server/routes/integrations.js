// /server/routes/integrations.js

const express = require('express');
const loadActions = require('../utils/loadActions');
const IntegrationCredential = require('../models/IntegrationCredential');
const { protect } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// 🔹 Load available integration actions
router.get('/actions', protect, hasRole('client_admin', 'client_editor', 'client_viewer', 'admin', 'platform_admin'), async (req, res) => {
  try {
    const { orgId } = req.user;
    const registry = loadActions();

    // Optionally filter based on plan in future
    const allActions = Object.entries(registry).flatMap(([integration, meta]) =>
      (meta.actions || []).map((action) => ({ integration, ...action }))
    );

    res.json({ actions: allActions });
  } catch (err) {
    console.error('Error loading actions:', err);
    res.status(500).json({ message: 'Failed to load actions' });
  }
});


// 🔹 Save or update credentials for an integration
router.post('/credentials', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  const { integration, accessToken, refreshToken, tokenType, expiresAt, metadata } = req.body;
  const orgId = req.user.orgId;

  if (!integration || !accessToken) {
    return res.status(400).json({ message: 'Missing integration or accessToken' });
  }

  try {
    const existing = await IntegrationCredential.findOne({ orgId, integration });

    if (existing) {
      existing.accessToken = accessToken;
      existing.refreshToken = refreshToken;
      existing.tokenType = tokenType;
      existing.expiresAt = expiresAt;
      existing.metadata = metadata;
      await existing.save();
    } else {
      await IntegrationCredential.create({
        orgId,
        integration,
        accessToken,
        refreshToken,
        tokenType,
        expiresAt,
        metadata
      });
    }

    res.json({ message: 'Credentials saved successfully' });
  } catch (err) {
    console.error('Error saving credentials:', err);
    res.status(500).json({ message: 'Server error saving credentials' });
  }
});

// 🔹 Fetch credentials for one integration
router.get('/credentials/:integration', protect, async (req, res) => {
  const { integration } = req.params;
  const orgId = req.user.orgId;

  try {
    const creds = await IntegrationCredential.findOne({ orgId, integration });
    if (!creds) return res.status(404).json({ message: 'No credentials found' });

    res.json(creds);
  } catch (err) {
    console.error('Error fetching credentials:', err);
    res.status(500).json({ message: 'Failed to fetch credentials' });
  }
});

// 🔹 Load available triggers based on integration and plan
router.get('/triggers', protect, hasRole('client_admin', 'client_editor', 'client_viewer', 'admin', 'platform_admin'), async (req, res) => {
  try {
    const { orgId } = req.user;

    // Load trigger registry
    const registry = loadActions();
    const allTriggers = Object.entries(registry).flatMap(([integration, meta]) =>
      (meta.triggers || []).map((trigger) => ({ integration, ...trigger }))
    );

    // Optional: Load plan to filter allowed triggers
    // const plan = await Plan.findOne({ orgId });
    // const allowed = plan?.allowedTriggers || [];

    res.json({ triggers: allTriggers });
  } catch (err) {
    console.error('Error loading triggers:', err);
    res.status(500).json({ message: 'Failed to load triggers' });
  }
});

// ✅ Mount meta route
router.use('/meta', require('./integrations/meta'));

// ✅ Mount modular metadata route
const metaRoutes = require('./integrations/meta');
router.use('/meta', metaRoutes);

// ✅ Mount integration-specific routes
router.use('/gmail', require('./integrations/gmail'));
router.use('/bamboohr', require('./integrations/bamboohr'));

module.exports = router;
