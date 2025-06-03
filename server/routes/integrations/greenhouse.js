// /server/integrations/greenhouse.js

const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { hasRole } = require('../../middleware/roleMiddleware');

const IntegrationCredential = require('../../models/IntegrationCredential');
const axios = require('axios');

const getAuthHeader = (token) => ({
  headers: {
    Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
    'Content-Type': 'application/json'
  }
});

// Save Greenhouse API credentials
router.post('/config', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    if (!req.user?.orgId) return res.status(401).json({ message: 'Unauthorized' });
    const { accessToken, expiresAt } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Missing access token' });

    const saved = await IntegrationCredential.findOneAndUpdate(
      { orgId: req.user.orgId, integration: 'greenhouse' },
      {
        accessToken,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        updatedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ message: 'Greenhouse credentials saved', data: saved });
  } catch (err) {
    console.error('❌ Save error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get Greenhouse credentials
router.get('/credentials', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
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
    console.error('❌ Get credentials error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Status check
router.get('/status', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const creds = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'greenhouse'
    });
    res.status(200).json({
      connected: !!creds?.accessToken,
      credentials: creds?.accessToken ? { accessToken: creds.accessToken } : null
    });
  } catch (err) {
    console.error('❌ Status check error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Token test
router.post('/test', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({ orgId: req.user.orgId, integration: 'greenhouse' });
    if (!credential?.accessToken) return res.status(400).json({ message: 'No token' });

    const ghResponse = await axios.get('https://harvest.greenhouse.io/v1/users', getAuthHeader(credential.accessToken));
    res.json({ success: true, user: ghResponse.data });
  } catch (error) {
    console.error('❌ Token test error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Dynamic endpoint generator
const createGHGetRoute = (path, endpoint) => {
  router.get(path, protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
    try {
      const credential = await IntegrationCredential.findOne({ orgId: req.user.orgId, integration: 'greenhouse' });
      if (!credential?.accessToken) return res.status(400).json({ message: 'No token' });

      const response = await axios.get(`https://harvest.greenhouse.io/v1/${endpoint}`, getAuthHeader(credential.accessToken));
      res.status(200).json(response.data);
    } catch (error) {
      console.error(`❌ Error fetching ${endpoint}:`, error);
      res.status(500).json({ message: `Failed to fetch ${endpoint}` });
    }
  });
};

// Common endpoints
createGHGetRoute('/jobs', 'jobs');
createGHGetRoute('/candidates', 'candidates');
createGHGetRoute('/applications', 'applications');
createGHGetRoute('/offers', 'offers');
createGHGetRoute('/departments', 'departments');
createGHGetRoute('/offices', 'offices');
createGHGetRoute('/custom_fields', 'custom_fields/job');

// Sample triggers (for frontend testing or static UI render)
router.get('/triggers', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (_, res) => {
  res.status(200).json([
    { id: 'trigger-1', name: 'New Candidate Created' },
    { id: 'trigger-2', name: 'Candidate Stage Change' },
    { id: 'trigger-3', name: 'New Application Submitted' },
    { id: 'trigger-4', name: 'Interview Scheduled' }
  ]);
});

module.exports = router;
