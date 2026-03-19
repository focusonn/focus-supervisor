const mongoose = require('mongoose');

const ozelOdaSchema = new mongoose.Schema({
  guildId:     { type: String, required: true },
  ownerId:     { type: String, required: true },
  channelId:   { type: String, required: true },
  locked:      { type: Boolean, default: false },
  createdAt:   { type: Date, default: Date.now },
});

ozelOdaSchema.index({ guildId: 1, channelId: 1 }, { unique: true });

module.exports = mongoose.model('OzelOda', ozelOdaSchema);
