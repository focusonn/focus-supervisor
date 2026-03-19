const StaffConfig = require('../../global/models/StaffConfig');
const CezaGecmis = require('../../global/models/CezaGecmis');
const { hasRole } = require('../../global/utils/staffHelper');
const { puanEkle } = require('../../global/utils/cezaPuanHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'jail',
  aliases: [],
  category: 'Ceza',
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, 'ban_jail', 'sorumluluk') ||
                    message.member.permissions.has('ManageGuild') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin ban_jail sorumluluk rolune sahip olmalisin.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (!cfg?.ceza_rolu) return message.reply('Ceza rolu ayarlanmamis. Setup ile ayarla.');

    await target.roles.add(cfg.ceza_rolu, reason).catch(() => {});

    const { yeniPuan, tetiklenen } = await puanEkle(message.guild, target, 'jail', message.author.id, reason);

    if (cfg?.logKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.logKanali);
      if (logKanal) {
        logKanal.send(
          `**Jail** | <@${target.id}> (${target.user.tag})\n` +
          `> Moderator  : <@${message.author.id}>\n` +
          `> Sebep      : ${reason}\n` +
          `> Ceza Puani : ${yeniPuan}${tetiklenen ? `\n> Tetiklendi : ${tetiklenen}` : ''}`
        ).catch(() => {});
      }
    }

    await target.send(`**${message.guild.name}** sunucusunda jail cezasi aldin.\n> Sebep: ${reason}\n> Ceza puanin: ${yeniPuan}`).catch(() => {});
    return message.reply(`<@${target.id}> jail cezasi aldi. (Ceza Puani: ${yeniPuan}${tetiklenen ? ` | ${tetiklenen}` : ''})`);
  },
};
