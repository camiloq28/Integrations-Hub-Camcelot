const express = require('express');
const { google } = require('googleapis');
const IntegrationCredential = require('../../models/IntegrationCredential');
const { protect } = require('../../middleware/authMiddleware');
const { hasRole } = require('../../middleware/roleMiddleware');

const router = express.Router();

// Gmail OAuth configuration
const getGmailOAuth2Client = () => {
  const redirectUri = `${process.env.BASE_URL}/api/integrations/gmail/oauth/callback`;
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    redirectUri
  );

  return oauth2Client;
};

// Generate OAuth URL
router.get('/oauth/url', protect, hasRole('client_admin', 'client_editor'), (req, res) => {
  console.log('🔍 [GMAIL_DEBUG] OAuth URL generation started');
  console.log('🔍 [GMAIL_DEBUG] User:', req.user?.email, 'OrgId:', req.user?.orgId);
  console.log('🔍 [GMAIL_DEBUG] Query params:', req.query);

  try {
    // Validate environment variables
    const hasClientId = !!process.env.GMAIL_CLIENT_ID;
    const hasClientSecret = !!process.env.GMAIL_CLIENT_SECRET;
    const hasBaseUrl = !!process.env.BASE_URL;

    console.log('🔍 [GMAIL_DEBUG] Environment check - ClientID:', hasClientId, 'ClientSecret:', hasClientSecret, 'BaseURL:', hasBaseUrl);
    console.log('🔍 [GMAIL_DEBUG] BaseURL value:', process.env.BASE_URL);

    if (!hasClientId || !hasClientSecret || !hasBaseUrl) {
      console.error('❌ [GMAIL_DEBUG] Missing environment variables');
      return res.status(500).json({ 
        message: 'Gmail OAuth not configured. Please set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, and BASE_URL environment variables.' 
      });
    }

    const { accountName } = req.query;
    if (!accountName) {
      console.error('❌ [GMAIL_DEBUG] Missing account name');
      return res.status(400).json({ message: 'Account name is required' });
    }

    console.log('✅ [GMAIL_DEBUG] Account name provided:', accountName);

    const oauth2Client = getGmailOAuth2Client();
    console.log('✅ [GMAIL_DEBUG] OAuth2 client created');

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly'
    ];

    const state = JSON.stringify({
      orgId: req.user.orgId,
      accountName: accountName
    });

    console.log('🔍 [GMAIL_DEBUG] State created:', state);
    console.log('🔍 [GMAIL_DEBUG] Scopes:', scopes);

    const authUrlParams = {
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent',
      include_granted_scopes: true
    };

    console.log('🔍 [GMAIL_DEBUG] Auth URL params:', authUrlParams);

    const authUrl = oauth2Client.generateAuthUrl(authUrlParams);

    console.log('✅ [GMAIL_DEBUG] Auth URL generated successfully');
    console.log('🔍 [GMAIL_DEBUG] Auth URL length:', authUrl.length);
    console.log('🔍 [GMAIL_DEBUG] Auth URL (first 200 chars):', authUrl.substring(0, 200) + '...');

    res.json({ authUrl });
  } catch (err) {
    console.error('❌ [GMAIL_DEBUG] OAuth URL generation error:', err.message);
    console.error('❌ [GMAIL_DEBUG] Full error stack:', err.stack);
    res.status(500).json({ message: 'Failed to generate OAuth URL', error: err.message });
  }
});

// OAuth callback handler
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      return res.status(400).send('Missing authorization code or state');
    }

    const { orgId, accountName } = JSON.parse(state);

    if (!orgId || !accountName) {
      return res.status(400).send('Missing organization ID or account name');
    }

    // Manual token exchange to avoid PKCE issues
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GMAIL_CLIENT_ID,
        client_secret: process.env.GMAIL_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.BASE_URL}/api/integrations/gmail/oauth/callback`
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokens = await tokenResponse.json();

    // Get user info with the access token
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const userInfo = await userInfoResponse.json();

    // Check if this is the first account for this org/integration
    const existingAccounts = await IntegrationCredential.find({ orgId, integration: 'gmail' });
    const isFirstAccount = existingAccounts.length === 0;

    // Save credentials
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    await IntegrationCredential.findOneAndUpdate(
      { orgId, integration: 'gmail', accountName },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: tokens.token_type || 'Bearer',
        expiresAt: expiryDate,
        isDefault: isFirstAccount, // First account becomes default
        metadata: {
          email: userInfo.email,
          name: userInfo.name,
          scope: tokens.scope
        }
      },
      { upsert: true, new: true }
    );

    // Redirect to success page
    res.redirect(`${process.env.CLIENT_URL}/client/integrations/gmail?success=true&account=${encodeURIComponent(accountName)}`);
  } catch (err) {
    console.error('❌ OAuth callback error:', err);
    res.redirect(`${process.env.CLIENT_URL}/client/integrations/gmail?error=oauth_failed`);
  }
});

// Get Gmail credentials (all accounts)
router.get('/credentials', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const allCreds = await IntegrationCredential.find({
      orgId: req.user.orgId,
      integration: 'gmail'
    }).sort({ isDefault: -1, createdAt: 1 });

    if (allCreds.length === 0) {
      return res.status(404).json({ message: 'No Gmail credentials found' });
    }

    // Don't send sensitive tokens to frontend
    const safeCredentials = allCreds.map(creds => ({
      accountName: creds.accountName,
      integration: creds.integration,
      isDefault: creds.isDefault,
      createdAt: creds.createdAt,
      updatedAt: creds.updatedAt,
      metadata: creds.metadata
    }));

    res.json({ accounts: safeCredentials });
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

// Delete specific Gmail account
router.delete('/credentials/:accountName', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { accountName } = req.params;

    const deleted = await IntegrationCredential.findOneAndDelete({
      orgId: req.user.orgId,
      integration: 'gmail',
      accountName: accountName
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Account not found' });
    }

    // If we deleted the default account, make another one default
    if (deleted.isDefault) {
      const remaining = await IntegrationCredential.findOne({
        orgId: req.user.orgId,
        integration: 'gmail'
      });

      if (remaining) {
        remaining.isDefault = true;
        await remaining.save();
      }
    }

    res.json({ message: 'Gmail account deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting Gmail account:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Set default account
router.post('/credentials/:accountName/set-default', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { accountName } = req.params;

    // Remove default from all accounts
    await IntegrationCredential.updateMany(
      { orgId: req.user.orgId, integration: 'gmail' },
      { isDefault: false }
    );

    // Set new default
    const updated = await IntegrationCredential.findOneAndUpdate(
      { orgId: req.user.orgId, integration: 'gmail', accountName },
      { isDefault: true },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({ message: 'Default account updated successfully' });
  } catch (err) {
    console.error('❌ Error setting default account:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Test specific Gmail account
router.post('/test/:accountName', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { accountName } = req.params;

    const creds = await IntegrationCredential.findOne({
      orgId: req.user.orgId,
      integration: 'gmail',
      accountName
    });

    if (!creds) {
      return res.status(404).json({ message: 'Gmail account not found' });
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
      accountName: accountName,
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

module.exports = router;