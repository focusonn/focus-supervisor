const mongoose = require('mongoose');

const yetkiliApplicationSchema = new mongoose.Schema({
  guildId:   { type: String, required: true },
  userId:    { type: String, required: true },
  yas:       { type: String },
  tecrube:   { type: String },
  neden:     { type: String },
  saat:      { type: String },
  messageId: { type: String },
  channelId: { type: String },
  status:    { type: String, default: 'bekliyor' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('YetkiliApplication', yetkiliApplicationSchema);
