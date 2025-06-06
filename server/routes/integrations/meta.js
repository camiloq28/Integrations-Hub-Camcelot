
const express = require('express');
const { protect } = require('../../middleware/authMiddleware');
const loadIntegrationMetadata = require('../../utils/loadIntegrationMetadata');

const router = express.Router();

// GET /api/integrations/meta - Return all available triggers and actions by integration
router.get('/', protect, async (req, res) => {
  try {
    const metadata = loadIntegrationMetadata();
    
    const actionsByIntegration = {};
    const triggersByIntegration = {};
    
    // Process each integration's metadata
    Object.entries(metadata).forEach(([integration, meta]) => {
      if (meta.actions && Array.isArray(meta.actions)) {
        actionsByIntegration[integration] = {
          actions: meta.actions
        };
      }
      
      if (meta.triggers && Array.isArray(meta.triggers)) {
        triggersByIntegration[integration] = {
          triggers: meta.triggers
        };
      }
    });
    
    res.json({
      actionsByIntegration,
      triggersByIntegration
    });
  } catch (err) {
    console.error('Error loading integration metadata:', err);
    res.status(500).json({ message: 'Failed to load integration metadata' });
  }
});

module.exports = router;
