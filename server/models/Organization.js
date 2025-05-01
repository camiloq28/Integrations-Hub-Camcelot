const mongoose = require('mongoose');
const Counter = require('./Counter'); // 📌 Used for sequential orgId like ORG001

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,      // Organization name is optional
    unique: true,         // Prevents duplicate org names
    sparse: true          // Allows multiple docs without a name
  },
  plan: {
    type: String,
    enum: ['starter', 'pro', 'enterprise'],
    default: 'starter'
  },
  orgId: {
    type: String,
    unique: true          // e.g. ORG001, ORG002
  }
});

// ✅ Pre-save hook to auto-generate a short orgId like ORG001
organizationSchema.pre('save', async function (next) {
  if (this.isNew && !this.orgId) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { name: 'organization' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );

      this.orgId = `ORG${counter.seq.toString().padStart(3, '0')}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;

