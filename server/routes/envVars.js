
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
      'GMAIL_CLIENT_ID',
      'GMAIL_CLIENT_SECRET', 
      'BASE_URL',
      'CLIENT_URL',
      'MONGODB_URI',
      'JWT_SECRET'
    ];

    requiredVars.forEach(key => {
      if (process.env[key]) {
        envVars[key] = { 
          value: '***HIDDEN***', // Don't expose actual values
          isSet: true,
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
    const systemVars = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'BASE_URL', 'CLIENT_URL'];
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
    'GMAIL_CLIENT_ID': 'Google OAuth Client ID for Gmail integration',
    'GMAIL_CLIENT_SECRET': 'Google OAuth Client Secret for Gmail integration',
    'BASE_URL': 'Base URL of the application',
    'CLIENT_URL': 'Frontend URL of the application',
    'MONGODB_URI': 'MongoDB connection string',
    'JWT_SECRET': 'JWT signing secret'
  };
  return descriptions[key] || '';
}

module.exports = router;
