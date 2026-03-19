const Warn = require('../../global/models/Warn');
const CezaGecmis = require('../../global/models/CezaGecmis');
const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const { puanAzalt } = require('../../global/utils/cezaPuanHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'unwarn',
  aliases: [],
  category: 'Ceza',
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, 'chat', 'sorumluluk') ||
                    message.member.permissions.has('ManageGuild') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin chat sorumluluk rolune sahip olmalisin.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    const warns = await Warn.find({ guildId: message.guild.id, userId: target.id }).sort({ createdAt: -1 });
    if (!warns.length) return message.reply('Bu kullanicinin uyarisi yok.');

    await Warn.findByIdAndDelete(warns[0]._id);
    const remaining = warns.length - 1;

    const yeniPuan = await puanAzalt(message.guild.id, target.id, 10);

    await CezaGecmis.create({
      guildId:   message.guild.id,
      userId:    target.id,
      tip:       'unwarn',
      moderator: message.author.id,
      reason:    'Uyari silindi',
    });

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (cfg?.logKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.logKanali);
      if (logKanal) {
        logKanal.send(
          `**Unwarn** | <@${target.id}> (${target.user.tag})\n` +
          `> Moderator  : <@${message.author.id}>\n` +
          `> Kalan      : ${remaining} uyari\n` +
          `> Ceza Puani : ${yeniPuan}`
        ).catch(() => {});
      }
    }

    return message.reply(`<@${target.id}> kullanicisinin son uyarisi silindi. (Kalan: ${remaining} | Ceza Puani: ${yeniPuan})`);
  },
};
