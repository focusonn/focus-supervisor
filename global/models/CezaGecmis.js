const mongoose = require('mongoose');

const cezaGecmisSchema = new mongoose.Schema({
  guildId:   { type: String, required: true },
  userId:    { type: String, required: true },
  tip:       { type: String, enum: ['warn', 'mute', 'voicemute', 'jail', 'ban', 'unwarn', 'unmute', 'unvoicemute', 'unjail', 'unban'], required: true },
  moderator: { type: String, required: true },
  reason:    { type: String, default: 'Sebep belirtilmedi' },
  sure:      { type: Number, default: null },
  bitis:     { type: Date,   default: null },
  createdAt: { type: Date,   default: Date.now },
});

cezaGecmisSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model('CezaGecmis', cezaGecmisSchema);
