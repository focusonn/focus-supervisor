const Ekonomi = require('../models/Ekonomi');

async function getUser(userId) {
  let user = await Ekonomi.findOne({ userId });
  if (!user) user = await Ekonomi.create({ userId });
  return user;
}

async function saveUser(user) {
  return await user.save();
}

module.exports = { getUser, saveUser };
