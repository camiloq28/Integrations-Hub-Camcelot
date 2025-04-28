const express = require('express');
const { protect, clientOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected Client Route
router.get('/portal', protect, clientOnly, (req, res) => {
  res.json({ message: `Welcome Client: ${req.user.email}` });
});

module.exports = router;
