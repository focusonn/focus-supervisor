const mongoose = require('mongoose');

const kademeli = {
  sorumluluk: { type: [String], default: [] },
  denetim:    { type: [String], default: [] },
  lider:      { type: [String], default: [] },
};

const staffConfigSchema = new mongoose.Schema({
  guildId:     { type: String, unique: true },
  chat:        { ...kademeli },
  ban_jail:    { ...kademeli },
  mute:        { ...kademeli },
  yetkili_alim:{ ...kademeli },
  rol_denetim: { ...kademeli },
  register:    { ...kademeli },
  streamer:    { ...kademeli },
  konser:      { ...kademeli },
  sorun_cozme: { ...kademeli },
  etkinlik:    { ...kademeli },
  public:      { ...kademeli },
  ceza_rolu:          { type: String, default: null },
  basvuruKanali:      { type: String, default: null },
  yetkiliKanali:      { type: String, default: null },
  streamerKanali:     { type: String, default: null },
  sorunKanali:        { type: String, default: null },
  logKanali:          { type: String, default: null },
  canvasLogKanali:    { type: String, default: null },
  welcomeKanali:      { type: String, default: null },
  kayitKanali:        { type: String, default: null },
  kayitLogKanali:     { type: String, default: null },
  teyitKanali:        { type: String, default: null },
  
  erkekRolu:          { type: String, default: null },
  kizRolu:            { type: String, default: null },
  ortakRolu:          { type: String, default: null },
  kayitsizRolu:       { type: String, default: null },
});

module.exports = mongoose.model('StaffConfig', staffConfigSchema);
