const { getUser, getTop } = require('../../global/utils/statDB');
const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags } = require('discord.js');
const { sendCanvasLog } = require('../../global/utils/logCanvas');
const { drawBase, roundRect, hexToRgb } = require('../../global/utils/canvasHelper');

async function buildStatCanvas(member, stat, rank) {
  const W = 900, H = 300;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  drawBase(ctx, W, H, '#38bdf8', '#8b5cf6');

  
  const panelW = 180;
  roundRect(ctx, 0, 0, panelW, H, 14);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();

  
  const AX = panelW / 2, AY = 80, AR = 46;
  try {
    const av = await loadImage(member.displayAvatarURL({ extension: 'png', size: 256 }));
    ctx.save();
    ctx.beginPath();
    ctx.arc(AX, AY, AR, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(av, AX - AR, AY - AR, AR * 2, AR * 2);
    ctx.restore();
  } catch {}

  
  const ring = ctx.createLinearGradient(AX - AR, AY - AR, AX + AR, AY + AR);
  ring.addColorStop(0, '#38bdf8');
  ring.addColorStop(1, '#8b5cf6');
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(AX, AY, AR + 2, 0, Math.PI * 2);
  ctx.stroke();

  
  ctx.font = '700 13px Sans';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const uname = member.username.length > 12 ? member.username.slice(0, 11) + '…' : member.username;
  ctx.fillText(uname, AX, AY + AR + 20);

  
  if (member.displayName && member.displayName !== member.username) {
    const dname = member.displayName.length > 14 ? member.displayName.slice(0, 13) + '…' : member.displayName;
    ctx.font = '400 11px Sans';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(dname, AX, AY + AR + 36);
  }

  
  if (rank) {
    roundRect(ctx, AX - 28, AY + AR + 44, 56, 22, 6);
    ctx.fillStyle = 'rgba(56,189,248,0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56,189,248,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.font = '700 11px Sans';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`#${rank} Sıra`, AX, AY + AR + 59);
  }

  
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panelW, 20);
  ctx.lineTo(panelW, H - 20);
  ctx.stroke();

  
  const RX = panelW + 24;
  ctx.textAlign = 'left';

  ctx.font = '700 20px Sans';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('İstatistikler', RX, 44);

  ctx.font = '400 11px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillText(member.guild?.name || '', RX, 62);

  
  const dg = ctx.createLinearGradient(RX, 0, W - 20, 0);
  dg.addColorStop(0, 'rgba(56,189,248,0.5)');
  dg.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.strokeStyle = dg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(RX, 72);
  ctx.lineTo(W - 20, 72);
  ctx.stroke();

  
  const boxes = [
    { label: 'Mesaj',  value: (stat.mesaj ?? 0).toLocaleString(),            color: '#38bdf8' },
    { label: 'Davet',  value: (stat.inviteKullanilan ?? 0).toLocaleString(), color: '#a78bfa' },
    { label: 'Ses',    value: (stat.ses ?? 0).toLocaleString() + ' dk',      color: '#34d399' },
    { label: 'Kamera', value: (stat.kamera ?? 0).toLocaleString() + ' dk',   color: '#f472b6' },
    { label: 'Yayin',  value: (stat.yayin ?? 0).toLocaleString() + ' dk',    color: '#fb923c' },
  ];

  const cols = 5, BW = 120, BH = 90, BGAP = 10;
  const startX = RX;
  const BY = 88;

  boxes.forEach((box, i) => {
    const bx = startX + i * (BW + BGAP);
    const { r, g, b } = hexToRgb(box.color);

    roundRect(ctx, bx, BY, BW, BH, 10);
    const boxGrad = ctx.createLinearGradient(bx, BY, bx, BY + BH);
    boxGrad.addColorStop(0, `rgba(${r},${g},${b},0.12)`);
    boxGrad.addColorStop(1, `rgba(${r},${g},${b},0.04)`);
    ctx.fillStyle = boxGrad;
    ctx.fill();
    ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    
    roundRect(ctx, bx + 10, BY, BW - 20, 2, 1);
    ctx.fillStyle = `rgba(${r},${g},${b},0.7)`;
    ctx.fill();

    
    ctx.font = '700 18px Sans';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(box.value, bx + BW / 2, BY + 44);

    
    ctx.font = '400 10px Sans';
    ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
    ctx.fillText(box.label, bx + BW / 2, BY + 68);
  });

  
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '400 10px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillText(`ID: ${member.id}`, RX, H - 14);

  ctx.textAlign = 'right';
  ctx.fillText(new Date().toLocaleDateString('tr-TR'), W - 16, H - 14);
  ctx.textAlign = 'left';

  return canvas;
}

module.exports = {
  name: 'stat',
  description: 'Kullanicinin istatistiklerini gosterir.',
  usage: '.stat [@kullanici]',
  aliases: ['istatistik', 'stats'],
  category: 'Istatistik',

  async execute(message, args, focus) {
    const target = message.mentions.members.first() || message.member;
    const stat   = await getUser(message.guild.id, target.id);

    
    const topList = await getTop(message.guild.id, 'mesaj', 100);
    const rank = topList.findIndex(e => e.userId === target.id) + 1 || null;

    const canvas = await buildStatCanvas(target.user, stat, rank);
    const url = await sendCanvasLog(message.guild, canvas);

    if (url) {
      const container = new ContainerBuilder();
      container.addMediaGalleryComponents(
        new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url))
      );
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `**${target.user.username} — Istatistikler**\n` +
          `> Mesaj  : \`${stat.mesaj ?? 0}\`\n` +
          `> Davet  : \`${stat.inviteKullanilan ?? 0}\`\n` +
          `> Ses    : \`${stat.ses ?? 0} dk\`\n` +
          `> Kamera : \`${stat.kamera ?? 0} dk\`\n` +
          `> Yayin  : \`${stat.yayin ?? 0} dk\``
        )
      );
      return message.reply({ components: [container], flags: MessageFlags.IsComponentsV2 });
    }

    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'stat.png' });
    return message.reply({ files: [attachment] });
  },
};
