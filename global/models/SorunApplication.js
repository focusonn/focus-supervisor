const mongoose = require('mongoose');

const sorunApplicationSchema = new mongoose.Schema({
  guildId:   { type: String, required: true },
  userId:    { type: String, required: true },
  sorun:     { type: String },
  hedef:     { type: String },
  tecrube:   { type: String },
  neden:     { type: String },
  messageId: { type: String },
  channelId: { type: String },
  status:    { type: String, default: 'bekliyor' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SorunApplication', sorunApplicationSchema);
