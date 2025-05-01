const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },

  lastName: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: [
      'admin',
      'platform_editor',
      'platform_viewer',
      'client_admin',
      'client_editor',
      'client_viewer'
    ],
    default: 'client_admin'
  },

  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: function () {
      return this.role !== 'admin';
    }
  },

  integrations: {
    type: [String],
    default: []
  },

  allowedIntegrations: {
    type: [String],
    default: []
  },

  plan: {
    type: String,
    enum: ['starter', 'pro', 'enterprise'],
    default: 'starter'
  },

  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },

  lastLogin: {
    type: Date,
    default: null
  },
  
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }

}, {
  timestamps: true // adds createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);
module.exports = User;
