const Warn = require('../../global/models/Warn');
const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const { puanEkle } = require('../../global/utils/cezaPuanHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'warn',
  aliases: [],
  category: 'Ceza',
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, 'chat', 'sorumluluk') ||
                    message.member.permissions.has('ManageGuild') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin chat sorumluluk rolune sahip olmalisin.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    await Warn.create({ guildId: message.guild.id, userId: target.id, moderator: message.author.id, reason });
    const count = await Warn.countDocuments({ guildId: message.guild.id, userId: target.id });

    const { yeniPuan, tetiklenen } = await puanEkle(message.guild, target, 'warn', message.author.id, reason);

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (cfg?.logKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.logKanali);
      if (logKanal) {
        logKanal.send(
          `**Warn** | <@${target.id}> (${target.user.tag})\n` +
          `> Moderator   : <@${message.author.id}>\n` +
          `> Sebep       : ${reason}\n` +
          `> Uyari Sayisi: ${count}\n` +
          `> Ceza Puani  : ${yeniPuan}${tetiklenen ? `\n> Tetiklendi  : ${tetiklenen}` : ''}`
        ).catch(() => {});
      }
    }

    await target.send(`**${message.guild.name}** sunucusunda uyari aldin.\n> Sebep: ${reason}\n> Toplam uyari: ${count}\n> Ceza puanin: ${yeniPuan}`).catch(() => {});
    return message.reply(`<@${target.id}> uyari verildi. (Uyari: ${count} | Ceza Puani: ${yeniPuan}${tetiklenen ? ` | ${tetiklenen}` : ''})`);
  },
};
