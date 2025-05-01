const express = require('express');
const bcrypt = require('bcryptjs');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Organization = require('../models/Organization');

const router = express.Router();

// Get all users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find(
      {},
      'firstName lastName email plan role allowedIntegrations orgId'
    ).populate('orgId', 'name orgId');

    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Plan Integration rules
const planIntegrations = {
  starter: ['Gmail', 'Slack'],
  pro: ['Gmail', 'Slack', 'Dropbox Sign'],
  enterprise: ['Gmail', 'Slack', 'Dropbox Sign', 'Greenhouse']
};

// Update user's plan
router.post('/users/:email/plan', protect, adminOnly, async (req, res) => {
  try {
    const { plan } = req.body;
    const email = req.params.email;

    if (!planIntegrations[plan]) {
      return res.status(400).json({ message: 'Invalid plan specified.' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      {
        plan,
        allowedIntegrations: planIntegrations[plan]
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'Plan updated.',
      plan: user.plan,
      allowedIntegrations: user.allowedIntegrations
    });
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update allowed integrations
router.post('/users/:email/integrations', protect, adminOnly, async (req, res) => {
  try {
    const { integrations } = req.body;
    const email = req.params.email;

    const user = await User.findOneAndUpdate(
      { email },
      { allowedIntegrations: integrations },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({
      message: 'Allowed integrations updated.',
      allowedIntegrations: user.allowedIntegrations
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Update user role (including admins)
router.post('/users/:email/role', protect, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    const email = req.params.email;

    const validRoles = [
      'admin',
      'platform_editor',
      'platform_viewer',
      'client_admin',
      'client_editor',
      'client_viewer'
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified.' });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'User role updated.', role: user.role });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ✅ Update user's organization name
router.post('/users/:email/organization', protect, adminOnly, async (req, res) => {
  try {
    const { organization } = req.body;
    const email = req.params.email;

    if (!organization || typeof organization !== 'string') {
      return res.status(400).json({ message: 'Invalid organization name.' });
    }

    const user = await User.findOne({ email }).populate('orgId');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const org = await Organization.findById(user.orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    org.name = organization;
    await org.save();

    res.json({ message: 'Organization name updated.', organization: org.name });
  } catch (err) {
    console.error('Error updating organization:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Admin profile
router.get('/profile', protect, adminOnly, async (req, res) => {
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
    console.error('Error fetching admin profile:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update admin profile
router.post('/profile', protect, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, organization } = req.body;

    const user = await User.findOne({ email: req.user.email }).populate('orgId');
    if (!user) return res.status(404).json({ message: 'User not found.' });

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

// Update admin password
router.post('/profile/password', protect, adminOnly, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.findOneAndUpdate({ email: req.user.email }, { password: hashed });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error updating admin password:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Delete user
router.delete('/users/:email', protect, adminOnly, async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete another global admin.' });
    }

    await User.deleteOne({ email });
    res.json({ message: `User ${email} deleted successfully.` });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Add user (admin-only)
router.post('/users', protect, adminOnly, async (req, res) => {
  const { email, password, role, firstName, lastName, organization } = req.body;

  if (!email || !password || !firstName || !lastName || !role) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists.' });

  let org = null;
  if (organization) {
    org = await Organization.findOne({ name: organization }) 
      || await Organization.create({ name: organization });
  } else {
    org = await Organization.create({ name: `${firstName} ${lastName}` });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashed,
    role,
    firstName,
    lastName,
    orgId: org._id
  });

  res.status(201).json({ message: 'User created successfully.' });
});

module.exports = router;
