// /server/routes/integrations.js

const express = require('express');
const loadActions = require('../utils/loadActions');
const IntegrationCredential = require('../models/IntegrationCredential');
const { protect } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// 🔹 Load available integration actions
router.get('/actions', (req, res) => {
  try {
    const integrations = loadActions();
    res.json({ integrations });
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

module.exports = router;
