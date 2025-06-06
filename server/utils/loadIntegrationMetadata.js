
const integrationMetadata = require('../integrations/metadata');

function loadIntegrationMetadata() {
  // This loads all integration metadata from the metadata folder
  const metadata = integrationMetadata;
  
  // Create a normalized mapping to handle different naming conventions
  const normalizedMetadata = {};
  
  // Add mappings for different naming conventions
  const nameMapping = {
    'Bamboo HR': 'bamboohr',
    'BambooHR': 'bamboohr',
    'Gmail': 'gmail', 
    'Greenhouse': 'greenhouse'
  };
  
  // First, add the original metadata with original keys
  Object.keys(metadata).forEach(key => {
    normalizedMetadata[key] = metadata[key];
  });
  
  // Then add mapped versions
  Object.entries(nameMapping).forEach(([displayName, fileKey]) => {
    if (metadata[fileKey]) {
      normalizedMetadata[displayName] = metadata[fileKey];
    }
  });
  
  return normalizedMetadata;
}

module.exports = loadIntegrationMetadata;
