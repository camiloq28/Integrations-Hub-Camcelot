const IntegrationCredential = require('../models/IntegrationCredential');

/**
 * Get credentials for a specific integration and org
 * @param {String} orgId - The organization ID
 * @param {String} integration - e.g., 'greenhouse'
 */
async function getIntegrationCredentials(orgId, integration) {
  if (!orgId || !integration) {
    throw new Error('orgId and integration name are required');
  }

  const credentials = await IntegrationCredential.findOne({ orgId, integration });

  if (!credentials) {
    throw new Error(`No credentials found for ${integration} in org ${orgId}`);
  }

  // Check for expiration
  if (credentials.expiresAt && new Date() > credentials.expiresAt) {
    throw new Error(`Credentials for ${integration} in org ${orgId} have expired`);
  }

  return credentials;
}

module.exports = getIntegrationCredentials;
