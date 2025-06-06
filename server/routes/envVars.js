
const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// File to store environment variables (in production, you'd use a proper secrets manager)
const ENV_FILE_PATH = path.join(__dirname, '../../.env.admin');

// Get all environment variables
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const envVars = {};
    
    // Read from process.env (Replit secrets)
    const requiredVars = [
      'MONGODB_URI', 'JWT_SECRET', 'BASE_URL', 'CLIENT_URL',
      'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET',
      'SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET',
      'GREENHOUSE_API_KEY', 'BAMBOOHR_API_KEY', 'BAMBOOHR_SUBDOMAIN',
      'NODE_ENV', 'LOG_LEVEL', 'SENTRY_DSN'
    ];

    // Auto-populate known values
    const knownValues = {
      'MONGODB_URI': process.env.MONGO_URI, // Your app uses MONGO_URI
      'BASE_URL': 'https://4510d6f5-60d4-4d1c-b423-94f825eeb9b3-00-3mho543xreghf.spock.replit.dev',
      'CLIENT_URL': 'https://4510d6f5-60d4-4d1c-b423-94f825eeb9b3-00-3mho543xreghf.spock.replit.dev',
      'NODE_ENV': 'development'
    };

    requiredVars.forEach(key => {
      const envValue = process.env[key] || knownValues[key];
      if (envValue) {
        envVars[key] = { 
          value: '***HIDDEN***', // Don't expose actual values
          isSet: true,
          description: getVarDescription(key),
          actualValue: envValue // Only for auto-population
        };
      } else {
        envVars[key] = { 
          value: '',
          isSet: false,
          description: getVarDescription(key)
        };
      }
    });

    // Also check for custom vars from admin file
    try {
      const adminEnvContent = await fs.readFile(ENV_FILE_PATH, 'utf8');
      const adminVars = parseEnvFile(adminEnvContent);
      Object.keys(adminVars).forEach(key => {
        if (!envVars[key]) {
          envVars[key] = { 
            value: '***HIDDEN***',
            isSet: true,
            description: adminVars[key].description || ''
          };
        }
      });
    } catch (err) {
      // File doesn't exist yet, that's ok
    }

    res.json({ envVars });
  } catch (err) {
    console.error('Error fetching environment variables:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Set environment variable
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { key, value, description = '' } = req.body;

    if (!key || !value) {
      return res.status(400).json({ message: 'Key and value are required' });
    }

    // For critical system vars, recommend using Replit Secrets
    const systemVars = [
      'GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 
      'SLACK_CLIENT_ID', 'SLACK_CLIENT_SECRET',
      'GREENHOUSE_API_KEY', 'BAMBOOHR_API_KEY',
      'BASE_URL', 'CLIENT_URL', 'SENTRY_DSN'
    ];
    if (systemVars.includes(key)) {
      return res.status(400).json({ 
        message: `${key} should be set using Replit Secrets tool for security. Go to Tools > Secrets to set this variable.`
      });
    }

    // Store in admin env file for custom variables
    let envContent = '';
    try {
      envContent = await fs.readFile(ENV_FILE_PATH, 'utf8');
    } catch (err) {
      // File doesn't exist, start with empty content
    }

    const envVars = parseEnvFile(envContent);
    envVars[key] = { value, description };

    const newContent = Object.entries(envVars)
      .map(([k, data]) => {
        const desc = data.description ? `# ${data.description}\n` : '';
        return `${desc}${k}=${data.value}`;
      })
      .join('\n\n');

    await fs.writeFile(ENV_FILE_PATH, newContent);

    res.json({ message: `Environment variable ${key} saved successfully` });
  } catch (err) {
    console.error('Error saving environment variable:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Auto-populate missing environment variables
router.post('/auto-populate', protect, adminOnly, async (req, res) => {
  try {
    const updates = [];
    
    // Auto-populate known values that are missing
    const autoValues = {
      'BASE_URL': 'https://4510d6f5-60d4-4d1c-b423-94f825eeb9b3-00-3mho543xreghf.spock.replit.dev',
      'CLIENT_URL': 'https://4510d6f5-60d4-4d1c-b423-94f825eeb9b3-00-3mho543xreghf.spock.replit.dev',
      'NODE_ENV': 'development'
    };

    for (const [key, value] of Object.entries(autoValues)) {
      if (!process.env[key]) {
        // Set in process.env for immediate use
        process.env[key] = value;
        updates.push(key);
      }
    }

    res.json({ 
      message: `Auto-populated ${updates.length} environment variables`,
      updated: updates
    });
  } catch (err) {
    console.error('Error auto-populating environment variables:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete environment variable
router.delete('/:key', protect, adminOnly, async (req, res) => {
  try {
    const { key } = req.params;

    // Prevent deletion of critical system vars
    const protectedVars = ['MONGODB_URI', 'JWT_SECRET'];
    if (protectedVars.includes(key)) {
      return res.status(400).json({ 
        message: `${key} is a protected system variable and cannot be deleted`
      });
    }

    // Remove from admin env file
    try {
      const envContent = await fs.readFile(ENV_FILE_PATH, 'utf8');
      const envVars = parseEnvFile(envContent);
      
      if (envVars[key]) {
        delete envVars[key];
        
        const newContent = Object.entries(envVars)
          .map(([k, data]) => {
            const desc = data.description ? `# ${data.description}\n` : '';
            return `${desc}${k}=${data.value}`;
          })
          .join('\n\n');

        await fs.writeFile(ENV_FILE_PATH, newContent);
      }
    } catch (err) {
      // File doesn't exist, that's ok
    }

    res.json({ message: `Environment variable ${key} deleted successfully` });
  } catch (err) {
    console.error('Error deleting environment variable:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function parseEnvFile(content) {
  const vars = {};
  const lines = content.split('\n');
  let currentDescription = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      currentDescription = trimmed.substring(1).trim();
    } else if (trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      vars[key] = { value, description: currentDescription };
      currentDescription = '';
    }
  }

  return vars;
}

function getVarDescription(key) {
  const descriptions = {
    // System Configuration
    'MONGODB_URI': 'MongoDB connection string',
    'JWT_SECRET': 'JWT signing secret',
    'BASE_URL': 'Base URL of the application',
    'CLIENT_URL': 'Frontend URL of the application',
    // Email & Communication
    'GMAIL_CLIENT_ID': 'Google OAuth Client ID for Gmail integration',
    'GMAIL_CLIENT_SECRET': 'Google OAuth Client Secret for Gmail integration',
    'SLACK_CLIENT_ID': 'Slack OAuth Client ID for Slack integration',
    'SLACK_CLIENT_SECRET': 'Slack OAuth Client Secret for Slack integration',
    // HR & Recruiting
    'GREENHOUSE_API_KEY': 'Greenhouse API key for recruiting integration',
    'BAMBOOHR_API_KEY': 'BambooHR API key for HR integration',
    'BAMBOOHR_SUBDOMAIN': 'BambooHR company subdomain',
    // Development & Monitoring
    'NODE_ENV': 'Node.js environment (development/production)',
    'LOG_LEVEL': 'Application logging level',
    'SENTRY_DSN': 'Sentry error tracking DSN'
  };
  return descriptions[key] || '';
}

module.exports = router;
