const mongoose = require('mongoose');

const streamerlbSchema = new mongoose.Schema({
  guildId:    { type: String, unique: true, required: true },
  kayit:      { type: String, default: null },
  public:     { type: String, default: null },
  streamer:   { type: String, default: null },
  sorun_cozme:{ type: String, default: null },
  secret:     { type: String, default: null },
  private:    { type: String, default: null },
});

module.exports = mongoose.model('StreamerLbConfig', streamerlbSchema);
