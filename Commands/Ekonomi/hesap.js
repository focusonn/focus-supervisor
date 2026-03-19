const { getUser } = require('../../global/utils/ekonomiDB');
const { sendCanvasLog } = require('../../global/utils/logCanvas');
const { createCanvas, loadImage } = require('canvas');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags } = require('discord.js');
const { drawBase, roundRect, drawStatBox } = require('../../global/utils/canvasHelper');

module.exports = {
  name: 'hesap',
  description: 'Ekonomi hesabini goruntule.',
  usage: '.hesap [@kullanici]',
  aliases: ['bal', 'bakiye'],
  category: 'Ekonomi',

  async execute(message, args, focus) {
    const target = message.mentions.users.first() || message.author;
    const user = await getUser(target.id);

    const W = 680, H = 210;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    drawBase(ctx, W, H, '#e94560', '#f5a623');

    
    const AX = 56, AY = H / 2, AR = 52;
    try {
      const av = await loadImage(target.displayAvatarURL({ extension: 'png', size: 128 }));
      ctx.save();
      ctx.beginPath();
      ctx.arc(AX, AY, AR, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(av, AX - AR, AY - AR, AR * 2, AR * 2);
      ctx.restore();
    } catch {}

    const ring = ctx.createLinearGradient(AX - AR, AY - AR, AX + AR, AY + AR);
    ring.addColorStop(0, '#e94560');
    ring.addColorStop(1, '#f5a623');
    ctx.strokeStyle = ring;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(AX, AY, AR + 1, 0, Math.PI * 2);
    ctx.stroke();

    const TX = AX + AR + 22;

    ctx.font = '700 21px Sans';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(target.username, TX, 65);

    ctx.font = '400 12px Sans';
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillText('Ekonomi Hesabi', TX, 84);

    const dg = ctx.createLinearGradient(TX, 0, W - 24, 0);
    dg.addColorStop(0, 'rgba(255,255,255,0.15)');
    dg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = dg;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(TX, 96);
    ctx.lineTo(W - 24, 96);
    ctx.stroke();

    drawStatBox(ctx, TX, 110, 160, 72, 'Bakiye', `${user.bakiye.toLocaleString()} coin`, '#e94560');

    const url = await sendCanvasLog(message.guild, canvas);

    if (!url) {
      return message.reply(
        `**${target.username} Hesabi**\n> Bakiye : \`${user.bakiye.toLocaleString()} coin\``
      );
    }

    const container = new ContainerBuilder();
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url))
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**${target.username} Hesabi**\n> Bakiye : \`${user.bakiye.toLocaleString()} coin\``
      )
    );

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
