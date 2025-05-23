// /server/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organization = require('../models/Organization');
const IntegrationCredential = require('../models/IntegrationCredential');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// ✅ Register a new user
const register = async (req, res) => {
  const { email, password, role, firstName, lastName, organization } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ message: 'First and last name are required.' });
  }

  try {
    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const platformRoles = ['admin', 'platform_editor', 'platform_viewer'];
    let org = null;

    if (platformRoles.includes(role)) {
      // ✅ Platform users always go to "Camcelot"
      org = await Organization.findOne({ name: 'Camcelot' });
      if (!org) {
        org = new Organization({ name: 'Camcelot' });
        await org.save();
      }
    } else {
      // ✅ For client users: use specified org or auto-generate one
      const orgName = organization || `${firstName} ${lastName}`;
      org = await Organization.findOne({ name: orgName });
      if (!org) {
        org = new Organization({ name: orgName });
        await org.save();
      }
    }

    if (!org.orgId) {
      await org.save(); // 🛠 Triggers pre-save hook for orgId generation
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      role: role || 'client_editor',
      firstName,
      lastName,
      orgId: org._id
    });

    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Error in registration:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// ✅ Login user with lastLogin timestamp update
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate('orgId', 'orgId name');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // ❌ Block if status is not active
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Your account is currently disabled. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        role: user.role,
        orgId: user.orgId?._id?.toString() || user.orgId
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // ✅ lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // ✅ Check integration setup
    const credentials = await IntegrationCredential.findOne({
      orgId: user.orgId?._id || user.orgId,
      service: 'greenhouse'
    });
    const setupComplete = !!credentials;

    res.json({
      token,
      user: {
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        orgId: user.orgId?.orgId || '',
        organization: user.orgId?.name || '',
        setupComplete
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

module.exports = { register, login };
