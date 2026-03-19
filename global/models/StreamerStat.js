const mongoose = require('mongoose');

const streamerStatSchema = new mongoose.Schema({
  guildId:    { type: String, required: true },
  userId:     { type: String, required: true },
  kayit:      { type: Number, default: 0 },
  public:     { type: Number, default: 0 },
  streamer:   { type: Number, default: 0 },
  sorun_cozme:{ type: Number, default: 0 },
  secret:     { type: Number, default: 0 },
  private:    { type: Number, default: 0 },
});

streamerStatSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('StreamerStat', streamerStatSchema);
