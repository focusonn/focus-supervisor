const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, MessageFlags,
} = require('discord.js');
const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const settings    = require('../../global/settings/settings.json');

module.exports = {
  name: 'kayitsiz',
  aliases: ['ks'],
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

    const cfg = await StaffConfig.findOne({ guildId: message.guild.id });
    if (!cfg) return message.reply('Sunucu ayarlari bulunamadi.');

    
    const kaldirilacak = [cfg.erkekRolu, cfg.kizRolu, cfg.ortakRolu].filter(Boolean);
    const kaldirildi = [];
    for (const rid of kaldirilacak) {
      if (target.roles.cache.has(rid)) {
        await target.roles.remove(rid).catch(() => {});
        kaldirildi.push(`<@&${rid}>`);
      }
    }

    
    if (cfg.kayitsizRolu && !target.roles.cache.has(cfg.kayitsizRolu)) {
      await target.roles.add(cfg.kayitsizRolu).catch(() => {});
    }

    
    await target.setNickname(null).catch(() => {});

    if (cfg.kayitLogKanali) {
      const logKanal = message.guild.channels.cache.get(cfg.kayitLogKanali);
      if (logKanal) {
        const lc = new ContainerBuilder();
        lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
          `**Kayitsiz**\n` +
          `> Kullanici  : <@${target.id}> (\`${target.user.tag}\`)\n` +
          `> Kaldirildi : ${kaldirildi.join(' ') || 'Kayit rolu yoktu'}\n` +
          `> Yetkili    : <@${message.author.id}>\n` +
          `> Tarih      : <t:${Math.floor(Date.now() / 1000)}:R>`
        ));
        logKanal.send({ components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
      }
    }

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Kayitsiz Yapildi**\n` +
      `> Kullanici  : <@${target.id}>\n` +
      `> Kaldirildi : ${kaldirildi.join(' ') || 'Kayit rolu yoktu'}\n` +
      (cfg.kayitsizRolu ? `> Verilen    : <@&${cfg.kayitsizRolu}>\n` : '') +
      `> Yetkili    : <@${message.author.id}>`
    ));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `> Nick sifirlandi.`
    ));
    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
