const Invite = require('../global/models/Invite');
const settings = require('../global/settings/settings.json');

module.exports = {
  name: 'inviteCreate',
  once: false,
  async execute(invite, focus) {
    if (settings.guildID && invite.guild?.id !== settings.guildID) return;
    await Invite.findOneAndUpdate(
      { code: invite.code },
      { guildId: invite.guild.id, userId: invite.inviter?.id || 'unknown', code: invite.code, uses: invite.uses || 0 },
      { upsert: true }
    );
  },
};
