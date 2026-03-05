const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 48, 128];
const outDir = path.join(__dirname, 'icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const r = size * 0.15;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#1a8cd8');
  gradient.addColorStop(1, '#1d9bf0');
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(1, size * 0.06);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.28;

  const topY = cy - s * 0.95;
  const botY = cy + s * 0.85;
  const leftX = cx - s * 0.6;
  const rightX = cx + s * 0.6;
  const peakY = cy - s * 0.4;

  ctx.beginPath();
  ctx.moveTo(leftX, topY);
  ctx.lineTo(leftX, botY);
  ctx.lineTo(cx, botY - s * 0.4);
  ctx.lineTo(rightX, botY);
  ctx.lineTo(rightX, topY);

  ctx.lineTo(leftX, topY);
  ctx.closePath();

  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.stroke();

  const filePath = path.join(outDir, `icon${size}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
  console.log(`Generated ${filePath}`);
}

console.log('All icons generated!');
