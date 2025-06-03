// server/routes/integrations/meta.js

const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const { hasRole } = require('../../middleware/roleMiddleware');
const { getAllIntegrationMetadata } = require('../../utils/loadIntegrationMetadata');

router.get('/', protect, hasRole('admin', 'platform_editor', 'client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const metadata = await getAllIntegrationMetadata();
    res.json(metadata);
  } catch (err) {
    console.error('❌ Failed to load integration metadata:', err);
    res.status(500).json({ message: 'Server error loading metadata' });
  }
});

module.exports = router;
