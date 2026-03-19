const mongoose = require('mongoose');

const staffApplicationSchema = new mongoose.Schema({
  guildId:     { type: String, required: true },
  userId:      { type: String, required: true },
  alan:        { type: String, required: true },
  yas:         { type: String },
  tecrube:     { type: String },
  neden:       { type: String },
  messageId:   { type: String },
  channelId:   { type: String },
  status:      { type: String, default: 'bekliyor' },
  createdAt:   { type: Date, default: Date.now },
});

module.exports = mongoose.model('StaffApplication', staffApplicationSchema);
