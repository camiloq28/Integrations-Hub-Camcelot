
const express = require('express');
const router = express.Router();

router.post('/register', (req, res) => {
  try {
    console.log('Register request received:', req.body);
    const { email, password } = req.body;
    // TODO: Add validation and user creation logic
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
