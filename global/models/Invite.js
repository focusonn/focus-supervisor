const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  uses: { type: Number, default: 0 },
});

module.exports = mongoose.model('Invite', inviteSchema);
