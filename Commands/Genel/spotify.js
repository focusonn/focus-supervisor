const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const { sendCanvasLog } = require('../../global/utils/logCanvas');
const { roundRect, hexToRgb } = require('../../global/utils/canvasHelper');

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

const SPOTIFY_GREEN = '#1db954';

async function buildSpotifyCanvas(member, spotify) {
  const W = 760, H = 220;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  
  ctx.fillStyle = '#0b0b14';
  ctx.fillRect(0, 0, W, H);

  
  const g1 = ctx.createRadialGradient(0, H, 0, 0, H, 300);
  g1.addColorStop(0, 'rgba(29,185,84,0.18)');
  g1.addColorStop(1, 'rgba(29,185,84,0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, W, H);

  
  const g2 = ctx.createRadialGradient(W, 0, 0, W, 0, 280);
  g2.addColorStop(0, 'rgba(139,92,246,0.12)');
  g2.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 0, W, H);

  
  const tl = ctx.createLinearGradient(0, 0, W, 0);
  tl.addColorStop(0, 'rgba(29,185,84,0)');
  tl.addColorStop(0.4, 'rgba(29,185,84,0.8)');
  tl.addColorStop(0.6, 'rgba(139,92,246,0.8)');
  tl.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.strokeStyle = tl;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, 1);
  ctx.lineTo(W, 1);
  ctx.stroke();

  
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 14);
  ctx.stroke();

  
  const AX = 28, AY = 28, AW = 164, AH = 164, AR = 10;
  try {
    const img = await loadImage(spotify.albumCoverURL);
    ctx.save();
    roundRect(ctx, AX, AY, AW, AH, AR);
    ctx.clip();
    ctx.drawImage(img, AX, AY, AW, AH);
    ctx.restore();
  } catch {
    roundRect(ctx, AX, AY, AW, AH, AR);
    ctx.fillStyle = '#1a1a2e';
    ctx.fill();
  }

  
  ctx.strokeStyle = 'rgba(29,185,84,0.4)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, AX, AY, AW, AH, AR);
  ctx.stroke();

  const TX = AX + AW + 24;

  
  const { r: sg, g: gg, b: bg } = hexToRgb(SPOTIFY_GREEN);
  ctx.beginPath();
  ctx.arc(TX + 7, 46, 7, 0, Math.PI * 2);
  ctx.fillStyle = SPOTIFY_GREEN;
  ctx.fill();
  ctx.font = '600 11px Sans';
  ctx.fillStyle = `rgba(${sg},${gg},${bg},0.85)`;
  ctx.textBaseline = 'middle';
  ctx.fillText('SPOTIFY\'DA DINLIYOR', TX + 20, 46);
  ctx.textBaseline = 'alphabetic';

  
  ctx.font = '700 26px Sans';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(truncate(spotify.song, 28), TX, 82);

  
  ctx.font = '400 14px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(truncate(spotify.artist, 40), TX, 104);

  
  ctx.font = '400 12px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText(truncate(spotify.album, 44), TX, 122);

  
  const dg = ctx.createLinearGradient(TX, 0, W - 24, 0);
  dg.addColorStop(0, 'rgba(255,255,255,0.12)');
  dg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = dg;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(TX, 136);
  ctx.lineTo(W - 24, 136);
  ctx.stroke();

  
  const now = Date.now();
  const elapsed = now - spotify.timestamps.start;
  const total = spotify.timestamps.end - spotify.timestamps.start;
  const progress = Math.min(elapsed / total, 1);

  const BAR_X = TX, BAR_Y = 152, BAR_W = W - TX - 24, BAR_H = 5;

  
  roundRect(ctx, BAR_X, BAR_Y, BAR_W, BAR_H, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();

  
  const fillW = Math.max(BAR_H, BAR_W * progress);
  const barGrad = ctx.createLinearGradient(BAR_X, 0, BAR_X + fillW, 0);
  barGrad.addColorStop(0, SPOTIFY_GREEN);
  barGrad.addColorStop(1, '#57f287');
  roundRect(ctx, BAR_X, BAR_Y, fillW, BAR_H, 3);
  ctx.fillStyle = barGrad;
  ctx.fill();

  
  function fmtMs(ms) {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  ctx.font = '400 11px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.textBaseline = 'top';
  ctx.fillText(fmtMs(elapsed), BAR_X, BAR_Y + 10);
  ctx.textAlign = 'right';
  ctx.fillText(fmtMs(total), BAR_X + BAR_W, BAR_Y + 10);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  
  ctx.font = '400 11px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(member.user.username, W - 16, H - 12);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  return canvas;
}

module.exports = {
  name: 'spotify',
  aliases: ['sp', 'muzik'],
  category: 'Genel',
  async execute(message, args, focus) {
    const target = message.mentions.members.first() || message.member;

    
    const presence = target.presence;
    const spotify = presence?.activities?.find(a => a.name === 'Spotify' && a.type === 2);

    if (!spotify) {
      return message.reply(`**${target.user.username}** su an Spotify dinlemiyor.`);
    }

    const spotifyData = {
      song:          spotify.details   || 'Bilinmiyor',
      artist:        spotify.state     || 'Bilinmiyor',
      album:         spotify.assets?.largeText || 'Bilinmiyor',
      albumCoverURL: spotify.assets?.largeImageURL() || null,
      timestamps:    spotify.timestamps || { start: Date.now(), end: Date.now() + 1 },
    };

    const canvas = await buildSpotifyCanvas(target, spotifyData);

    const url = await sendCanvasLog(message.guild, canvas);
    if (url) return message.reply({ content: url });
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'spotify.png' });
    return message.reply({ files: [attachment] });
  },
};
