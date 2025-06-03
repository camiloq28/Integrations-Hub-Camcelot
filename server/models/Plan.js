// /server/models/Plan.js

const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  integrations: [{ type: String, required: true }],
  allowedTriggers: [{ type: String }],
  allowedActions: [{ type: String }]
});

module.exports = mongoose.model('Plan', planSchema);
