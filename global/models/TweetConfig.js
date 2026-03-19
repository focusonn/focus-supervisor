const mongoose = require('mongoose');

const tweetConfigSchema = new mongoose.Schema({
  guildId: { type: String, unique: true },
  channelId: String,
});

module.exports = mongoose.model('TweetConfig', tweetConfigSchema);
