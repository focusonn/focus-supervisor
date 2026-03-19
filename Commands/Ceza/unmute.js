const StaffConfig = require('../../global/models/StaffConfig');
const CezaGecmis = require('../../global/models/CezaGecmis');
const { hasRole } = require('../../global/utils/staffHelper');
const { puanAzalt } = require('../../global/utils/cezaPuanHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'unmute',
  aliases: [],
  category: 'Ceza',
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, 'mute', 'sorumluluk') ||
                    message.member.permissions.has('ManageGuild') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin mute sorumluluk rolune sahip olmalisin.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    await target.timeout(null).catch(() => {});

    const yeniPuan = await puanAzalt(message.guild.id, target.id, 10);

    await CezaGecmis.create({
      guildId:   message.guild.id,
      userId:    target.id,
      tip:       'unmute',
      moderator: message.author.id,
      reason:    'Mute kaldirildi',
    });

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (cfg?.logKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.logKanali);
      if (logKanal) {
        logKanal.send(
          `**Unmute** | <@${target.id}> (${target.user.tag})\n` +
          `> Moderator  : <@${message.author.id}>\n` +
          `> Ceza Puani : ${yeniPuan}`
        ).catch(() => {});
      }
    }

    return message.reply(`<@${target.id}> kullanicisinin susturmasi kaldirildi. (Ceza Puani: ${yeniPuan})`);
  },
};
