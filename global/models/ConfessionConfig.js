const mongoose = require('mongoose');

const confessionConfigSchema = new mongoose.Schema({
  guildId: { type: String, unique: true },
  channelId: { type: String, default: null },
  roleId: { type: String, default: null },
});

module.exports = mongoose.model('ConfessionConfig', confessionConfigSchema);
