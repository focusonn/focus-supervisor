const { puanSifirla } = require('../../global/utils/cezaPuanHelper');
const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'cezapuansifirla',
  aliases: ['cpsifirla'],
  category: 'Ceza',
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, ['chat', 'mute', 'ban_jail'], 'denetim') ||
                    message.member.permissions.has('ManageGuild') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin denetim rolune sahip olmalisin.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    await puanSifirla(message.guild.id, target.id);

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (cfg?.logKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.logKanali);
      if (logKanal) {
        logKanal.send(
          `**Ceza Puani Sifirla** | <@${target.id}> (${target.user.tag})\n` +
          `> Moderator : <@${message.author.id}>`
        ).catch(() => {});
      }
    }

    return message.reply(`<@${target.id}> kullanicisinin ceza puani sifirlandı.`);
  },
};
