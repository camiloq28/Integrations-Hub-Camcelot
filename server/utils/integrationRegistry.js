const loadIntegrationMetadata = require('./loadIntegrationMetadata');

class IntegrationRegistry {
  constructor() {
    this.metadata = loadIntegrationMetadata();
  }

  getAction(integration, actionKey) {
    const meta = this.metadata[integration];
    if (!meta || !meta.actions) return null;

    return meta.actions.find(action => action.key === actionKey);
  }

  getTrigger(integration, triggerKey) {
    const meta = this.metadata[integration];
    if (!meta || !meta.triggers) return null;

    return meta.triggers.find(trigger => trigger.key === triggerKey);
  }

  getAllActions() {
    const actions = {};
    Object.entries(this.metadata).forEach(([integration, meta]) => {
      if (meta.actions) {
        actions[integration] = meta.actions;
      }
    });
    return actions;
  }

  getAllTriggers() {
    const triggers = {};
    Object.entries(this.metadata).forEach(([integration, meta]) => {
      if (meta.triggers) {
        triggers[integration] = meta.triggers;
      }
    });
    return triggers;
  }
}

module.exports = new IntegrationRegistry();