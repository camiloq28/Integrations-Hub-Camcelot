const mongoose = require('mongoose');

const integrationCredentialSchema = new mongoose.Schema({
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  integration: { type: String, required: true }, // e.g., 'bamboohr'
  accessToken: { type: String, required: true },
  refreshToken: { type: String }, // if applicable
  tokenType: { type: String },
  expiresAt: { type: Date }, // optional expiration date
  metadata: { type: Object }, // any extra config or response info
}, { timestamps: true });

module.exports = mongoose.model('IntegrationCredential', integrationCredentialSchema);
