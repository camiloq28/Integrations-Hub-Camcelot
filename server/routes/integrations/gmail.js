
const express = require('express');
const { google } = require('googleapis');
const IntegrationCredential = require('../../models/IntegrationCredential');
const { protect } = require('../../middleware/authMiddleware');
const { hasRole } = require('../../middleware/roleMiddleware');

const router = express.Router();

// Gmail OAuth configuration
const getGmailOAuth2Client = () => {
  return new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI || `${process.env.BASE_URL}/api/integrations/gmail/oauth/callback`
  );
};

// Generate OAuth URL
router.get('/oauth/url', protect, hasRole('client_admin', 'client_editor'), (req, res) => {
  try {
    const oauth2Client = getGmailOAuth2Client();
    
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: req.user.orgId // Pass orgId in state for callback
    });

    res.json({ authUrl });
  } catch (err) {
    console.error('❌ OAuth URL generation error:', err);
    res.status(500).json({ message: 'Failed to generate OAuth URL', error: err.message });
  }
});

// OAuth callback handler
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const orgId = state; // orgId was passed in state

    if (!code || !orgId) {
      return res.status(400).send('Missing authorization code or organization ID');
    }

    const oauth2Client = getGmailOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user info
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // Save credentials
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;
    
    await IntegrationCredential.findOneAndUpdate(
      { orgId, integration: 'gmail' },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type || 'Bearer',
        expiresAt: expiryDate,
        metadata: {
          email: userInfo.data.email,
          name: userInfo.data.name,
          scope: tokens.scope
        }
      },
      { upsert: true, new: true }
    );

    // Redirect to success page
    res.redirect(`${process.env.CLIENT_URL}/client/integrations/gmail?success=true`);
  } catch (err) {
    console.error('❌ OAuth callback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/client/integrations/gmail?error=oauth_failed`);
  }
});

// Get Gmail credentials
router.get('/credentials', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const creds = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'gmail'
    });

    if (!creds) {
      return res.status(404).json({ message: 'No Gmail credentials found' });
    }

    // Don't send sensitive tokens to frontend
    const safeCredentials = {
      integration: creds.integration,
      createdAt: creds.createdAt,
      updatedAt: creds.updatedAt,
      metadata: creds.metadata
    };

    res.json(safeCredentials);
  } catch (err) {
    console.error('❌ Error fetching Gmail credentials:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Test Gmail connection
router.post('/test', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const creds = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'gmail'
    });

    if (!creds) {
      return res.status(404).json({ message: 'No Gmail credentials found' });
    }

    const oauth2Client = getGmailOAuth2Client();
    oauth2Client.setCredentials({
      access_token: creds.accessToken,
      refresh_token: creds.refreshToken
    });

    // Test by getting user profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    res.json({ 
      success: true, 
      email: userInfo.data.email,
      message: 'Gmail connection is working' 
    });
  } catch (err) {
    console.error('❌ Gmail test error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Gmail connection failed',
      error: err.message 
    });
  }
});

// Delete Gmail credentials
router.delete('/credentials', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    await IntegrationCredential.deleteOne({
      orgId: req.user.orgId,
      integration: 'gmail'
    });

    res.json({ message: 'Gmail credentials deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting Gmail credentials:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
