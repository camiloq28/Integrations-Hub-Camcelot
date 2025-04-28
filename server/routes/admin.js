const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Protected Admin Route
router.get('/dashboard', protect, adminOnly, (req, res) => {
  res.json({ message: `Welcome Admin: ${req.user.email}` });
});

module.exports = router;
