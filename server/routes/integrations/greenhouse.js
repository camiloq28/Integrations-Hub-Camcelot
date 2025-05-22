// /server/routes/integrations/greenhouse.js

const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { hasRole } = require('../../middleware/roleMiddleware');

const IntegrationCredential = require('../../models/IntegrationCredential');
const getIntegrationCredentials = require('../../utils/getIntegrationCredentials');

// ✅ Save Greenhouse API credentials
router.post('/config', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    if (!req.user || !req.user.orgId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user/org context' });
    }

    const { accessToken, expiresAt } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Missing access token' });
    }

    const filter = { orgId: req.user.orgId, integration: 'greenhouse' };
    const update = {
      accessToken,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      updatedAt: new Date()
    };
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const saved = await IntegrationCredential.findOneAndUpdate(filter, update, options);
    console.log(`✅ Greenhouse credentials saved for orgId: ${req.user.orgId}`);
    res.status(200).json({ message: 'Greenhouse credentials saved', data: saved });
  } catch (err) {
    console.error('❌ Error saving Greenhouse credentials:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Get current Greenhouse credentials
router.get('/credentials', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    if (!req.user || !req.user.orgId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user/org context' });
    }

    const creds = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'greenhouse'
    });

    res.status(200).json({
      message: 'Success',
      token: creds?.accessToken || null,
      expiresAt: creds?.expiresAt || null
    });
  } catch (err) {
    console.error('❌ Error fetching Greenhouse credentials:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ✅ Health/status route for integration UI checks
router.get('/status', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    if (!req.user || !req.user.orgId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user/org context' });
    }

    const creds = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'greenhouse'
    });

    const isConnected = !!creds?.accessToken;

    res.status(200).json({
      connected: isConnected,
      credentials: isConnected ? { accessToken: creds.accessToken } : null
    });
  } catch (err) {
    console.error('❌ Error checking Greenhouse status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test Greenhouse Token
router.get('/test', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'Greenhouse'
    });

    if (!credential || !credential.token) {
      return res.status(400).json({ message: 'No Greenhouse token found' });
    }

    const ghResponse = await fetch('https://api.greenhouse.io/v1/users/me', {
      headers: {
        Authorization: `Basic ${Buffer.from(`${credential.token}:`).toString('base64')}`
      }
    });

    if (!ghResponse.ok) {
      return res.status(ghResponse.status).json({ message: 'Greenhouse API request failed' });
    }

    const data = await ghResponse.json();
    res.json({ success: true, user: data });
  } catch (error) {
    console.error('Error testing Greenhouse token:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
