const greenhouse = require('../integrations/metadata/greenhouse');
const bamboohr = require('../integrations/metadata/bamboohr');
const gmail = require('../integrations/metadata/gmail');

async function getAllIntegrationMetadata() {
  return {
    actionsByIntegration: {
      greenhouse: { actions: greenhouse.actions },
      bamboohr: { actions: bamboohr.actions },
      gmail: { actions: gmail.actions }
    },
    triggersByIntegration: {
      greenhouse: { triggers: greenhouse.triggers },
      bamboohr: { triggers: bamboohr.triggers },
      gmail: { triggers: gmail.triggers }
    }
  };
}

module.exports = { getAllIntegrationMetadata };
