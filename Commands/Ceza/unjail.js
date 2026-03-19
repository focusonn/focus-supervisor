const StaffConfig = require('../../global/models/StaffConfig');
const CezaGecmis = require('../../global/models/CezaGecmis');
const { hasRole } = require('../../global/utils/staffHelper');
const { puanAzalt } = require('../../global/utils/cezaPuanHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'unjail',
  aliases: [],
  category: 'Ceza',
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, 'ban_jail', 'sorumluluk') ||
                    message.member.permissions.has('ManageGuild') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin ban_jail sorumluluk rolune sahip olmalisin.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (!cfg?.ceza_rolu) return message.reply('Ceza rolu ayarlanmamis.');

    await target.roles.remove(cfg.ceza_rolu).catch(() => {});

    const yeniPuan = await puanAzalt(message.guild.id, target.id, 20);

    await CezaGecmis.create({
      guildId:   message.guild.id,
      userId:    target.id,
      tip:       'unjail',
      moderator: message.author.id,
      reason:    'Jail kaldirildi',
    });

    if (cfg?.logKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.logKanali);
      if (logKanal) {
        logKanal.send(
          `**Unjail** | <@${target.id}> (${target.user.tag})\n` +
          `> Moderator  : <@${message.author.id}>\n` +
          `> Ceza Puani : ${yeniPuan}`
        ).catch(() => {});
      }
    }

    return message.reply(`<@${target.id}> kullanicisinin jail cezasi kaldirildi. (Ceza Puani: ${yeniPuan})`);
  },
};
