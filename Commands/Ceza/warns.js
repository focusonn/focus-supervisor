const Warn = require('../../global/models/Warn');
const { hasRole } = require('../../global/utils/staffHelper');
const settings = require('../../global/settings/settings.json');

module.exports = {
  name: 'warns',
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
    if (!warns.length) return message.reply(`<@${target.id}> kullanicisinin uyarisi yok.`);

    const list = warns.map((w, i) =>
      `**${i + 1}.** <@${w.moderator}> — ${w.reason} *(${new Date(w.createdAt).toLocaleDateString('tr-TR')})*`
    ).join('\n');

    return message.reply(`**${target.user.tag}** uyarilari (${warns.length}):\n${list}`);
  },
};
