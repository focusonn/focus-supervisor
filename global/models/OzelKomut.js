const mongoose = require('mongoose');

const ozelKomutSchema = new mongoose.Schema({
  guildId:       { type: String, required: true },
  komutIsim:     { type: String, required: true },
  roller:        { type: [String], default: [] },
  yetkiliRoller: { type: [String], default: [] },
  ekleyenId:     { type: String, default: null },
  createdAt:     { type: Date, default: Date.now },
});

ozelKomutSchema.index({ guildId: 1, komutIsim: 1 }, { unique: true });

module.exports = mongoose.model('OzelKomut', ozelKomutSchema);
