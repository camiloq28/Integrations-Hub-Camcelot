const mongoose = require('mongoose');

const integrationCredentialSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  integration: { type: String, required: true }, // e.g., 'bamboohr'
  accountName: { type: String, required: true }, // user-defined name like "Marketing Gmail", "HR Gmail"
  accessToken: { type: String, required: true },
  refreshToken: { type: String }, // if applicable
  tokenType: { type: String },
  expiresAt: { type: Date }, // optional expiration date
  metadata: { type: Object }, // any extra config or response info
  isDefault: { type: Boolean, default: false }, // mark one account as default
}, { timestamps: true });

// Ensure unique account names per org per integration
integrationCredentialSchema.index({ orgId: 1, integration: 1, accountName: 1 }, { unique: true });

module.exports = mongoose.model('IntegrationCredential', integrationCredentialSchema);
