const { getUser, saveUser } = require('../../global/utils/ekonomiDB');
const { sendCanvasLog } = require('../../global/utils/logCanvas');
const { createCanvas } = require('canvas');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags } = require('discord.js');
const { drawBase, roundRect, hexToRgb } = require('../../global/utils/canvasHelper');

const COOLDOWN_MS = 30 * 1000;

module.exports = {
  name: 'cf',
  description: 'Yazi tura oyna.',
  usage: '.cf <miktar> <yazi/tura>',
  aliases: ['coinflip'],
  category: 'Ekonomi',

  async execute(message, args, focus) {
    const miktar = parseInt(args[0]);
    const secim = args[1]?.toLowerCase();

    if (!miktar || miktar <= 0 || !['yazi', 'tura'].includes(secim))
      return message.reply('Kullanim: `.cf <miktar> <yazi/tura>`');

    const user = await getUser(message.author.id);
    const now = Date.now();

    if (user.lastCF && now - new Date(user.lastCF).getTime() < COOLDOWN_MS) {
      const kalan = Math.ceil((COOLDOWN_MS - (now - new Date(user.lastCF).getTime())) / 1000);
      return message.reply(`CF icin **${kalan} saniye** beklemelisin.`);
    }

    if (user.bakiye < miktar)
      return message.reply(`Yetersiz bakiye. Mevcut: **${user.bakiye.toLocaleString()} coin**`);

    const sonuc = Math.random() < 0.5 ? 'yazi' : 'tura';
    const kazandi = sonuc === secim;
    user.bakiye += kazandi ? miktar : -miktar;
    user.lastCF = new Date();
    await saveUser(user);

    const color = kazandi ? '#2ecc71' : '#e74c3c';
    const { r, g, b } = hexToRgb(color);
    const W = 580, H = 200;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    drawBase(ctx, W, H, color, kazandi ? '#38bdf8' : '#8b5cf6');

    
    const CX = 80, CY = H / 2;
    const cg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 48);
    cg.addColorStop(0, `rgba(${r},${g},${b},0.25)`);
    cg.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(CX, CY, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${b},0.6)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(CX, CY, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '700 15px Sans';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(sonuc.toUpperCase(), CX, CY);

    
    const TX = 152;
    ctx.font = '700 28px Sans';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(kazandi ? 'KAZANDIN!' : 'KAYBETTIN!', TX, 72);

    ctx.font = '400 13px Sans';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`Secim: ${secim.toUpperCase()}  ·  Sonuc: ${sonuc.toUpperCase()}`, TX, 96);

    const dg = ctx.createLinearGradient(TX, 0, W - 24, 0);
    dg.addColorStop(0, 'rgba(255,255,255,0.12)');
    dg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = dg;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TX, 108);
    ctx.lineTo(W - 24, 108);
    ctx.stroke();

    ctx.font = '700 22px Sans';
    ctx.fillStyle = color;
    ctx.fillText(`${kazandi ? '+' : '-'}${miktar.toLocaleString()} coin`, TX, 142);

    ctx.font = '400 12px Sans';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText(`Yeni bakiye: ${user.bakiye.toLocaleString()} coin`, TX, 164);

    const url = await sendCanvasLog(message.guild, canvas);

    if (!url) {
      return message.reply(
        `**Coin Flip**\n` +
        `> Sonuc   : \`${sonuc.toUpperCase()}\`\n` +
        `> Kazanc  : \`${kazandi ? '+' : '-'}${miktar.toLocaleString()} coin\`\n` +
        `> Bakiye  : \`${user.bakiye.toLocaleString()} coin\``
      );
    }

    const container = new ContainerBuilder();
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url))
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Coin Flip**\n` +
        `> Sonuc   : \`${sonuc.toUpperCase()}\`\n` +
        `> Kazanc  : \`${kazandi ? '+' : '-'}${miktar.toLocaleString()} coin\`\n` +
        `> Bakiye  : \`${user.bakiye.toLocaleString()} coin\``
      )
    );

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
