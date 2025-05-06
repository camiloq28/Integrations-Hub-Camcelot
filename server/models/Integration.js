const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('Integration', integrationSchema);
