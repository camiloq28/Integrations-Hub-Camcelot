const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  integrations: [{ type: String, required: true }]
});

module.exports = mongoose.model('Plan', planSchema);
