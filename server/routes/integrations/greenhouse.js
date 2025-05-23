const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { hasRole } = require('../../middleware/roleMiddleware');

const IntegrationCredential = require('../../models/IntegrationCredential');
const getIntegrationCredentials = require('../../utils/getIntegrationCredentials');
const axios = require('axios');

const getAuthHeader = (token) => ({
  headers: {
    Authorization: `Basic ${Buffer.from(`${token}:`).toString('base64')}`,
    'Content-Type': 'application/json'
  }
});

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

// ✅ Test Greenhouse Token via POST
router.post('/test', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'greenhouse'
    });

    if (!credential || !credential.accessToken) {
      return res.status(400).json({ message: 'No Greenhouse access token found' });
    }

    const ghResponse = await axios.get('https://harvest.greenhouse.io/v1/users', getAuthHeader(credential.accessToken));
    res.json({ success: true, user: ghResponse.data });
  } catch (error) {
    console.error('❌ Error testing Greenhouse token:', error);
    res.status(500).json({ message: 'Server error during token test' });
  }
});

// ✅ Fetch Greenhouse job listings
router.get('/jobs', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'greenhouse'
    });

    if (!credential || !credential.accessToken) {
      return res.status(400).json({ message: 'No Greenhouse access token found' });
    }

    const ghResponse = await axios.get('https://harvest.greenhouse.io/v1/jobs', getAuthHeader(credential.accessToken));
    res.status(200).json(ghResponse.data);
  } catch (error) {
    console.error('❌ Error fetching Greenhouse jobs:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown error';
    res.status(status).json({ message: `Failed to fetch Greenhouse jobs: ${message}` });
  }
});

// ✅ Fetch Greenhouse candidates
router.get('/candidates', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'greenhouse'
    });

    if (!credential || !credential.accessToken) {
      return res.status(400).json({ message: 'No Greenhouse access token found' });
    }

    const ghResponse = await axios.get('https://harvest.greenhouse.io/v1/candidates', getAuthHeader(credential.accessToken));
    res.status(200).json(ghResponse.data);
  } catch (error) {
    console.error('❌ Error fetching Greenhouse candidates:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown error';
    res.status(status).json({ message: `Failed to fetch Greenhouse candidates: ${message}` });
  }
});

// ✅ Fetch Greenhouse applications
router.get('/applications', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'greenhouse'
    });

    if (!credential || !credential.accessToken) {
      return res.status(400).json({ message: 'No Greenhouse access token found' });
    }

    const ghResponse = await axios.get('https://harvest.greenhouse.io/v1/applications', getAuthHeader(credential.accessToken));
    res.status(200).json(ghResponse.data);
  } catch (error) {
    console.error('❌ Error fetching Greenhouse applications:', error);
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || error.message || 'Unknown error';
    res.status(status).json({ message: `Failed to fetch Greenhouse applications: ${message}` });
  }
});

// ✅ Simulate triggers (placeholder for webhook overview)
router.get('/triggers', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    res.status(200).json([
      { id: 'trigger-1', name: 'New Candidate Created' },
      { id: 'trigger-2', name: 'Candidate Stage Change' },
      { id: 'trigger-3', name: 'New Application Submitted' },
      { id: 'trigger-4', name: 'Interview Scheduled' }
    ]);
  } catch (error) {
    console.error('❌ Error fetching Greenhouse triggers:', error);
    res.status(500).json({ message: 'Failed to fetch Greenhouse triggers' });
  }
});

// ✅ Fetch Greenhouse offers
router.get('/offers', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({ orgId: req.user.orgId, integration: 'greenhouse' });
    if (!credential?.accessToken) return res.status(400).json({ message: 'No Greenhouse access token found' });

    const response = await axios.get('https://harvest.greenhouse.io/v1/offers', getAuthHeader(credential.accessToken));
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Error fetching Greenhouse offers:', error);
    res.status(500).json({ message: 'Failed to fetch Greenhouse offers' });
  }
});

// ✅ Fetch Greenhouse departments
router.get('/departments', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({ orgId: req.user.orgId, integration: 'greenhouse' });
    if (!credential?.accessToken) return res.status(400).json({ message: 'No Greenhouse access token found' });

    const response = await axios.get('https://harvest.greenhouse.io/v1/departments', getAuthHeader(credential.accessToken));
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Error fetching Greenhouse departments:', error);
    res.status(500).json({ message: 'Failed to fetch Greenhouse departments' });
  }
});

// ✅ Fetch Greenhouse offices
router.get('/offices', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({ orgId: req.user.orgId, integration: 'greenhouse' });
    if (!credential?.accessToken) return res.status(400).json({ message: 'No Greenhouse access token found' });

    const response = await axios.get('https://harvest.greenhouse.io/v1/offices', getAuthHeader(credential.accessToken));
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Error fetching Greenhouse offices:', error);
    res.status(500).json({ message: 'Failed to fetch Greenhouse offices' });
  }
});

// ✅ Fetch Greenhouse custom fields (jobs)
router.get('/custom_fields', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const credential = await IntegrationCredential.findOne({ orgId: req.user.orgId, integration: 'greenhouse' });
    if (!credential?.accessToken) return res.status(400).json({ message: 'No Greenhouse access token found' });

    const response = await axios.get('https://harvest.greenhouse.io/v1/custom_fields/job', getAuthHeader(credential.accessToken));
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Error fetching Greenhouse custom fields:', error);
    res.status(500).json({ message: 'Failed to fetch Greenhouse custom fields' });
  }
});

module.exports = router;
