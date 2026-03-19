const { getUser, saveUser } = require('../../global/utils/ekonomiDB');
const { sendCanvasLog } = require('../../global/utils/logCanvas');
const { createCanvas } = require('canvas');
const { ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags } = require('discord.js');
const { drawBase, roundRect, hexToRgb } = require('../../global/utils/canvasHelper');

const DAILY_AMOUNT = 500;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

module.exports = {
  name: 'daily',
  description: 'Gunluk odulunu al.',
  usage: '.daily',
  aliases: ['gunluk'],
  category: 'Ekonomi',

  async execute(message, args, focus) {
    const user = await getUser(message.author.id);
    const now = Date.now();

    if (user.lastDaily && now - new Date(user.lastDaily).getTime() < COOLDOWN_MS) {
      const kalan = COOLDOWN_MS - (now - new Date(user.lastDaily).getTime());
      const saat = Math.floor(kalan / 3600000);
      const dakika = Math.floor((kalan % 3600000) / 60000);
      return message.reply(`Gunluk odulunu zaten aldin. Kalan sure: **${saat}s ${dakika}dk**`);
    }

    user.bakiye += DAILY_AMOUNT;
    user.lastDaily = new Date();
    await saveUser(user);

    const W = 560, H = 180;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');
    const color = '#f5a623';
    const { r, g, b } = hexToRgb(color);

    drawBase(ctx, W, H, color, '#e94560');

    
    const CX = W / 2, CY = 72;
    const cg = ctx.createRadialGradient(CX, CY, 0, CX, CY, 36);
    cg.addColorStop(0, `rgba(${r},${g},${b},0.3)`);
    cg.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.arc(CX, CY, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(CX, CY, 36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '700 22px Sans';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DAILY', CX, CY);

    ctx.font = '700 26px Sans';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`+${DAILY_AMOUNT.toLocaleString()} coin`, CX, 128);

    ctx.font = '400 13px Sans';
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText(`Toplam: ${user.bakiye.toLocaleString()} coin`, CX, 152);

    ctx.textAlign = 'left';

    const url = await sendCanvasLog(message.guild, canvas);

    if (!url) {
      return message.reply(
        `**Gunluk Odul**\n> +\`${DAILY_AMOUNT}\` coin kazandin!\n> Toplam: \`${user.bakiye.toLocaleString()} coin\``
      );
    }

    const container = new ContainerBuilder();
    container.addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url))
    );
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `**Gunluk Odul**\n> +\`${DAILY_AMOUNT}\` coin kazandin!\n> Toplam: \`${user.bakiye.toLocaleString()} coin\``
      )
    );

    message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
  },
};
