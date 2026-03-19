const { createCanvas } = require('canvas');
const { AttachmentBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags } = require('discord.js');
const { sendCanvasLog } = require('../../global/utils/logCanvas');
const { drawBase, roundRect, hexToRgb } = require('../../global/utils/canvasHelper');

async function buildUrlCanvas(guild, vanity, uses) {
  const W = 680, H = 160;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  drawBase(ctx, W, H, '#57f287', '#5865f2');

  
  const { r, g, b } = hexToRgb('#57f287');
  roundRect(ctx, 24, 40, 80, 80, 12);
  ctx.fillStyle = `rgba(${r},${g},${b},0.1)`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '700 32px Sans';
  ctx.fillStyle = '#57f287';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🔗', 64, 80);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  
  ctx.font = '700 20px Sans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('discord.gg/' + vanity, 124, 72);

  ctx.font = '400 12px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(guild.name + ' — Sunucu URL', 124, 92);

  
  const dg = ctx.createLinearGradient(124, 0, W - 24, 0);
  dg.addColorStop(0, 'rgba(255,255,255,0.12)');
  dg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = dg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(124, 104);
  ctx.lineTo(W - 24, 104);
  ctx.stroke();

  
  if (uses !== null) {
    const { r: r2, g: g2, b: b2 } = hexToRgb('#5865f2');
    roundRect(ctx, 124, 114, 160, 30, 6);
    ctx.fillStyle = `rgba(${r2},${g2},${b2},0.12)`;
    ctx.fill();
    ctx.strokeStyle = `rgba(${r2},${g2},${b2},0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '600 12px Sans';
    ctx.fillStyle = '#5865f2';
    ctx.textBaseline = 'middle';
    ctx.fillText(`Kullanim: ${uses.toLocaleString()}`, 136, 129);
    ctx.textBaseline = 'alphabetic';
  }

  return canvas;
}

module.exports = {
  name: 'url',
  aliases: ['vanity', 'davet'],
  category: 'Genel',
  async execute(message, args, focus) {
    const guild = message.guild;

    if (!guild.vanityURLCode) {
      return message.reply('Bu sunucunun ozel bir URL\'si yok. (Sunucu boost seviyesi 3 gereklidir.)');
    }

    let uses = null;
    try {
      const vanityData = await guild.fetchVanityData();
      uses = vanityData.uses;
    } catch {}

    const vanity = guild.vanityURLCode;
    const canvas = await buildUrlCanvas(guild, vanity, uses);

    const url = await sendCanvasLog(guild, canvas);

    if (url) {
      const container = new ContainerBuilder();
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url))
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**${guild.name} — Sunucu URL**\n` +
          `> Link     : \`discord.gg/${vanity}\`\n` +
          (uses !== null ? `> Kullanim : \`${uses.toLocaleString()}\`\n` : '') +
          `> Boost Lv : \`${guild.premiumTier}\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    
    return message.reply(
      `**${guild.name} — Sunucu URL**\n` +
      `> Link     : \`discord.gg/${vanity}\`\n` +
      (uses !== null ? `> Kullanim : \`${uses.toLocaleString()}\`\n` : '') +
      `> Boost Lv : \`${guild.premiumTier}\``
    );
  },
};
