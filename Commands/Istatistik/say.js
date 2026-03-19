const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags } = require('discord.js');
const { sendCanvasLog } = require('../../global/utils/logCanvas');
const { drawBase, roundRect, hexToRgb } = require('../../global/utils/canvasHelper');

async function buildSayCanvas(guild) {
  const W = 860, H = 300;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  drawBase(ctx, W, H, '#5865f2', '#eb459e');

  
  const BANNER_H = 100;

  
  const IX = 60, IY = BANNER_H / 2 + 20, IR = 48;
  try {
    const iconUrl = guild.iconURL({ extension: 'png', size: 256 });
    if (iconUrl) {
      const img = await loadImage(iconUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(IX, IY, IR, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, IX - IR, IY - IR, IR * 2, IR * 2);
      ctx.restore();
    }
  } catch {}

  
  const ring = ctx.createLinearGradient(IX - IR, IY - IR, IX + IR, IY + IR);
  ring.addColorStop(0, '#5865f2');
  ring.addColorStop(1, '#eb459e');
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(IX, IY, IR + 2, 0, Math.PI * 2);
  ctx.stroke();

  
  const TX = IX + IR + 20;
  ctx.font = '700 26px Sans';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(guild.name.length > 28 ? guild.name.slice(0, 27) + '…' : guild.name, TX, IY - 6);

  
  const tier = guild.premiumTier;
  if (tier > 0) {
    const tierColors = { 1: '#f47fff', 2: '#e879f9', 3: '#c026d3' };
    const tc = tierColors[tier] || '#f47fff';
    const { r: tr, g: tg, b: tb } = hexToRgb(tc);
    roundRect(ctx, TX, IY + 4, 72, 18, 5);
    ctx.fillStyle = `rgba(${tr},${tg},${tb},0.15)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${tr},${tg},${tb},0.5)`;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '700 10px Sans';
    ctx.fillStyle = tc;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(`✦ Seviye ${tier}`, TX + 36, IY + 13);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  
  ctx.font = '400 11px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText(`ID: ${guild.id}`, TX, IY + 30);

  
  const dg = ctx.createLinearGradient(20, 0, W - 20, 0);
  dg.addColorStop(0, 'rgba(88,101,242,0.6)');
  dg.addColorStop(0.5, 'rgba(235,69,158,0.3)');
  dg.addColorStop(1, 'rgba(235,69,158,0)');
  ctx.strokeStyle = dg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, BANNER_H + 20);
  ctx.lineTo(W - 20, BANNER_H + 20);
  ctx.stroke();

  
  const members      = guild.memberCount;
  const bots         = guild.members.cache.filter(m => m.user.bot).size;
  const humans       = members - bots;
  const voiceMembers = guild.channels.cache.filter(c => c.type === 2).reduce((a, c) => a + c.members.size, 0);
  const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
  const voiceChannels= guild.channels.cache.filter(c => c.type === 2).size;
  const categories   = guild.channels.cache.filter(c => c.type === 4).size;
  const roles        = guild.roles.cache.size - 1;
  const boosts       = guild.premiumSubscriptionCount ?? 0;
  const emojis       = guild.emojis.cache.size;

  const boxes = [
    { label: 'Uye',      value: humans.toLocaleString(),        color: '#5865f2', sub: `${bots} bot` },
    { label: 'Seste',    value: voiceMembers.toLocaleString(),  color: '#57f287', sub: 'aktif' },
    { label: 'Metin',    value: textChannels.toLocaleString(),  color: '#fee75c', sub: 'kanal' },
    { label: 'Ses',      value: voiceChannels.toLocaleString(), color: '#38bdf8', sub: 'kanal' },
    { label: 'Kategori', value: categories.toLocaleString(),    color: '#a78bfa', sub: '' },
    { label: 'Rol',      value: roles.toLocaleString(),         color: '#eb459e', sub: '' },
    { label: 'Boost',    value: boosts.toLocaleString(),        color: '#ff73fa', sub: `lv ${tier}` },
    { label: 'Emoji',    value: emojis.toLocaleString(),        color: '#fb923c', sub: '' },
  ];

  const cols = 4, rows = 2;
  const BW = 176, BH = 72, BGAP_X = 12, BGAP_Y = 10;
  const startX = 20, startY = BANNER_H + 34;

  boxes.forEach((box, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const bx = startX + col * (BW + BGAP_X);
    const by = startY + row * (BH + BGAP_Y);
    const { r, g, b } = hexToRgb(box.color);

    
    roundRect(ctx, bx, by, BW, BH, 10);
    const bg = ctx.createLinearGradient(bx, by, bx + BW, by + BH);
    bg.addColorStop(0, `rgba(${r},${g},${b},0.1)`);
    bg.addColorStop(1, `rgba(${r},${g},${b},0.03)`);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    
    roundRect(ctx, bx, by + 12, 3, BH - 24, 2);
    ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
    ctx.fill();

    
    ctx.font = '700 20px Sans';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(box.value, bx + 14, by + BH / 2 - 6);

    
    ctx.font = '400 10px Sans';
    ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
    ctx.fillText(box.label + (box.sub ? ` · ${box.sub}` : ''), bx + 14, by + BH / 2 + 14);
  });

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  
  ctx.font = '400 10px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.textAlign = 'right';
  ctx.fillText(new Date().toLocaleString('tr-TR'), W - 16, H - 10);
  ctx.textAlign = 'left';

  return canvas;
}

module.exports = {
  name: 'say',
  aliases: ['sunucustat', 'serverstat'],
  category: 'Istatistik',
  async execute(message, args, focus) {
    await message.guild.members.fetch().catch(() => {});
    const canvas = await buildSayCanvas(message.guild);
    const url = await sendCanvasLog(message.guild, canvas);

    if (url) {
      const container = new ContainerBuilder();
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url))
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`**${message.guild.name} — Sunucu İstatistikleri**`)
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'say.png' });
    return message.reply({ files: [attachment] });
  },
};
