
const greenhouseActions = require('../integrations/greenhouse/actions');
const bamboohrActions = require('../integrations/bamboohr/actions');

class IntegrationRegistry {
  constructor() {
    this.integrations = new Map();
    this.loadIntegrations();
  }

  loadIntegrations() {
    // Gmail integration
    this.integrations.set('gmail', {
      name: 'Gmail',
      actions: {
        send_email: async (config) => {
          console.log(`📧 [MOCK] Sending Gmail to ${config.to}`);
          console.log(`   Subject: ${config.subject}`);
          console.log(`   Body: ${config.body}`);
          return { 
            status: 'sent', 
            to: config.to, 
            subject: config.subject,
            messageId: `gmail_${Date.now()}`
          };
        },
        forward_email: async (config) => {
          console.log(`↗️ [MOCK] Forwarding email to ${config.to}`);
          console.log(`   Message: ${config.message}`);
          return { 
            status: 'forwarded', 
            to: config.to,
            messageId: `gmail_fwd_${Date.now()}`
          };
        }
      }
    });

    // Greenhouse integration
    this.integrations.set('greenhouse', {
      name: 'Greenhouse',
      actions: {
        create_candidate: async (config) => {
          console.log(`👤 [MOCK] Creating Greenhouse candidate: ${config.first_name} ${config.last_name}`);
          return {
            status: 'created',
            candidate_id: `gh_${Date.now()}`,
            name: `${config.first_name} ${config.last_name}`,
            email: config.email
          };
        },
        send_email: async (config) => {
          console.log(`📧 [MOCK] Sending Greenhouse email to ${config.to}`);
          console.log(`   Subject: ${config.subject}`);
          return {
            status: 'sent',
            to: config.to,
            subject: config.subject,
            messageId: `gh_email_${Date.now()}`
          };
        }
      }
    });

    // BambooHR integration
    this.integrations.set('bamboohr', {
      name: 'BambooHR',
      actions: {
        create_employee: async (config) => {
          console.log(`👥 [MOCK] Creating BambooHR employee: ${config.first_name} ${config.last_name}`);
          return {
            status: 'created',
            employee_id: `bhr_${Date.now()}`,
            name: `${config.first_name} ${config.last_name}`,
            email: config.email,
            department: config.department
          };
        },
        update_employee: async (config) => {
          console.log(`📝 [MOCK] Updating BambooHR employee ${config.employee_id}`);
          console.log(`   ${config.field_name}: ${config.field_value}`);
          return {
            status: 'updated',
            employee_id: config.employee_id,
            field_updated: config.field_name,
            new_value: config.field_value
          };
        }
      }
    });

    // Add aliases for case-insensitive lookup
    this.integrations.set('Gmail', this.integrations.get('gmail'));
    this.integrations.set('Greenhouse', this.integrations.get('greenhouse'));
    this.integrations.set('Bamboo HR', this.integrations.get('bamboohr'));
    this.integrations.set('BambooHR', this.integrations.get('bamboohr'));
  }

  getIntegration(name) {
    const normalized = name.toLowerCase().replace(/\s+/g, '');
    
    // Try direct lookup first
    let integration = this.integrations.get(name);
    if (integration) return integration;
    
    // Try normalized lookup
    for (const [key, value] of this.integrations.entries()) {
      if (key.toLowerCase().replace(/\s+/g, '') === normalized) {
        return value;
      }
    }
    
    return null;
  }

  getAllIntegrations() {
    return Array.from(this.integrations.entries()).map(([key, value]) => ({
      key,
      name: value.name,
      actions: Object.keys(value.actions)
    }));
  }
}

module.exports = new IntegrationRegistry();
