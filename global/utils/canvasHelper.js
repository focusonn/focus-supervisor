function hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawBase(ctx, W, H, accent1 = '#ff6b6b', accent2 = '#8b5cf6') {
  const { r: r1, g: g1, b: b1 } = hexToRgb(accent1);
  const { r: r2, g: g2, b: b2 } = hexToRgb(accent2);

  ctx.fillStyle = '#0b0b14';
  ctx.fillRect(0, 0, W, H);

  const gl1 = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.55);
  gl1.addColorStop(0, `rgba(${r1},${g1},${b1},0.14)`);
  gl1.addColorStop(1, `rgba(${r1},${g1},${b1},0)`);
  ctx.fillStyle = gl1;
  ctx.fillRect(0, 0, W, H);

  const gl2 = ctx.createRadialGradient(W, H, 0, W, H, W * 0.5);
  gl2.addColorStop(0, `rgba(${r2},${g2},${b2},0.12)`);
  gl2.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
  ctx.fillStyle = gl2;
  ctx.fillRect(0, 0, W, H);

  
  const tl = ctx.createLinearGradient(0, 0, W, 0);
  tl.addColorStop(0, `rgba(${r1},${g1},${b1},0)`);
  tl.addColorStop(0.4, `rgba(${r1},${g1},${b1},0.8)`);
  tl.addColorStop(0.6, `rgba(${r2},${g2},${b2},0.8)`);
  tl.addColorStop(1, `rgba(${r2},${g2},${b2},0)`);
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
}

function drawSectionLabel(ctx, x, y, text, color) {
  const { r, g, b } = hexToRgb(color);
  ctx.beginPath();
  ctx.arc(x + 5, y, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.font = '700 11px Sans';
  ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), x + 14, y);
  ctx.textBaseline = 'alphabetic';
}

function drawStatBox(ctx, x, y, w, h, label, value, color) {
  const { r, g, b } = hexToRgb(color);
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = `rgba(${r},${g},${b},0.08)`;
  ctx.fill();
  ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.font = '700 20px Sans';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(value, x + w / 2, y + h / 2 - 8);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '400 11px Sans';
  ctx.fillText(label, x + w / 2, y + h / 2 + 12);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

module.exports = { hexToRgb, roundRect, drawBase, drawSectionLabel, drawStatBox };
