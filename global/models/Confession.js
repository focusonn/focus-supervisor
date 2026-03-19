const mongoose = require('mongoose');

const confessionSchema = new mongoose.Schema({
  guildId: String,
  number: Number,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Confession', confessionSchema);
