const express = require('express');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/authMiddleware');
const { hasRole } = require('../middleware/roleMiddleware');
const User = require('../models/User');
const Organization = require('../models/Organization');

const router = express.Router();

// ✅ Welcome route with org name
router.get('/portal', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate('orgId');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const orgName = user.orgId?.name || 'Your Organization';

    res.json({ message: `Welcome ${user.email}`, orgName });
  } catch (err) {
    console.error('Error fetching portal info:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Get client allowed + enabled integrations
router.get('/integrations', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      allowed: user.allowedIntegrations || [],
      enabled: user.integrations || []
    });
  } catch (err) {
    console.error('Error fetching client integrations:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Save client enabled integrations
router.post('/integrations', protect, hasRole('client_admin', 'client_editor'), async (req, res) => {
  try {
    const { integrations } = req.body;

    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      { integrations },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'Integrations updated.', integrations: user.integrations });
  } catch (err) {
    console.error('Error updating integrations:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Profile - Get client profile details
router.get('/profile', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate('orgId');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organization: user.orgId?.name || ''
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Profile - Update client profile
router.post('/profile', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const { firstName, lastName, organization } = req.body;

    const user = await User.findOne({ email: req.user.email }).populate('orgId');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;

    if (organization && user.orgId) {
      const org = await Organization.findById(user.orgId);
      if (org) {
        org.name = organization;
        await org.save();
      }
    }

    await user.save();

    res.json({ message: 'Profile updated.' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Profile - Update password
router.post('/profile/password', protect, hasRole('client_admin', 'client_editor', 'client_viewer'), async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { email: req.user.email },
      { password: hashedPassword }
    );

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error updating password:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Client Admin: Create new user within own organization
router.post('/users', protect, hasRole('client_admin'), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!['client_admin', 'client_editor', 'client_viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role for client user.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const creator = await User.findOne({ email: req.user.email });
    if (!creator) {
      return res.status(404).json({ message: 'Creating user not found.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashed,
      role,
      firstName,
      lastName,
      orgId: creator.orgId
    });

    res.status(201).json({ message: 'User created successfully.' });
  } catch (err) {
    console.error('Error creating client user:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});


module.exports = router;
