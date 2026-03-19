const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'unban',
  aliases: [],
  category: 'Ceza',
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, 'ban_jail', 'denetim') ||
                    message.member.permissions.has('BanMembers') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin ban_jail denetim rolune sahip olmalisin.');

    const userId = args[0]?.replace(/[<@!>]/g, '');
    if (!userId) return message.reply('Kullanici ID belirt.');

    await message.guild.members.unban(userId).catch(() => {});

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (cfg?.logKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.logKanali);
      if (logKanal) {
        logKanal.send(
          `**Unban** | ${userId}\n` +
          `> Moderator : <@${message.author.id}>`
        ).catch(() => {});
      }
    }

    return message.reply(`${userId} kullanicisinin bani kaldirildi.`);
  },
};
