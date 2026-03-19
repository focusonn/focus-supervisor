const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, MessageFlags,
} = require('discord.js');
const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const settings    = require('../../global/settings/settings.json');

function turkceKontrol(isim) {
  return /^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(isim);
}

module.exports = {
  name: 'isim',
  aliases: ['nick', 'n'],
  category: 'Register',
  async execute(message, args) {
    const yetkili =
      (await hasRole(message.member, message.guild.id, 'register', 'sorumluluk')) ||
      message.member.permissions.has('ManageGuild') ||
      message.author.id === settings.ownerID;
    if (!yetkili) return message.reply('Kayit sorumluluk rolune sahip olmalisin.');

    const target = message.mentions.members.first() ||
      await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply('Gecerli bir kullanici belirt.');

    const isim = args.slice(1).join(' ').trim();
    if (!isim) return message.reply('Yeni isim belirt.\nOrnek: `.isim @kullanici Ahmet`');
    if (!turkceKontrol(isim)) return message.reply('Isim sadece Turkce harf icermeli.');

    const eskiNick = target.nickname || target.user.username;
    await target.setNickname(isim).catch(() => {});

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (cfg?.kayitLogKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.kayitLogKanali);
      if (logKanal) {
        const lc = new ContainerBuilder();
        lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `**Isim Degisikligi**\n` +
          `> Kullanici : <@${target.id}>\n` +
          `> Eski Isim : ${eskiNick}\n` +
          `> Yeni Isim : ${isim}\n` +
          `> Yetkili   : <@${message.author.id}>\n` +
          `> Tarih     : <t:${Math.floor(Date.now() / 1000)}:R>`
        ));
        logKanal.send({ components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Isim Degistirildi**\n` +
      `> Kullanici : <@${target.id}>\n` +
      `> Eski      : ${eskiNick}\n` +
      `> Yeni      : **${isim}**\n` +
      `> Yetkili   : <@${message.author.id}>`
    ));
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
