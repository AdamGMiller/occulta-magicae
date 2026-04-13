/**
 * Procedural Card Art Generator — Expansion Cards
 * Creates illuminated manuscript-style art for expansion cards using Node.js canvas.
 * Each card gets unique colors, symbols, and patterns.
 */
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const SIZE = 1024;
const OUT_DIR = path.join(__dirname, 'images');

// ── Color palettes keyed by theme ──
const PALETTES = {
  necromancy:  { bg: '#1a1a2e', accent: '#4ade80', gold: '#c4a030', border: '#2d5a3d', glow: '#22c55e' },
  runes:      { bg: '#1e293b', accent: '#f59e0b', gold: '#d4a840', border: '#78350f', glow: '#fbbf24' },
  hymns:      { bg: '#1e1b4b', accent: '#a78bfa', gold: '#c4a030', border: '#4c1d95', glow: '#c4b5fd' },
  body:       { bg: '#3b0d0d', accent: '#ef4444', gold: '#c4a030', border: '#7f1d1d', glow: '#fca5a5' },
  strife:     { bg: '#1c1917', accent: '#dc2626', gold: '#c4a030', border: '#451a03', glow: '#f87171' },
  holy:       { bg: '#1c1917', accent: '#fbbf24', gold: '#d4a840', border: '#78350f', glow: '#fde68a' },
  fey:        { bg: '#042f2e', accent: '#34d399', gold: '#a3e635', border: '#065f46', glow: '#6ee7b7' },
  ghost:      { bg: '#0f172a', accent: '#94a3b8', gold: '#c4a030', border: '#1e3a5f', glow: '#cbd5e1' },
  infernal:   { bg: '#1a0a0a', accent: '#ef4444', gold: '#c4a030', border: '#7f1d1d', glow: '#f87171' },
  norse:      { bg: '#292524', accent: '#f59e0b', gold: '#d4a840', border: '#44403c', glow: '#fcd34d' },
  merchant:   { bg: '#1c1917', accent: '#0ea5e9', gold: '#c4a030', border: '#164e63', glow: '#38bdf8' },
  familiar:   { bg: '#0c0a09', accent: '#22c55e', gold: '#c4a030', border: '#14532d', glow: '#4ade80' },
  roman:      { bg: '#1e1b2e', accent: '#e2c48a', gold: '#d4a840', border: '#3b3560', glow: '#fde68a' },
  volcanic:   { bg: '#1a0a00', accent: '#f97316', gold: '#c4a030', border: '#7c2d12', glow: '#fb923c' },
  garden:     { bg: '#052e16', accent: '#a3e635', gold: '#c4a030', border: '#166534', glow: '#bef264' },
  cave:       { bg: '#0a0a0a', accent: '#4ade80', gold: '#c4a030', border: '#14532d', glow: '#86efac' },
  grove:      { bg: '#0a1e0a', accent: '#22c55e', gold: '#d4a840', border: '#14532d', glow: '#4ade80' },
  ocean:      { bg: '#0c1929', accent: '#06b6d4', gold: '#c4a030', border: '#155e75', glow: '#22d3ee' },
  dragon:     { bg: '#1a0f00', accent: '#f59e0b', gold: '#d4a840', border: '#78350f', glow: '#fbbf24' },
  apollo:     { bg: '#1e1b00', accent: '#fbbf24', gold: '#eab308', border: '#713f12', glow: '#fde68a' },
  purgatory:  { bg: '#1a0a00', accent: '#f97316', gold: '#c4a030', border: '#7c2d12', glow: '#fdba74' },
  babel:      { bg: '#1c1410', accent: '#d4a840', gold: '#c4a030', border: '#44403c', glow: '#fde68a' },
  ward:       { bg: '#0c1929', accent: '#3b82f6', gold: '#c4a030', border: '#1e3a8a', glow: '#93c5fd' },
  divination: { bg: '#2e1065', accent: '#a78bfa', gold: '#c4a030', border: '#4c1d95', glow: '#c4b5fd' },
  invisibility:{ bg: '#1e293b', accent: '#94a3b8', gold: '#c4a030', border: '#334155', glow: '#e2e8f0' },
  elemental:  { bg: '#0c0a09', accent: '#f59e0b', gold: '#c4a030', border: '#78350f', glow: '#fbbf24' },
  elixir:     { bg: '#052e16', accent: '#a3e635', gold: '#d4a840', border: '#166534', glow: '#bef264' },
  talisman:   { bg: '#1e1b2e', accent: '#c4a030', gold: '#d4a840', border: '#3b3560', glow: '#fde68a' },
  automaton:  { bg: '#1c1917', accent: '#f59e0b', gold: '#b45309', border: '#78350f', glow: '#fbbf24' },
  grimoire:   { bg: '#0a0a0a', accent: '#4ade80', gold: '#c4a030', border: '#14532d', glow: '#86efac' },
  lab:        { bg: '#1c1917', accent: '#f59e0b', gold: '#c4a030', border: '#44403c', glow: '#fcd34d' },
  gargoyle:   { bg: '#1c1917', accent: '#9ca3af', gold: '#c4a030', border: '#374151', glow: '#d1d5db' },
  creo:       { bg: '#052e16', accent: '#22c55e', gold: '#d4a840', border: '#166534', glow: '#4ade80' },
  intellego:  { bg: '#0c1929', accent: '#3b82f6', gold: '#c4a030', border: '#1e3a8a', glow: '#93c5fd' },
  muto:       { bg: '#052e16', accent: '#a3e635', gold: '#c4a030', border: '#365314', glow: '#bef264' },
  perdo:      { bg: '#1a0a1a', accent: '#a855f7', gold: '#c4a030', border: '#581c87', glow: '#c084fc' },
  rego:       { bg: '#0c1929', accent: '#06b6d4', gold: '#c4a030', border: '#155e75', glow: '#22d3ee' },
};

// ── Drawing primitives ──

function drawParchmentBg(ctx, pal) {
  // Base gradient
  const g = ctx.createRadialGradient(SIZE/2, SIZE/2, 0, SIZE/2, SIZE/2, SIZE*0.7);
  g.addColorStop(0, pal.bg);
  g.addColorStop(0.7, pal.bg);
  g.addColorStop(1, '#000000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Parchment noise texture
  for (let i = 0; i < 15000; i++) {
    const x = Math.random() * SIZE;
    const y = Math.random() * SIZE;
    const a = Math.random() * 0.08;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(SIZE/2, SIZE/2, SIZE*0.25, SIZE/2, SIZE/2, SIZE*0.55);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.7, 'rgba(0,0,0,0.3)');
  g.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, SIZE, SIZE);
}

function drawKnotworkBorder(ctx, pal, thickness = 28) {
  const t = thickness;
  ctx.strokeStyle = pal.gold;
  ctx.lineWidth = 3;

  // Outer border
  roundRect(ctx, t/2, t/2, SIZE - t, SIZE - t, 12);
  ctx.stroke();

  // Inner border
  ctx.strokeStyle = pal.border;
  ctx.lineWidth = 2;
  roundRect(ctx, t + 4, t + 4, SIZE - 2*t - 8, SIZE - 2*t - 8, 8);
  ctx.stroke();

  // Knotwork segments along border
  ctx.strokeStyle = pal.gold;
  ctx.lineWidth = 1.5;
  const segments = 16;
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cx = SIZE/2 + Math.cos(angle) * (SIZE/2 - t/2);
    const cy = SIZE/2 + Math.sin(angle) * (SIZE/2 - t/2);

    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.stroke();

    // Connecting lines
    const nextAngle = ((i + 1) / segments) * Math.PI * 2;
    const nx = SIZE/2 + Math.cos(nextAngle) * (SIZE/2 - t/2);
    const ny = SIZE/2 + Math.sin(nextAngle) * (SIZE/2 - t/2);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const midX = (cx + nx) / 2 + Math.sin(angle) * 8;
    const midY = (cy + ny) / 2 - Math.cos(angle) * 8;
    ctx.quadraticCurveTo(midX, midY, nx, ny);
    ctx.stroke();
  }

  // Corner ornaments
  drawCornerOrnament(ctx, t, t, pal);
  drawCornerOrnament(ctx, SIZE - t, t, pal);
  drawCornerOrnament(ctx, t, SIZE - t, pal);
  drawCornerOrnament(ctx, SIZE - t, SIZE - t, pal);
}

function drawCornerOrnament(ctx, x, y, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = pal.gold;
  for (let i = 0; i < 4; i++) {
    ctx.rotate(Math.PI / 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8, -8, 16, 0);
    ctx.quadraticCurveTo(8, 8, 0, 0);
    ctx.fill();
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// ── Symbolic motifs ──

function drawCentralCircle(ctx, pal, innerDraw) {
  const cx = SIZE/2, cy = SIZE/2, r = SIZE * 0.22;

  // Outer glow
  const g = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.3);
  g.addColorStop(0, pal.glow + '40');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Circle
  ctx.strokeStyle = pal.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = pal.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  if (innerDraw) innerDraw(ctx, cx, cy, r);
}

function drawStar(ctx, cx, cy, points, outerR, innerR, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI / points) - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function drawCross(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  const w = size * 0.2;
  ctx.fillRect(cx - w/2, cy - size/2, w, size);
  ctx.fillRect(cx - size/2, cy - w/2, size, w);
}

function drawSkull(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  // Cranium
  ctx.beginPath();
  ctx.arc(cx, cy - size*0.1, size * 0.35, Math.PI, 0);
  ctx.lineTo(cx + size*0.25, cy + size*0.1);
  ctx.quadraticCurveTo(cx, cy + size*0.35, cx - size*0.25, cy + size*0.1);
  ctx.closePath();
  ctx.stroke();
  // Eyes
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx - size*0.12, cy - size*0.05, size*0.06, 0, Math.PI*2);
  ctx.arc(cx + size*0.12, cy - size*0.05, size*0.06, 0, Math.PI*2);
  ctx.fill();
}

function drawRuneSymbols(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  // Fehu-like rune
  ctx.beginPath();
  ctx.moveTo(cx - size*0.3, cy - size*0.4);
  ctx.lineTo(cx - size*0.3, cy + size*0.4);
  ctx.moveTo(cx - size*0.3, cy - size*0.4);
  ctx.lineTo(cx + size*0.1, cy - size*0.15);
  ctx.moveTo(cx - size*0.3, cy - size*0.1);
  ctx.lineTo(cx + size*0.1, cy + size*0.1);
  ctx.stroke();

  // Ansuz-like rune
  ctx.beginPath();
  ctx.moveTo(cx + size*0.15, cy - size*0.4);
  ctx.lineTo(cx + size*0.15, cy + size*0.4);
  ctx.moveTo(cx + size*0.15, cy - size*0.2);
  ctx.lineTo(cx + size*0.4, cy - size*0.35);
  ctx.moveTo(cx + size*0.15, cy + size*0.0);
  ctx.lineTo(cx + size*0.4, cy - size*0.15);
  ctx.stroke();
}

function drawEye(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  // Eye outline
  ctx.beginPath();
  ctx.moveTo(cx - size*0.4, cy);
  ctx.quadraticCurveTo(cx, cy - size*0.3, cx + size*0.4, cy);
  ctx.quadraticCurveTo(cx, cy + size*0.3, cx - size*0.4, cy);
  ctx.stroke();
  // Iris
  ctx.beginPath();
  ctx.arc(cx, cy, size*0.12, 0, Math.PI*2);
  ctx.fill();
  // Pupil
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx, cy, size*0.05, 0, Math.PI*2);
  ctx.fill();
}

function drawFlame(ctx, cx, cy, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - size * 0.5);
  ctx.quadraticCurveTo(cx + size*0.2, cy - size*0.2, cx + size*0.15, cy + size*0.1);
  ctx.quadraticCurveTo(cx + size*0.05, cy, cx + size*0.08, cy + size*0.3);
  ctx.quadraticCurveTo(cx, cy + size*0.15, cx - size*0.08, cy + size*0.3);
  ctx.quadraticCurveTo(cx - size*0.05, cy, cx - size*0.15, cy + size*0.1);
  ctx.quadraticCurveTo(cx - size*0.2, cy - size*0.2, cx, cy - size*0.5);
  ctx.fill();
}

function drawTree(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  // Trunk
  ctx.beginPath();
  ctx.moveTo(cx, cy + size*0.4);
  ctx.lineTo(cx, cy - size*0.1);
  ctx.stroke();
  // Branches
  const branches = [[0.1, -0.3], [0.25, -0.2], [0.15, -0.4], [0.3, -0.15]];
  for (const [dx, dy] of branches) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * size);
    ctx.lineTo(cx + dx * size, cy + (dy - 0.15) * size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy + dy * size);
    ctx.lineTo(cx - dx * size, cy + (dy - 0.15) * size);
    ctx.stroke();
  }
  // Canopy
  ctx.fillStyle = color + '30';
  ctx.beginPath();
  ctx.arc(cx, cy - size*0.25, size*0.3, 0, Math.PI*2);
  ctx.fill();
}

function drawSword(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  // Blade
  ctx.beginPath();
  ctx.moveTo(cx, cy - size*0.45);
  ctx.lineTo(cx, cy + size*0.15);
  ctx.stroke();
  // Point
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - size*0.04, cy - size*0.45);
  ctx.lineTo(cx, cy - size*0.55);
  ctx.lineTo(cx + size*0.04, cy - size*0.45);
  ctx.closePath();
  ctx.fill();
  // Guard
  ctx.beginPath();
  ctx.moveTo(cx - size*0.15, cy + size*0.15);
  ctx.lineTo(cx + size*0.15, cy + size*0.15);
  ctx.stroke();
  // Handle
  ctx.beginPath();
  ctx.moveTo(cx, cy + size*0.15);
  ctx.lineTo(cx, cy + size*0.35);
  ctx.stroke();
  // Pommel
  ctx.beginPath();
  ctx.arc(cx, cy + size*0.38, size*0.04, 0, Math.PI*2);
  ctx.fill();
}

function drawGear(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const teeth = 8;
  const inner = size * 0.25;
  const outer = size * 0.35;
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? outer : inner;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
  // Axle
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.08, 0, Math.PI * 2);
  ctx.stroke();
}

function drawOrb(ctx, cx, cy, size, color) {
  const g = ctx.createRadialGradient(cx - size*0.1, cy - size*0.1, 0, cx, cy, size*0.35);
  g.addColorStop(0, color + 'cc');
  g.addColorStop(0.5, color + '44');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(cx - size*0.1, cy - size*0.1, size*0.08, 0, Math.PI*2);
  ctx.fill();
}

function drawColumn(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  // Shaft
  ctx.fillStyle = color + '20';
  ctx.fillRect(cx - size*0.08, cy - size*0.35, size*0.16, size*0.7);
  ctx.strokeRect(cx - size*0.08, cy - size*0.35, size*0.16, size*0.7);
  // Capital
  ctx.fillRect(cx - size*0.14, cy - size*0.4, size*0.28, size*0.06);
  // Base
  ctx.fillRect(cx - size*0.14, cy + size*0.34, size*0.28, size*0.06);
}

function drawWaves(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let row = 0; row < 3; row++) {
    const y = cy + (row - 1) * size * 0.2;
    ctx.beginPath();
    for (let x = cx - size*0.4; x <= cx + size*0.4; x += 2) {
      const wy = y + Math.sin((x - cx) * 0.08 + row) * size * 0.05;
      if (x === cx - size*0.4) ctx.moveTo(x, wy); else ctx.lineTo(x, wy);
    }
    ctx.stroke();
  }
}

function drawMountain(ctx, cx, cy, size, color) {
  ctx.fillStyle = color + '40';
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - size*0.4, cy + size*0.3);
  ctx.lineTo(cx - size*0.05, cy - size*0.35);
  ctx.lineTo(cx + size*0.05, cy - size*0.35);
  ctx.lineTo(cx + size*0.4, cy + size*0.3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Snow cap
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.moveTo(cx - size*0.05, cy - size*0.35);
  ctx.lineTo(cx + size*0.05, cy - size*0.35);
  ctx.lineTo(cx + size*0.12, cy - size*0.2);
  ctx.lineTo(cx - size*0.12, cy - size*0.2);
  ctx.closePath();
  ctx.fill();
}

function drawRing(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  // Ring ellipse
  ctx.beginPath();
  ctx.ellipse(cx, cy, size*0.3, size*0.15, 0, 0, Math.PI*2);
  ctx.stroke();
  // Gem
  ctx.fillStyle = color;
  drawStar(ctx, cx, cy - size*0.14, 4, size*0.06, size*0.03, color);
  // Inner glow
  const g = ctx.createRadialGradient(cx, cy - size*0.14, 0, cx, cy - size*0.14, size*0.1);
  g.addColorStop(0, color + '60');
  g.addColorStop(1, 'transparent');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy - size*0.14, size*0.1, 0, Math.PI*2);
  ctx.fill();
}

function drawBook(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  // Book cover
  ctx.fillStyle = color + '20';
  roundRect(ctx, cx - size*0.25, cy - size*0.3, size*0.5, size*0.6, 4);
  ctx.fill();
  ctx.stroke();
  // Spine
  ctx.beginPath();
  ctx.moveTo(cx, cy - size*0.3);
  ctx.lineTo(cx, cy + size*0.3);
  ctx.stroke();
  // Pages
  for (let i = 0; i < 4; i++) {
    const y = cy - size*0.2 + i * size*0.1;
    ctx.beginPath();
    ctx.moveTo(cx + size*0.05, y);
    ctx.lineTo(cx + size*0.2, y);
    ctx.stroke();
  }
}

function drawLyre(ctx, cx, cy, size, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  // Frame
  ctx.beginPath();
  ctx.moveTo(cx - size*0.15, cy + size*0.3);
  ctx.quadraticCurveTo(cx - size*0.25, cy - size*0.1, cx - size*0.15, cy - size*0.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + size*0.15, cy + size*0.3);
  ctx.quadraticCurveTo(cx + size*0.25, cy - size*0.1, cx + size*0.15, cy - size*0.35);
  ctx.stroke();
  // Crossbar
  ctx.beginPath();
  ctx.moveTo(cx - size*0.15, cy - size*0.35);
  ctx.lineTo(cx + size*0.15, cy - size*0.35);
  ctx.stroke();
  // Strings
  for (let i = 0; i < 5; i++) {
    const x = cx - size*0.1 + i * size*0.05;
    ctx.beginPath();
    ctx.moveTo(x, cy - size*0.35);
    ctx.lineTo(x, cy + size*0.28);
    ctx.stroke();
  }
  // Base
  ctx.beginPath();
  ctx.moveTo(cx - size*0.15, cy + size*0.3);
  ctx.lineTo(cx + size*0.15, cy + size*0.3);
  ctx.stroke();
}

function drawSpiral(ctx, cx, cy, size, color, turns = 3) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let t = 0; t < turns * Math.PI * 2; t += 0.1) {
    const r = (t / (turns * Math.PI * 2)) * size * 0.35;
    const x = cx + Math.cos(t) * r;
    const y = cy + Math.sin(t) * r;
    if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawArcaneCircles(ctx, cx, cy, size, pal) {
  ctx.strokeStyle = pal.accent + '60';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const r = size * 0.15 + i * size * 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Radial lines
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * size*0.12, cy + Math.sin(angle) * size*0.12);
    ctx.lineTo(cx + Math.cos(angle) * size*0.47, cy + Math.sin(angle) * size*0.47);
    ctx.stroke();
  }
}

function drawScatterSymbols(ctx, pal, drawFn, count = 6) {
  const margin = SIZE * 0.15;
  for (let i = 0; i < count; i++) {
    const x = margin + Math.random() * (SIZE - 2*margin);
    const y = margin + Math.random() * (SIZE - 2*margin);
    const dist = Math.sqrt((x - SIZE/2)**2 + (y - SIZE/2)**2);
    if (dist < SIZE * 0.25) continue; // Don't overlap central motif
    ctx.globalAlpha = 0.15 + Math.random() * 0.15;
    drawFn(ctx, x, y, 50 + Math.random() * 30, pal.accent);
  }
  ctx.globalAlpha = 1;
}

// ── Card definitions ──

const CARDS = [
  // Mystery paths
  { file: 'card-necromancy.png', palette: 'necromancy', motif: 'skull', scatter: 'star5' },
  { file: 'card-runes.png', palette: 'runes', motif: 'runes', scatter: 'star6' },
  { file: 'card-hymns.png', palette: 'hymns', motif: 'lyre', scatter: 'spiral' },
  { file: 'card-body-mystery.png', palette: 'body', motif: 'flame', scatter: 'star5' },
  { file: 'card-strife.png', palette: 'strife', motif: 'sword', scatter: 'star8' },

  // Companions
  { file: 'card-crusader-knight.png', palette: 'holy', motif: 'cross', scatter: 'star6' },
  { file: 'card-faerie-changeling.png', palette: 'fey', motif: 'spiral', scatter: 'star5' },
  { file: 'card-ghostly-scholar.png', palette: 'ghost', motif: 'book', scatter: 'star6' },
  { file: 'card-repentant-diabolist.png', palette: 'infernal', motif: 'star5_hollow', scatter: 'flame' },
  { file: 'card-runecaster.png', palette: 'norse', motif: 'runes', scatter: 'star6' },
  { file: 'card-travelling-merchant.png', palette: 'merchant', motif: 'orb', scatter: 'star8' },
  { file: 'card-hungry-familiar.png', palette: 'familiar', motif: 'eye', scatter: 'spiral' },

  // Locations
  { file: 'card-basilica-columns.png', palette: 'roman', motif: 'column', scatter: 'star6' },
  { file: 'card-pompeii-regio.png', palette: 'volcanic', motif: 'flame', scatter: 'mountain' },
  { file: 'card-garden-hesperides.png', palette: 'garden', motif: 'tree', scatter: 'star5' },
  { file: 'card-witch-endor.png', palette: 'cave', motif: 'skull', scatter: 'spiral' },
  { file: 'card-sacred-grove.png', palette: 'grove', motif: 'tree', scatter: 'star6' },
  { file: 'card-sunken-library.png', palette: 'ocean', motif: 'book', scatter: 'waves' },
  { file: 'card-dragons-hoard.png', palette: 'dragon', motif: 'eye', scatter: 'star8' },
  { file: 'card-apollos-sanctuary.png', palette: 'apollo', motif: 'star8', scatter: 'star6' },
  { file: 'card-purgatory-pass.png', palette: 'purgatory', motif: 'mountain', scatter: 'flame' },
  { file: 'card-tower-babel.png', palette: 'babel', motif: 'column', scatter: 'star6' },

  // Items
  { file: 'card-ring-warding.png', palette: 'ward', motif: 'ring', scatter: 'star6' },
  { file: 'card-orb-divination.png', palette: 'divination', motif: 'orb', scatter: 'eye' },
  { file: 'card-cloak-invisibility.png', palette: 'invisibility', motif: 'eye', scatter: 'spiral' },
  { file: 'card-staff-elements.png', palette: 'elemental', motif: 'staff', scatter: 'flame' },
  { file: 'card-longevity-elixir.png', palette: 'elixir', motif: 'orb', scatter: 'spiral' },
  { file: 'card-talisman-bonding.png', palette: 'talisman', motif: 'ring', scatter: 'star8' },
  { file: 'card-automaton-servant.png', palette: 'automaton', motif: 'gear', scatter: 'star6' },
  { file: 'card-necromancers-grimoire.png', palette: 'grimoire', motif: 'book', scatter: 'skull' },
  { file: 'card-travelling-lab.png', palette: 'lab', motif: 'gear', scatter: 'orb' },
  { file: 'card-gargoyle-guardian.png', palette: 'gargoyle', motif: 'skull', scatter: 'star6' },

  // Technique spells
  { file: 'card-creo-spell.png', palette: 'creo', motif: 'star8', scatter: 'flame' },
  { file: 'card-intellego-spell.png', palette: 'intellego', motif: 'eye', scatter: 'star6' },
  { file: 'card-muto-spell.png', palette: 'muto', motif: 'spiral', scatter: 'star5' },
  { file: 'card-perdo-spell.png', palette: 'perdo', motif: 'skull', scatter: 'star5' },
  { file: 'card-rego-spell.png', palette: 'rego', motif: 'gear', scatter: 'star8' },
];

function drawMotif(ctx, cx, cy, size, pal, type) {
  switch (type) {
    case 'skull': drawSkull(ctx, cx, cy, size, pal.accent); break;
    case 'runes': drawRuneSymbols(ctx, cx, cy, size, pal.accent); break;
    case 'lyre': drawLyre(ctx, cx, cy, size, pal.accent); break;
    case 'flame': drawFlame(ctx, cx, cy, size, pal.accent); break;
    case 'sword': drawSword(ctx, cx, cy, size, pal.accent); break;
    case 'cross': drawCross(ctx, cx, cy, size, pal.accent); break;
    case 'spiral': drawSpiral(ctx, cx, cy, size, pal.accent); break;
    case 'book': drawBook(ctx, cx, cy, size, pal.accent); break;
    case 'eye': drawEye(ctx, cx, cy, size, pal.accent); break;
    case 'orb': drawOrb(ctx, cx, cy, size, pal.accent); break;
    case 'column': drawColumn(ctx, cx, cy, size, pal.accent); break;
    case 'tree': drawTree(ctx, cx, cy, size, pal.accent); break;
    case 'mountain': drawMountain(ctx, cx, cy, size, pal.accent); break;
    case 'ring': drawRing(ctx, cx, cy, size, pal.accent); break;
    case 'gear': drawGear(ctx, cx, cy, size, pal.accent); break;
    case 'waves': drawWaves(ctx, cx, cy, size, pal.accent); break;
    case 'star5': drawStar(ctx, cx, cy, 5, size*0.35, size*0.14, pal.accent); break;
    case 'star5_hollow':
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI / 5) - Math.PI / 2;
        const r = i % 2 === 0 ? size*0.35 : size*0.14;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    case 'star6': drawStar(ctx, cx, cy, 6, size*0.35, size*0.18, pal.accent); break;
    case 'star8': drawStar(ctx, cx, cy, 8, size*0.35, size*0.22, pal.accent); break;
    case 'staff':
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy - size*0.45);
      ctx.lineTo(cx, cy + size*0.45);
      ctx.stroke();
      drawStar(ctx, cx, cy - size*0.45, 4, size*0.08, size*0.04, pal.glow);
      break;
  }
}

function scatterFn(type) {
  switch (type) {
    case 'star5': return (ctx, x, y, s, c) => drawStar(ctx, x, y, 5, s*0.3, s*0.12, c);
    case 'star6': return (ctx, x, y, s, c) => drawStar(ctx, x, y, 6, s*0.3, s*0.15, c);
    case 'star8': return (ctx, x, y, s, c) => drawStar(ctx, x, y, 8, s*0.3, s*0.18, c);
    case 'flame': return drawFlame;
    case 'spiral': return (ctx, x, y, s, c) => { ctx.strokeStyle = c; drawSpiral(ctx, x, y, s, c, 2); };
    case 'skull': return drawSkull;
    case 'eye': return drawEye;
    case 'mountain': return drawMountain;
    case 'waves': return drawWaves;
    case 'orb': return (ctx, x, y, s, c) => drawOrb(ctx, x, y, s, c);
    default: return (ctx, x, y, s, c) => drawStar(ctx, x, y, 6, s*0.3, s*0.15, c);
  }
}

function generateCard(card) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext('2d');
  const pal = PALETTES[card.palette];

  // 1. Parchment background
  drawParchmentBg(ctx, pal);

  // 2. Arcane circles behind central motif
  drawArcaneCircles(ctx, SIZE/2, SIZE/2, SIZE*0.5, pal);

  // 3. Scatter symbols in background
  drawScatterSymbols(ctx, pal, scatterFn(card.scatter), 8);

  // 4. Central circle with motif
  drawCentralCircle(ctx, pal, (ctx, cx, cy, r) => {
    drawMotif(ctx, cx, cy, r * 1.8, pal, card.motif);
  });

  // 5. Vignette
  drawVignette(ctx);

  // 6. Knotwork border
  drawKnotworkBorder(ctx, pal);

  return canvas;
}

// ── Main ──
console.log(`Generating ${CARDS.length} expansion card images...`);
let created = 0, skipped = 0;

for (const card of CARDS) {
  const outPath = path.join(OUT_DIR, card.file);
  if (fs.existsSync(outPath)) {
    console.log(`  SKIP ${card.file} (already exists)`);
    skipped++;
    continue;
  }
  const canvas = generateCard(card);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, buffer);
  console.log(`  ✓ ${card.file} (${(buffer.length/1024).toFixed(0)} KB)`);
  created++;
}

console.log(`\nDone: ${created} created, ${skipped} skipped (${CARDS.length} total)`);
