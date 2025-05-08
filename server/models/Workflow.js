const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  type: { type: String, required: true }, // e.g., 'integration_call', 'delay', 'email'
  integration: { type: String },
  action: { type: String },
  config: { type: mongoose.Schema.Types.Mixed },
  order: { type: Number, required: true }
});

const workflowSchema = new mongoose.Schema({
  name: { type: String, required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  trigger: {
    type: { type: String, required: true },
    config: { type: mongoose.Schema.Types.Mixed }
  },
  steps: [stepSchema],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

// 🧠 Optional: Improve performance for org-wide listing
workflowSchema.index({ orgId: 1 });

module.exports = mongoose.model('Workflow', workflowSchema);
