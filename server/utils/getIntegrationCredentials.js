const IntegrationCredential = require('../models/IntegrationCredential');

/**
 * Get credentials for a specific integration and org
 * @param {String} orgId - The organization ID
 * @param {String} integration - e.g., 'greenhouse'
 * @param {String} accountName - Optional specific account name. If not provided, uses default account.
 */
async function getIntegrationCredentials(orgId, integration, accountName = null) {
  if (!orgId || !integration) {
    throw new Error('orgId and integration name are required');
  }

  let query = { orgId, integration };
  
  if (accountName) {
    query.accountName = accountName;
  } else {
    // Get default account if no specific account requested
    query.isDefault = true;
  }

  let credentials = await IntegrationCredential.findOne(query);

  // If no default found and no specific account requested, get any account
  if (!credentials && !accountName) {
    credentials = await IntegrationCredential.findOne({ orgId, integration });
  }

  if (!credentials) {
    const accountText = accountName ? ` (account: ${accountName})` : '';
    throw new Error(`No credentials found for ${integration}${accountText} in org ${orgId}`);
  }

  // Check for expiration
  if (credentials.expiresAt && new Date() > credentials.expiresAt) {
    const accountText = accountName ? ` (account: ${accountName})` : '';
    throw new Error(`Credentials for ${integration}${accountText} in org ${orgId} have expired`);
  }

  return credentials;
}

module.exports = getIntegrationCredentials;
