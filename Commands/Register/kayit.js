const {
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
  SeparatorSpacingSize, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');
const StaffConfig = require('../../global/models/StaffConfig');
const { hasRole } = require('../../global/utils/staffHelper');
const { getUser } = require('../../global/utils/statDB');
const settings    = require('../../global/settings/settings.json');

function turkceKontrol(isim) {
  return /^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(isim);
}

async function kayitYap(guild, target, isim, erkekMi, yetkiliId) {
  const cfg = await StaffConfig.findOne({ guildId: guild.id });
  if (!cfg) return null;

  const rolId = erkekMi ? cfg.erkekRolu : cfg.kizRolu;
  if (!rolId) return null;

  const verilen = [];
  await target.roles.add(rolId).catch(() => {});
  verilen.push(`<@&${rolId}>`);

  if (cfg.ortakRolu) {
    await target.roles.add(cfg.ortakRolu).catch(() => {});
    verilen.push(`<@&${cfg.ortakRolu}>`);
  }

  if (cfg.kayitsizRolu && target.roles.cache.has(cfg.kayitsizRolu)) {
    await target.roles.remove(cfg.kayitsizRolu).catch(() => {});
  }

  await target.setNickname(isim).catch(() => {});

  const stat = await getUser(guild.id, yetkiliId);
  stat.kayit = (stat.kayit || 0) + 1;
  await stat.save();

  if (cfg.kayitLogKanali) {
    const logKanal = guild.channels.cache.get(cfg.kayitLogKanali);
    if (logKanal) {
      const lc = new ContainerBuilder();
      lc.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `**Kayit — ${erkekMi ? 'Erkek' : 'Kiz'}**\n` +
        `> Kullanici : <@${target.id}> (\`${target.user.tag}\`)\n` +
        `> Isim      : ${isim}\n` +
        `> Verilen   : ${verilen.join(' ')}\n` +
        `> Yetkili   : <@${yetkiliId}>\n` +
        `> Tarih     : <t:${Math.floor(Date.now() / 1000)}:R>`
      ));
      logKanal.send({ components: [lc], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    }
  }

  const hesapTs   = Math.floor(target.user.createdTimestamp / 1000);
  const katilmaTs = Math.floor((target.joinedTimestamp || Date.now()) / 1000);
  const yeniHesap = Date.now() - target.user.createdTimestamp < 7 * 24 * 60 * 60 * 1000;

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `## Kayit Tamamlandi — ${erkekMi ? 'Erkek' : 'Kiz'}\n` +
    `> Kullanici : <@${target.id}>\n` +
    `> Isim      : **${isim}**\n` +
    `> Verilen   : ${verilen.join(' ')}`
  ));
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
  container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `> Hesap   : <t:${hesapTs}:D> (<t:${hesapTs}:R>)\n` +
    `> Katilma : <t:${katilmaTs}:R>\n` +
    (yeniHesap ? '> Hesap yeni — dikkatli ol.\n' : '') +
    `> Yetkili : <@${yetkiliId}>`
  ));
  container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
  container.addActionRowComponents(new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`kayit_sicil_${target.id}`).setLabel('Sicil Sorgula').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(`kayit_iptal_${target.id}_${yetkiliId}`).setLabel('Geri Al').setStyle(ButtonStyle.Danger),
  ));

  return container;
}

module.exports = {
  name: 'kayit',
  aliases: ['k'],
  category: 'Register',
  kayitYap,

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
    if (!isim) return message.reply('Isim belirt.\nOrnek: `.kayit @kullanici Ahmet`');
    if (!turkceKontrol(isim)) return message.reply('Isim sadece Turkce harf icermeli.');

    
    const container = new ContainerBuilder();
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
      `**Kayit — Cinsiyet Sec**\n` +
      `> Kullanici : <@${target.id}>\n` +
      `> Isim      : **${isim}**\n\n` +
      `Asagidan cinsiyet secin.`
    ));
    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));
    container.addActionRowComponents(new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`kayit_erkek_${target.id}_${message.author.id}_${encodeURIComponent(isim)}`)
        .setLabel('Erkek')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`kayit_kiz_${target.id}_${message.author.id}_${encodeURIComponent(isim)}`)
        .setLabel('Kiz')
        .setStyle(ButtonStyle.Danger),
    ));

    return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
