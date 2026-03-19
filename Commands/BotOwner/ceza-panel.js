const {
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const Warn = require('../../global/models/Warn');
const StaffConfig = require('../../global/models/StaffConfig');
const { puanGetir, gecmisGetir, ESIKLER, PUAN_TABLOSU } = require('../../global/utils/cezaPuanHelper');
const settings = require('../../global/settings/settings.json');

const TIP_EMOJI = {
  warn: 'Uyari', mute: 'Mute', voicemute: 'Ses Mute', jail: 'Jail', ban: 'Ban',
  unwarn: 'Uyari Silindi', unmute: 'Mute Kaldirildi', unvoicemute: 'Ses Mute Kaldirildi',
  unjail: 'Jail Kaldirildi', unban: 'Ban Kaldirildi',
};

function formatSure(ms) {
  if (!ms || ms <= 0) return 'Bitti';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts = [];
  if (d) parts.push(`${d}g`);
  if (h) parts.push(`${h}s`);
  if (m) parts.push(`${m}d`);
  if (!parts.length) parts.push(`${s % 60}sn`);
  return parts.join(' ');
}

function puanBar(puan) {
  const max = 100;
  const dolu = Math.round((puan / max) * 10);
  const bos  = 10 - dolu;
  return `[${'█'.repeat(dolu)}${'░'.repeat(bos)}] ${puan}/100`;
}

module.exports = {
  name: 'ceza-panel',
  aliases: ['cezapanel'],
  category: 'BotOwner',
  async execute(message, args, focus) {
    if (message.author.id !== settings.ownerID)
      return message.reply('Bu komutu sadece bot sahibi kullanabilir.');

    const container = new ContainerBuilder();
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '**Ceza Bilgileri**\n' +
        '> Asagidaki butonlari kullanarak kendi ceza bilgilerini gorebilirsin.'
      )
    );
    container.addSeparatorComponents(
      new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
    );
    container.addActionRowComponents(
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('cezapanel_cezalarim')
          .setLabel('Cezalarım')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cezapanel_liste')
          .setLabel('Ceza Listesi')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('cezapanel_sure')
          .setLabel('Kalan Sürem')
          .setStyle(ButtonStyle.Primary),
      )
    );

    await message.channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
    await message.delete().catch(() => {});
  },

  async handleButton(interaction) {
    const id     = interaction.customId;
    const member = interaction.member;
    const guild  = interaction.guild;

    const [warns, puanDoc, cfg, gecmis] = await Promise.all([
      Warn.find({ guildId: guild.id, userId: member.id }).sort({ createdAt: -1 }),
      puanGetir(guild.id, member.id),
      StaffConfig.findOne({ guildId: guild.id }),
      gecmisGetir(guild.id, member.id, 15),
    ]);

    const puan     = puanDoc?.puan ?? 0;
    const muteBitis = member.communicationDisabledUntilTimestamp;
    const muteKalan = muteBitis && muteBitis > Date.now() ? muteBitis - Date.now() : null;
    const jailRolu  = cfg?.ceza_rolu;
    const jailVar   = jailRolu && member.roles.cache.has(jailRolu);

    const container = new ContainerBuilder();

    if (id === 'cezapanel_cezalarim') {
      const sonrakiEsik = ESIKLER.slice().reverse().find(e => puan < e.puan);
      const aktifLines = [];
      if (muteKalan) aktifLines.push(`> Mute — Kalan: **${formatSure(muteKalan)}** (<t:${Math.floor(muteBitis / 1000)}:R>)`);
      if (jailVar)   aktifLines.push('> Jail — Aktif');
      if (!aktifLines.length) aktifLines.push('> Aktif ceza yok.');

      const puanTablosu = Object.entries(PUAN_TABLOSU)
        .map(([t, p]) => `${TIP_EMOJI[t] || t}: +${p}p`)
        .join(' | ');

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Cezalarım**\n` +
          `> Ceza Puani  : \`${puanBar(puan)}\`\n` +
          `> Uyari Sayisi: **${warns.length}**`
        )
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Aktif Cezalar**\n${aktifLines.join('\n')}\n\n` +
          (sonrakiEsik
            ? `> Sonraki esik: **${sonrakiEsik.label}** — ${sonrakiEsik.puan - puan}p kaldi`
            : '> En yuksek esige ulasildi.')
        )
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`*Puan tablosu: ${puanTablosu}*`)
      );
    }

    if (id === 'cezapanel_liste') {
      const warnLines = warns.length
        ? warns.slice(0, 8).map((w, i) =>
            `> **${i + 1}.** <@${w.moderator}> — ${w.reason}\n> *(${new Date(w.createdAt).toLocaleDateString('tr-TR')})*`
          ).join('\n')
        : '> Uyari gecmisi yok.';

      const gecmisLines = gecmis.length
        ? gecmis.map(k => {
            const tarih = new Date(k.createdAt).toLocaleDateString('tr-TR');
            const sureStr = k.sure ? ` (${formatSure(k.sure)})` : '';
            const mod = k.moderator === 'AUTO' ? 'Otomatik' : `<@${k.moderator}>`;
            return `> **${TIP_EMOJI[k.tip] || k.tip}**${sureStr} — ${k.reason} | ${mod} *(${tarih})*`;
          }).join('\n')
        : '> Ceza gecmisi yok.';

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**Ceza Listesi**\n` +
          `> Toplam Uyari: **${warns.length}** | Ceza Puani: \`${puanBar(puan)}\``
        )
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Son 8 Uyari**\n${warnLines}`)
      );
      container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true)
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Tam Ceza Gecmisi** (son 15)\n${gecmisLines}`)
      );
    }

    if (id === 'cezapanel_sure') {
      const lines = [];
      if (muteKalan) {
        lines.push(
          `> Mute — Bitis: <t:${Math.floor(muteBitis / 1000)}:F>\n` +
          `> Kalan: **${formatSure(muteKalan)}** (<t:${Math.floor(muteBitis / 1000)}:R>)`
        );
      } else {
        lines.push('> Aktif mute yok.');
      }
      lines.push(jailVar ? '> Jail — Aktif (ceza rolu mevcut)' : '> Aktif jail yok.');

      const sonMute = gecmis.find(k => k.tip === 'mute');
      const sonJail = gecmis.find(k => k.tip === 'jail');

      if (sonMute) {
        lines.push(
          `\n> Son mute: ${sonMute.reason}` +
          (sonMute.sure ? ` (${formatSure(sonMute.sure)})` : '') +
          ` — <@${sonMute.moderator === 'AUTO' ? '' : sonMute.moderator}>${sonMute.moderator === 'AUTO' ? 'Otomatik' : ''} *(${new Date(sonMute.createdAt).toLocaleDateString('tr-TR')})*`
        );
      }
      if (sonJail) {
        lines.push(
          `> Son jail: ${sonJail.reason} — ` +
          `${sonJail.moderator === 'AUTO' ? 'Otomatik' : `<@${sonJail.moderator}>`} *(${new Date(sonJail.createdAt).toLocaleDateString('tr-TR')})*`
        );
      }

      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**Kalan Sürem**\n${lines.join('\n')}`)
      );
    }

    return interaction.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};
