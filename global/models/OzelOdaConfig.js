const mongoose = require('mongoose');

const ozelOdaConfigSchema = new mongoose.Schema({
  guildId:          { type: String, required: true, unique: true },
  categoryName:     { type: String, default: 'Ozel Odalar' },
  voiceChannelName: { type: String, default: '+ Ozel Oda Olustur' },
  textChannelName:  { type: String, default: 'ozel-oda-yonetim' },
  panelChannelId:   { type: String, default: null },
  voiceChannelId:   { type: String, default: null },
  categoryId:       { type: String, default: null },
});

module.exports = mongoose.model('OzelOdaConfig', ozelOdaConfigSchema);
