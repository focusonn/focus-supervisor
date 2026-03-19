const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const { puanEkle } = require('../../global/utils/cezaPuanHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'voicemute',
  aliases: ['vmute'],
  category: 'Ceza',
  async execute(message, args, focus) {
    const yetkili = await hasRole(message.member, message.guild.id, 'mute', 'sorumluluk') ||
                    message.member.permissions.has('ManageGuild') ||
                    message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Bu komutu kullanmak icin mute sorumluluk rolune sahip olmalisin.');

    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    const reason = args.slice(1).join(' ') || 'Sebep belirtilmedi';

    await target.voice.setMute(true, reason).catch(() => {});

    const { yeniPuan, tetiklenen } = await puanEkle(message.guild, target, 'voicemute', message.author.id, reason);

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (cfg?.logKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.logKanali);
      if (logKanal) {
        logKanal.send(
          `**Voice Mute** | <@${target.id}> (${target.user.tag})\n` +
          `> Moderator  : <@${message.author.id}>\n` +
          `> Sebep      : ${reason}\n` +
          `> Ceza Puani : ${yeniPuan}${tetiklenen ? `\n> Tetiklendi : ${tetiklenen}` : ''}`
        ).catch(() => {});
      }
    }

    return message.reply(`<@${target.id}> ses kanalinda susturuldu. (Ceza Puani: ${yeniPuan}${tetiklenen ? ` | ${tetiklenen}` : ''})`);
  },
};
