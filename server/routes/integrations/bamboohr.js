
const express = require('express');
const axios = require('axios');
const IntegrationCredential = require('../../models/IntegrationCredential');
const { protect } = require('../../middleware/authMiddleware');
const { hasRole } = require('../../middleware/roleMiddleware');

const router = express.Router();

// Helper function to create BambooHR API client
const createBambooHRClient = (apiKey, subdomain) => {
  return axios.create({
    baseURL: `https://api.bamboohr.com/api/gateway.php/${subdomain}/v1/`,
    headers: {
      'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });
};

// Save BambooHR API credentials
router.post('/config', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { accessToken, metadata } = req.body;
    const orgId = req.user.orgId;

    if (!accessToken || !metadata?.subdomain) {
      return res.status(400).json({ message: 'Missing API key or subdomain' });
    }

    await IntegrationCredential.findOneAndUpdate(
      { orgId, integration: 'bamboohr' },
      {
        accessToken,
        metadata,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'BambooHR credentials saved successfully' });
  } catch (err) {
    console.error('❌ BambooHR config save error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get BambooHR credentials
router.get('/credentials', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const creds = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'bamboohr'
    });

    if (!creds) {
      return res.status(404).json({ message: 'No BambooHR credentials found' });
    }

    // Return safe credentials (without API key)
    const safeCredentials = {
      integration: creds.integration,
      accessToken: creds.accessToken, // API key for form display
      createdAt: creds.createdAt,
      updatedAt: creds.updatedAt,
      metadata: creds.metadata
    };

    res.json(safeCredentials);
  } catch (err) {
    console.error('❌ Error fetching BambooHR credentials:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Test BambooHR connection
router.post('/test', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { apiKey, subdomain } = req.body;
    let testApiKey = apiKey;
    let testSubdomain = subdomain;

    // If no credentials provided in body, get from database
    if (!testApiKey || !testSubdomain) {
      const creds = await IntegrationCredential.findOne({
        orgId: req.user.orgId,
        integration: 'bamboohr'
      });

      if (!creds) {
        return res.status(404).json({ 
          success: false, 
          message: 'No BambooHR credentials found' 
        });
      }

      testApiKey = creds.accessToken;
      testSubdomain = creds.metadata?.subdomain;
    }

    if (!testApiKey || !testSubdomain) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing API key or subdomain' 
      });
    }

    // Test connection by getting company info
    const client = createBambooHRClient(testApiKey, testSubdomain);
    const response = await client.get('meta/users');

    res.json({ 
      success: true, 
      message: 'BambooHR connection is working',
      companyInfo: {
        subdomain: testSubdomain,
        usersCount: response.data?.length || 0
      }
    });
  } catch (err) {
    console.error('❌ BambooHR test error:', err);
    
    if (err.response?.status === 401) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid API key or unauthorized access' 
      });
    } else if (err.response?.status === 404) {
      res.status(404).json({ 
        success: false, 
        message: 'Invalid subdomain or endpoint not found' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'BambooHR connection failed',
        error: err.message 
      });
    }
  }
});

// Delete BambooHR credentials
router.delete('/credentials', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    await IntegrationCredential.deleteOne({
      orgId: req.user.orgId,
      integration: 'bamboohr'
    });

    res.json({ message: 'BambooHR credentials deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting BambooHR credentials:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
