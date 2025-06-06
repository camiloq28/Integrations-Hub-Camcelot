
const integrationMetadata = require('../integrations/metadata');

function loadIntegrationMetadata() {
  // This loads all integration metadata from the metadata folder
  return integrationMetadata;
}

module.exports = loadIntegrationMetadata;
