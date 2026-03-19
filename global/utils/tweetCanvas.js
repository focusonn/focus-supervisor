const { createCanvas, loadImage } = require('canvas');
const { drawBase, roundRect, hexToRgb } = require('./canvasHelper');

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function drawTweet(tweet) {
  const W = 680;
  const PADDING = 28;
  const AVATAR_SIZE = 52;
  const CONTENT_X = PADDING + AVATAR_SIZE + 16;
  const CONTENT_W = W - CONTENT_X - PADDING;

  const tempCanvas = createCanvas(W, 100);
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.font = '400 15px Sans';
  const lines = wrapText(tempCtx, tweet.content, CONTENT_W);
  const lineH = 22;
  const contentH = lines.length * lineH;

  const H = PADDING + AVATAR_SIZE + 14 + contentH + 20 + 1 + 20 + 36 + PADDING;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  drawBase(ctx, W, H, '#1d9bf0', '#8b5cf6');

  
  const AX = PADDING, AY = PADDING;
  try {
    const img = await loadImage(tweet.authorAvatar);
    ctx.save();
    ctx.beginPath();
    ctx.arc(AX + AVATAR_SIZE / 2, AY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, AX, AY, AVATAR_SIZE, AVATAR_SIZE);
    ctx.restore();
  } catch {
    ctx.fillStyle = 'rgba(29,155,240,0.3)';
    ctx.beginPath();
    ctx.arc(AX + AVATAR_SIZE / 2, AY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = 'rgba(29,155,240,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(AX + AVATAR_SIZE / 2, AY + AVATAR_SIZE / 2, AVATAR_SIZE / 2, 0, Math.PI * 2);
  ctx.stroke();

  
  ctx.font = '700 15px Sans';
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(tweet.authorUsername, CONTENT_X, AY + 20);

  
  const date = new Date(tweet.createdAt);
  const dateStr = `${date.getDate().toString().padStart(2,'0')}.${(date.getMonth()+1).toString().padStart(2,'0')}.${date.getFullYear()}  ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
  ctx.font = '400 12px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillText(dateStr, CONTENT_X, AY + 38);

  
  ctx.font = '700 18px Sans';
  ctx.fillStyle = 'rgba(29,155,240,0.7)';
  ctx.textAlign = 'right';
  ctx.fillText('X', W - PADDING, AY + 20);
  ctx.textAlign = 'left';

  
  const textY = AY + AVATAR_SIZE + 14;
  ctx.font = '400 15px Sans';
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], CONTENT_X, textY + i * lineH);
  }

  
  const sepY = textY + contentH + 20;
  const sepGrad = ctx.createLinearGradient(PADDING, 0, W - PADDING, 0);
  sepGrad.addColorStop(0, 'rgba(255,255,255,0)');
  sepGrad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
  sepGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.strokeStyle = sepGrad;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING, sepY);
  ctx.lineTo(W - PADDING, sepY);
  ctx.stroke();

  
  const statY = sepY + 20;
  const stats = [
    { label: 'Begeni', value: tweet.likes.length, color: '#f91880' },
    { label: 'Repost', value: tweet.reposts.length, color: '#00ba7c' },
    { label: 'Yorum', value: tweet.comments.length, color: '#1d9bf0' },
  ];
  const statW = (W - PADDING * 2) / 3;
  for (let i = 0; i < stats.length; i++) {
    const sx = PADDING + i * statW;
    const { r, g, b } = hexToRgb(stats[i].color);
    ctx.font = '700 16px Sans';
    ctx.fillStyle = stats[i].color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stats[i].value.toString(), sx + statW / 2, statY + 8);
    ctx.font = '400 11px Sans';
    ctx.fillStyle = `rgba(${r},${g},${b},0.6)`;
    ctx.fillText(stats[i].label, sx + statW / 2, statY + 24);
  }

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  return canvas;
}

module.exports = { drawTweet };
