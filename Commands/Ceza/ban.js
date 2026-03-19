const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const { puanEkle } = require('../../global/utils/cezaPuanHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'ban',
  aliases: [],
  category: "Ceza",
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, 'ban_jail', 'denetim') ||
                    message.member.permissions.has('BanMembers') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin ban_jail denetim rolune sahip olmalisin.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    await puanEkle(message.guild, target, 'ban', message.author.id, reason);

    await target.send(`**${message.guild.name}** sunucusundan banlandın.\n> Sebep: ${reason}`).catch(() => {});
    await target.ban({ reason }).catch(() => {});

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (cfg?.logKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.logKanali);
      if (logKanal) {
        logKanal.send(
          `**Ban** | ${target.user.tag} (${target.id})\n` +
          `> Moderator : <@${message.author.id}>\n` +
          `> Sebep     : ${reason}`
        ).catch(() => {});
      }
    }

    return message.reply(`${target.user.tag} banlandı. Sebep: ${reason}`);
  },
};
