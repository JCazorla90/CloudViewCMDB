
const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  name: String,
  provider: String,
  credentials: mongoose.Schema.Types.Mixed
});

module.exports = mongoose.model('Connection', connectionSchema);
