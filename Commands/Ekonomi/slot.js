const { getUser, saveUser } = require('../../global/utils/ekonomiDB');
const { sendCanvasLog } = require('../../global/utils/logCanvas');
const { drawBase, roundRect } = require('../../global/utils/canvasHelper');
const { createCanvas } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

const SEMBOLLER = ['7', 'BAR', 'ELMA', 'LIMON', 'KIRAZ', 'UZUM'];
const COOLDOWN_MS = 15 * 1000;

function rastgele() {
  return SEMBOLLER[Math.floor(Math.random() * SEMBOLLER.length)];
}

function carp(s1, s2, s3) {
  if (s1 === s2 && s2 === s3) {
    if (s1 === '7') return 10;
    if (s1 === 'BAR') return 5;
    return 3;
  }
  if (s1 === s2 || s2 === s3 || s1 === s3) return 1.5;
  return 0;
}

async function drawFrame(canvas, s1, s2, s3, carpan, miktar, bakiye, animating) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  drawBase(ctx, W, H, '#ff6b6b', '#8b5cf6');

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 13px Sans';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SLOT MAKINESI', W / 2, 28);
  ctx.textBaseline = 'alphabetic';

  const slotW = 130;
  const slotH = 90;
  const gap = 16;
  const totalW = 3 * slotW + 2 * gap;
  const startX = (W - totalW) / 2;
  const startY = 50;

  for (let i = 0; i < 3; i++) {
    const sx = startX + i * (slotW + gap);
    roundRect(ctx, sx, startY, slotW, slotH, 10);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fill();
    ctx.strokeStyle = animating ? 'rgba(255,255,255,0.12)' : 'rgba(139,92,246,0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  const semboller = [s1, s2, s3];
  ctx.font = '700 26px Sans';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    const sx = startX + i * (slotW + gap);
    ctx.fillStyle = animating ? 'rgba(255,255,255,0.25)' : '#ffffff';
    ctx.fillText(semboller[i], sx + slotW / 2, startY + slotH / 2);
  }

  if (!animating) {
    const kazanc = carpan === 0 ? -miktar : Math.floor(miktar * carpan);
    const renk = carpan === 0 ? '#ff6b6b' : '#4ade80';

    ctx.fillStyle = renk;
    ctx.font = '700 18px Sans';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const sonucText = carpan === 0
      ? `-${miktar.toLocaleString()} coin`
      : `+${Math.abs(kazanc).toLocaleString()} coin  (x${carpan})`;
    ctx.fillText(sonucText, W / 2, startY + slotH + 28);

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '400 12px Sans';
    ctx.fillText(`Yeni bakiye: ${bakiye.toLocaleString()} coin`, W / 2, startY + slotH + 52);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

module.exports = {
  name: 'slot',
  description: 'Slot makinesi oyna.',
  usage: '.slot <miktar>',
  aliases: [],
  category: 'Ekonomi',

  async execute(message, args, focus) {
    const miktar = parseInt(args[0]);
    if (!miktar || miktar <= 0) return message.reply('Kullanim: `.slot <miktar>`');

    const user = await getUser(message.author.id);
    const now = Date.now();

    if (user.lastSlot && now - new Date(user.lastSlot).getTime() < COOLDOWN_MS) {
      const kalan = Math.ceil((COOLDOWN_MS - (now - new Date(user.lastSlot).getTime())) / 1000);
      return message.reply(`Slot icin **${kalan} saniye** beklemelisin.`);
    }

    if (user.bakiye < miktar) {
      return message.reply(`Yetersiz bakiye. Mevcut: **${user.bakiye.toLocaleString()} coin**`);
    }

    const canvas = createCanvas(520, 220);

    const s1 = rastgele(), s2 = rastgele(), s3 = rastgele();

    let sent;
    for (let i = 0; i < 6; i++) {
      await drawFrame(canvas, rastgele(), rastgele(), rastgele(), 0, miktar, user.bakiye, true);
      const buf = canvas.toBuffer();
      if (!sent) {
        sent = await message.reply({ files: [new AttachmentBuilder(buf, { name: 'slot.png' })] });
      } else {
        await sent.edit({ files: [new AttachmentBuilder(buf, { name: 'slot.png' })] });
      }
      await new Promise(r => setTimeout(r, 300));
    }

    const carpan = carp(s1, s2, s3);
    const kazanc = carpan === 0 ? -miktar : Math.floor(miktar * carpan);
    user.bakiye += kazanc;
    user.lastSlot = new Date();
    await saveUser(user);

    await drawFrame(canvas, s1, s2, s3, carpan, miktar, user.bakiye, false);
    const finalBuf = canvas.toBuffer();
    await sent.edit({ files: [new AttachmentBuilder(finalBuf, { name: 'slot.png' })] });

    await sendCanvasLog(message.guild, canvas);
  },
};
