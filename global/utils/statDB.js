const Stat = require('../models/Stat');

async function getUser(guildId, userId) {
  let doc = await Stat.findOne({ guildId, userId });
  if (!doc) doc = await Stat.create({ guildId, userId });
  return doc;
}

async function getTop(guildId, field, limit = 10) {
  return Stat.find({ guildId }).sort({ [field]: -1 }).limit(limit);
}

module.exports = { getUser, getTop };
