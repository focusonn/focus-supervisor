const mongoose = require('mongoose');

const statSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  mesaj: { type: Number, default: 0 },
  ses: { type: Number, default: 0 },
  kamera: { type: Number, default: 0 },
  yayin: { type: Number, default: 0 },
  invite: { type: Number, default: 0 },
  inviteKullanilan: { type: Number, default: 0 },
  kayit: { type: Number, default: 0 }, 
});

statSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Stat', statSchema);
