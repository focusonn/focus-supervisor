const { getTop } = require('../../global/utils/statDB');
const { createCanvas, loadImage } = require('canvas');
const {
  AttachmentBuilder, ContainerBuilder, TextDisplayBuilder,
  MediaGalleryBuilder, MediaGalleryItemBuilder,
  ActionRowBuilder, StringSelectMenuBuilder, MessageFlags,
} = require('discord.js');
const { sendCanvasLog } = require('../../global/utils/logCanvas');
const { drawBase, roundRect, hexToRgb } = require('../../global/utils/canvasHelper');

const FIELDS = {
  mesaj:            { label: 'Mesaj',            color: '#38bdf8', birim: '' },
  ses:              { label: 'Ses',              color: '#34d399', birim: ' dk' },
  kamera:           { label: 'Kamera',           color: '#f472b6', birim: ' dk' },
  yayin:            { label: 'Yayin',            color: '#fb923c', birim: ' dk' },
  invite:           { label: 'Davet',            color: '#a78bfa', birim: '' },
  inviteKullanilan: { label: 'Kullanilan Davet', color: '#818cf8', birim: '' },
};

const MENU_OPTIONS = [
  { label: 'Mesaj',            value: 'mesaj',            description: 'En cok mesaj atanlar' },
  { label: 'Ses',              value: 'ses',              description: 'En cok ses kanalinda olanlar' },
  { label: 'Kamera',           value: 'kamera',           description: 'En cok kamera acanlar' },
  { label: 'Yayin',            value: 'yayin',            description: 'En cok yayin yapanlar' },
  { label: 'Davet',            value: 'invite',           description: 'En cok davet linki olusturanlar' },
  { label: 'Kullanilan Davet', value: 'inviteKullanilan', description: 'En cok davet edenler' },
];

async function buildTopCanvas(guild, entries, field) {
  const { label, color } = FIELDS[field];
  const { r, g, b } = hexToRgb(color);

  const W = 720;
  const ROW_H = 52;
  const HEADER_H = 90;
  const H = HEADER_H + Math.max(entries.length, 1) * ROW_H + 24;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  drawBase(ctx, W, H, color, '#0b0b14');

  
  const barG = ctx.createLinearGradient(0, 16, 0, HEADER_H - 16);
  barG.addColorStop(0, `rgba(${r},${g},${b},0)`);
  barG.addColorStop(0.5, color);
  barG.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = barG;
  ctx.fillRect(20, 16, 3, HEADER_H - 32);

  
  ctx.font = '700 22px Sans';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(`Top ${entries.length || 0}`, 36, 36);

  ctx.font = '400 12px Sans';
  ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
  ctx.fillText(label + ' Siralaması', 36, 60);

  
  ctx.font = '400 11px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'right';
  ctx.fillText(guild.name, W - 20, 36);
  ctx.textAlign = 'left';

  
  const hd = ctx.createLinearGradient(20, 0, W - 20, 0);
  hd.addColorStop(0, `rgba(${r},${g},${b},0.6)`);
  hd.addColorStop(0.5, `rgba(${r},${g},${b},0.2)`);
  hd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = hd;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, HEADER_H - 6);
  ctx.lineTo(W - 20, HEADER_H - 6);
  ctx.stroke();

  if (!entries.length) {
    ctx.font = '400 14px Sans';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Henüz veri yok.', W / 2, HEADER_H + 40);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    return canvas;
  }

  const medals = ['#ffd700', '#c0c0c0', '#cd7f32'];
  const maxVal = entries[0]?.[field] || 1;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const y = HEADER_H + i * ROW_H;
    const mid = y + ROW_H / 2;

    
    if (i % 2 === 0) {
      roundRect(ctx, 12, y + 3, W - 24, ROW_H - 6, 8);
      ctx.fillStyle = 'rgba(255,255,255,0.022)';
      ctx.fill();
    }

    
    if (i === 0) {
      roundRect(ctx, 12, y + 3, W - 24, ROW_H - 6, 8);
      ctx.fillStyle = `rgba(${r},${g},${b},0.08)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${r},${g},${b},0.2)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    
    const medalColor = medals[i] || 'rgba(255,255,255,0.2)';
    if (i < 3) {
      const mr = parseInt(medalColor.slice(1, 3), 16);
      const mg = parseInt(medalColor.slice(3, 5), 16);
      const mb = parseInt(medalColor.slice(5, 7), 16);
      roundRect(ctx, 18, mid - 13, 28, 26, 6);
      ctx.fillStyle = `rgba(${mr},${mg},${mb},0.18)`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${mr},${mg},${mb},0.4)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.font = i < 3 ? '700 13px Sans' : '400 11px Sans';
    ctx.fillStyle = medalColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, 32, mid);
    ctx.textAlign = 'left';

    
    const AVR = 16, AVX = 62, AVY = mid;
    try {
      const member = guild.members.cache.get(entry.userId);
      if (member) {
        const avImg = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 64 }));
        ctx.save();
        ctx.beginPath();
        ctx.arc(AVX, AVY, AVR, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(avImg, AVX - AVR, AVY - AVR, AVR * 2, AVR * 2);
        ctx.restore();
        ctx.strokeStyle = i === 0 ? color : 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(AVX, AVY, AVR + 1, 0, Math.PI * 2);
        ctx.stroke();
      }
    } catch {}

    
    const member = guild.members.cache.get(entry.userId);
    const name = member?.user.username || entry.userId;
    ctx.font = i === 0 ? '700 13px Sans' : i < 3 ? '600 12px Sans' : '400 12px Sans';
    ctx.fillStyle = i === 0 ? '#ffffff' : i < 3 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.length > 16 ? name.slice(0, 15) + '…' : name, 86, mid - 6);

    
    if (member?.nickname) {
      ctx.font = '400 10px Sans';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      const nick = member.nickname.length > 18 ? member.nickname.slice(0, 17) + '…' : member.nickname;
      ctx.fillText(nick, 86, mid + 8);
    }

    
    const barX = W - 260, barY = mid - 6, barW = 160, barH = 8;
    roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fillStyle = `rgba(${r},${g},${b},0.1)`;
    ctx.fill();

    const fill = Math.max(6, (entry[field] / maxVal) * barW);
    const fillG = ctx.createLinearGradient(barX, 0, barX + fill, 0);
    fillG.addColorStop(0, color);
    fillG.addColorStop(1, `rgba(${r},${g},${b},0.35)`);
    roundRect(ctx, barX, barY, fill, barH, 4);
    ctx.fillStyle = fillG;
    ctx.fill();

    
    ctx.font = i < 3 ? '700 12px Sans' : '400 11px Sans';
    ctx.fillStyle = i === 0 ? color : 'rgba(255,255,255,0.6)';
    ctx.textAlign = 'right';
    ctx.fillText(entry[field].toLocaleString() + FIELDS[field].birim, W - 16, mid);
    ctx.textAlign = 'left';
  }

  ctx.textBaseline = 'alphabetic';
  return canvas;
}

function buildMenu(currentField) {
  return new StringSelectMenuBuilder()
    .setCustomId('top_field')
    .setPlaceholder('Kategori seç...')
    .addOptions(MENU_OPTIONS.map(o => ({ ...o, default: o.value === currentField })));
}

async function buildAndSend(guild, field) {
  const entries = await getTop(guild.id, field, 10);
  const canvas  = await buildTopCanvas(guild, entries, field);
  const url     = await sendCanvasLog(guild, canvas);

  const { label, birim } = FIELDS[field];

  const c = new ContainerBuilder();
  if (url) {
    c.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url))
    );
  }
  c.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      entries.length
        ? `**Top 10 — ${label}**\n` +
          entries.map((e, i) => {
            const m = guild.members.cache.get(e.userId);
            const medals = ['1.', '2.', '3.'];
            const rank = medals[i] || `${i + 1}.`;
            return `> ${rank} **${m?.user.username || e.userId}** — \`${e[field].toLocaleString()}${birim}\``;
          }).join('\n')
        : `**Top 10 — ${label}**\n> Henuz veri yok.`
    )
  );
  c.addActionRowComponents(new ActionRowBuilder().addComponents(buildMenu(field)));

  const attachment = url ? null : new AttachmentBuilder(canvas.toBuffer(), { name: 'top.png' });
  return { container: c, attachment };
}

module.exports = {
  name: 'top',
  description: 'Sunucu sıralamalarını gösterir.',
  usage: '.top [mesaj/ses/kamera/yayin/davet]',
  aliases: ['siralama'],
  category: 'Istatistik',

  async execute(message, args, focus) {
    const fieldMap = {
      mesaj: 'mesaj', ses: 'ses', kamera: 'kamera',
      yayin: 'yayin', davet: 'invite', kullanilan: 'inviteKullanilan',
    };

    await message.guild.members.fetch().catch(() => {});

    const startField = fieldMap[(args[0] || '').toLowerCase()] || 'mesaj';
    const { container, attachment } = await buildAndSend(message.guild, startField);

    const sent = await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      files: attachment ? [attachment] : [],
    });

    const collector = sent.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id && i.customId === 'top_field',
      time: 120_000,
    });

    collector.on('collect', async interaction => {
      await interaction.deferUpdate();
      await message.guild.members.fetch().catch(() => {});
      const { container: nc, attachment: na } = await buildAndSend(message.guild, interaction.values[0]);
      await sent.edit({ components: [nc], flags: MessageFlags.IsComponentsV2, files: na ? [na] : [] });
    });
  },
};
