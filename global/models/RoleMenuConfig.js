const mongoose = require('mongoose');

const roleMenuConfigSchema = new mongoose.Schema({
  guildId: { type: String, unique: true },
  etkinlik: {
    cekilis:  { type: String, default: null },
    etkinlik: { type: String, default: null },
    coin:     { type: String, default: null },
    sosyal:   { type: String, default: null },
  },
  takim:    { type: [String], default: [] },
  renk:     { type: [String], default: [] },
  iliski:   { type: [String], default: [] },
  oyun:     { type: [String], default: [] },
  burc:     { type: [String], default: [] },
});

module.exports = mongoose.model('RoleMenuConfig', roleMenuConfigSchema);
