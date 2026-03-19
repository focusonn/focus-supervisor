const mongoose = require('mongoose');

const streamerApplicationSchema = new mongoose.Schema({
  guildId:    { type: String, required: true },
  userId:     { type: String, required: true },
  platform:   { type: String },
  kanal:      { type: String },
  icerik:     { type: String },
  izleyici:   { type: String },
  neden:      { type: String },
  messageId:  { type: String },
  channelId:  { type: String },
  status:     { type: String, default: 'bekliyor' },
  createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('StreamerApplication', streamerApplicationSchema);
