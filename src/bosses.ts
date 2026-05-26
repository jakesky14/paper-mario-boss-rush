import { BossDef } from './types';

export const BOSSES: BossDef[] = [
  {
    id: 0,
    name: 'Colored Pencils',
    hp: 150,
    maxHp: 150,
    attack: 10,
    color: '#ff4466',
    panels: { action: 4, plus_one: 2, double_power: 1, arrow_up: 5, arrow_left: 5, arrow_right: 5, treasure_chest: 3, on_panel: 2, magic_circle: 1, arrow_down: 1, envelope: 1, empty: 18 },
  },
  {
    id: 1,
    name: 'Rubber Band',
    hp: 100,
    maxHp: 100,
    attack: 14,
    color: '#ff8800',
    panels: { action: 3, plus_one: 1, double_power: 1, arrow_up: 8, arrow_left: 2, arrow_right: 2, treasure_chest: 2, on_panel: 2, magic_circle: 1, arrow_down: 5, envelope: 1, empty: 20 },
  },
  {
    id: 2,
    name: 'Hole Punch',
    hp: 150,
    maxHp: 150,
    attack: 18,
    color: '#ffcc00',
    panels: { action: 3, plus_one: 2, double_power: 2, arrow_up: 4, arrow_left: 2, arrow_right: 2, treasure_chest: 3, on_panel: 2, magic_circle: 2, arrow_down: 1, envelope: 1, empty: 24 },
    special: 'hole_punch',
  },
  {
    id: 3,
    name: 'Tape',
    hp: 180,
    maxHp: 180,
    attack: 22,
    color: '#aa44cc',
    panels: { action: 3, plus_one: 2, double_power: 2, arrow_up: 4, arrow_left: 2, arrow_right: 2, treasure_chest: 2, on_panel: 2, magic_circle: 2, arrow_down: 1, envelope: 1, empty: 25 },
    special: 'tape',
  },
  {
    id: 4,
    name: 'Scissors',
    hp: 336,
    maxHp: 336,
    attack: 26,
    color: '#22cc55',
    panels: { action: 3, plus_one: 2, double_power: 2, arrow_up: 4, arrow_left: 2, arrow_right: 2, treasure_chest: 2, on_panel: 2, magic_circle: 3, arrow_down: 1, envelope: 1, empty: 24 },
    special: 'scissors',
  },
  {
    id: 5,
    name: 'Stapler',
    hp: 350,
    maxHp: 350,
    attack: 30,
    color: '#4466cc',
    panels: { action: 3, plus_one: 3, double_power: 3, arrow_up: 4, arrow_left: 2, arrow_right: 2, treasure_chest: 2, on_panel: 2, magic_circle: 3, arrow_down: 1, envelope: 1, empty: 22 },
    special: 'origami_king',
  },
];

// Colored Pencils — silver case with rainbow pencils sticking up
export function drawBoss0(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, tick: number): void {
  drawBoss0WithPencils(ctx, cx, cy, radius, tick, new Array(12).fill(true));
}

export function drawBoss0WithPencils(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number, tick: number,
  pencilsAlive: boolean[]
): void {
  const r = radius;
  ctx.save();

  // Case base
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(cx - r * 0.68, cy - r * 0.05, r * 1.36, r * 0.44);
  ctx.fillStyle = '#aaaaaa';
  ctx.fillRect(cx - r * 0.68, cy + r * 0.35, r * 1.36, r * 0.08);
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - r * 0.68, cy - r * 0.05, r * 1.36, r * 0.44);

  // Draw only alive pencils
  const PENCIL_COLORS = [
    '#ffffff', '#88ff00', '#22aa44', '#00cccc',
    '#2244ff', '#8822cc', '#ff44aa', '#cc2222',
    '#ffdd00', '#f0d090', '#884422', '#222222',
  ];
  const count = 12;
  const spread = r * 1.1;
  for (let i = 0; i < count; i++) {
    if (!pencilsAlive[i]) continue;
    const px = cx - spread / 2 + (i / (count - 1)) * spread;
    const wobble = Math.sin(tick * 0.003 + i * 0.8) * 2;
    const pencilH = r * 0.65 + (i % 2 === 0 ? r * 0.08 : 0);

    // Eraser at bottom (inside case, just above base)
    ctx.fillStyle = '#ffaacc';
    ctx.fillRect(px - 3, cy - r * 0.05 - 5 + wobble, 6, 5);

    // Pencil body
    ctx.fillStyle = PENCIL_COLORS[i];
    ctx.fillRect(px - 3, cy - r * 0.05 - pencilH + wobble, 6, pencilH - 5);

    // Tip at top, pointing up
    ctx.fillStyle = '#f5c074';
    ctx.beginPath();
    ctx.moveTo(px - 3, cy - r * 0.05 - pencilH + wobble);
    ctx.lineTo(px + 3, cy - r * 0.05 - pencilH + wobble);
    ctx.lineTo(px, cy - r * 0.05 - pencilH - 6 + wobble);
    ctx.closePath();
    ctx.fill();
  }

  // Bolts
  ctx.fillStyle = '#666';
  ctx.beginPath(); ctx.arc(cx - r * 0.55, cy + r * 0.15, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.55, cy + r * 0.15, 3, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
  void tick;
}

// Rubber Band — orange coils wrapped around body, blue helmet
export function drawBoss1(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, tick: number): void {
  ctx.save();
  const r = radius;
  const sway = Math.sin(tick * 0.002) * 3;

  // Body
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.ellipse(cx + sway, cy + r * 0.1, r * 0.42, r * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Band coils
  ctx.strokeStyle = '#cc6600';
  ctx.lineWidth = 4;
  for (let i = 0; i < 7; i++) {
    const bandY = cy - r * 0.35 + i * (r * 0.14);
    const hw = r * 0.42 * Math.max(0.1, Math.sqrt(Math.max(0, 1 - Math.pow((bandY - cy) / (r * 0.6), 2)))) + 2;
    ctx.beginPath();
    ctx.ellipse(cx + sway, bandY, hw, 4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Blue helmet
  ctx.fillStyle = '#2255cc';
  ctx.beginPath();
  ctx.ellipse(cx + sway, cy - r * 0.55, r * 0.32, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();
  // Gold crest
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.moveTo(cx + sway, cy - r * 0.82);
  ctx.lineTo(cx + sway - 8, cy - r * 0.65);
  ctx.lineTo(cx + sway + 8, cy - r * 0.65);
  ctx.closePath();
  ctx.fill();

  // Arms + gloves
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx + sway - r * 0.38, cy - r * 0.05);
  ctx.lineTo(cx + sway - r * 0.6, cy + r * 0.05);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + sway + r * 0.38, cy - r * 0.05);
  ctx.lineTo(cx + sway + r * 0.6, cy + r * 0.05);
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(cx + sway - r * 0.6, cy + r * 0.05, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + sway + r * 0.6, cy + r * 0.05, 9, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Hole Punch — large yellow Z-shaped mechanical puncher
export function drawBoss2(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, tick: number): void {
  ctx.save();
  const r = radius;
  const punchAnim = Math.abs(Math.sin(tick * 0.002)) * r * 0.12;

  ctx.fillStyle = '#ffcc00';
  // Top bar
  ctx.fillRect(cx - r * 0.65, cy - r * 0.6, r * 1.3, r * 0.28);
  // Bottom bar (animates downward)
  ctx.fillRect(cx - r * 0.65, cy + r * 0.28 + punchAnim, r * 1.3, r * 0.28);
  // Diagonal connector
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.5, cy - r * 0.32);
  ctx.lineTo(cx - r * 0.5, cy + r * 0.28 + punchAnim);
  ctx.lineTo(cx - r * 0.65, cy + r * 0.28 + punchAnim);
  ctx.lineTo(cx + r * 0.65, cy - r * 0.32);
  ctx.closePath();
  ctx.fill();

  // Punch holes (eyes)
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.46, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.3, cy - r * 0.46, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx - r * 0.3, cy + r * 0.42 + punchAnim, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.3, cy + r * 0.42 + punchAnim, r * 0.1, 0, Math.PI * 2); ctx.fill();

  // Bolts
  ctx.fillStyle = '#886600';
  for (const i of [-1, 1]) {
    ctx.beginPath(); ctx.arc(cx + i * r * 0.55, cy - r * 0.46, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + i * r * 0.55, cy + r * 0.42 + punchAnim, 4, 0, Math.PI * 2); ctx.fill();
  }

  // Angry eyebrows
  ctx.strokeStyle = '#884400';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.45, cy - r * 0.6); ctx.lineTo(cx - r * 0.15, cy - r * 0.55); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + r * 0.45, cy - r * 0.6); ctx.lineTo(cx + r * 0.15, cy - r * 0.55); ctx.stroke();

  ctx.restore();
}

// Tape — purple tape dispenser with tan roll
export function drawBoss3(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, tick: number): void {
  ctx.save();
  const r = radius;
  const rollSpin = tick * 0.002;

  // Main purple body
  ctx.fillStyle = '#882299';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.55 + 8, cy - r * 0.15);
  ctx.lineTo(cx + r * 0.55 - 8, cy - r * 0.15);
  ctx.lineTo(cx + r * 0.55, cy - r * 0.15 + 8);
  ctx.lineTo(cx + r * 0.55, cy + r * 0.55 - 8);
  ctx.lineTo(cx + r * 0.55 - 8, cy + r * 0.55);
  ctx.lineTo(cx - r * 0.55 + 8, cy + r * 0.55);
  ctx.lineTo(cx - r * 0.55, cy + r * 0.55 - 8);
  ctx.lineTo(cx - r * 0.55, cy - r * 0.15 + 8);
  ctx.closePath();
  ctx.fill();

  // Dispenser slot
  ctx.fillStyle = '#661177';
  ctx.fillRect(cx + r * 0.1, cy - r * 0.15, r * 0.35, r * 0.2);

  // Tape roll (translucent tan)
  ctx.strokeStyle = 'rgba(210,180,130,0.8)';
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.arc(cx - r * 0.1, cy - r * 0.28, r * 0.35, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#c8a060';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx - r * 0.1, cy - r * 0.28, r * 0.18, rollSpin, rollSpin + Math.PI * 1.6); ctx.stroke();
  ctx.fillStyle = '#cc9944';
  ctx.beginPath(); ctx.arc(cx - r * 0.1, cy - r * 0.28, r * 0.09, 0, Math.PI * 2); ctx.fill();

  // Tape strip coming out
  ctx.fillStyle = 'rgba(210,195,150,0.65)';
  ctx.fillRect(cx + r * 0.1, cy - r * 0.38, r * 0.5, r * 0.12);

  // Cutter teeth
  ctx.fillStyle = '#cccccc';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.1 + i * r * 0.12, cy - r * 0.26);
    ctx.lineTo(cx + r * 0.16 + i * r * 0.12, cy - r * 0.18);
    ctx.lineTo(cx + r * 0.04 + i * r * 0.12, cy - r * 0.18);
    ctx.closePath();
    ctx.fill();
  }

  // Eyes
  ctx.fillStyle = '#ffcc44';
  ctx.beginPath(); ctx.arc(cx - r * 0.22, cy + r * 0.28, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.22, cy + r * 0.28, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(cx - r * 0.22, cy + r * 0.28, r * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.22, cy + r * 0.28, r * 0.05, 0, Math.PI * 2); ctx.fill();

  // Yellow base strip
  ctx.fillStyle = '#ddcc00';
  ctx.fillRect(cx - r * 0.65, cy + r * 0.55, r * 1.3, r * 0.1);

  ctx.restore();
  void rollSpin;
}

// Scissors — large green scissors standing upright
export function drawBoss4(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, tick: number): void {
  ctx.save();
  const r = radius;
  const snap = Math.abs(Math.sin(tick * 0.003)) * r * 0.1;

  // Left blade
  ctx.fillStyle = '#22cc44';
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.1);
  ctx.quadraticCurveTo(cx - r * 0.5, cy - r * 0.2 - snap, cx - r * 0.28, cy - r * 0.75 - snap);
  ctx.lineTo(cx - r * 0.1, cy - r * 0.65 - snap);
  ctx.quadraticCurveTo(cx - r * 0.22, cy - r * 0.2, cx + r * 0.06, cy + r * 0.12);
  ctx.closePath();
  ctx.fill();

  // Right blade
  ctx.fillStyle = '#18aa38';
  ctx.beginPath();
  ctx.moveTo(cx, cy + r * 0.1);
  ctx.quadraticCurveTo(cx + r * 0.5, cy - r * 0.2 + snap, cx + r * 0.28, cy - r * 0.75 + snap);
  ctx.lineTo(cx + r * 0.1, cy - r * 0.65 + snap);
  ctx.quadraticCurveTo(cx + r * 0.22, cy - r * 0.2, cx - r * 0.06, cy + r * 0.12);
  ctx.closePath();
  ctx.fill();

  // Highlights
  ctx.strokeStyle = '#44ff77';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.18, cy - r * 0.1 - snap);
  ctx.quadraticCurveTo(cx - r * 0.32, cy - r * 0.4 - snap, cx - r * 0.22, cy - r * 0.7 - snap);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.18, cy - r * 0.1 + snap);
  ctx.quadraticCurveTo(cx + r * 0.32, cy - r * 0.4 + snap, cx + r * 0.22, cy - r * 0.7 + snap);
  ctx.stroke();

  // Pivot screw
  ctx.fillStyle = '#888';
  ctx.beginPath(); ctx.arc(cx, cy + r * 0.1, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aaa';
  ctx.beginPath(); ctx.arc(cx, cy + r * 0.1, r * 0.07, 0, Math.PI * 2); ctx.fill();

  // Handle rings
  ctx.strokeStyle = '#22cc44';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.arc(cx - r * 0.25, cy + r * 0.5, r * 0.22, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + r * 0.25, cy + r * 0.5, r * 0.22, 0, Math.PI * 2); ctx.stroke();

  // Eyes in handles
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - r * 0.25, cy + r * 0.5, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.25, cy + r * 0.5, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(cx - r * 0.25, cy + r * 0.5, r * 0.055, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.25, cy + r * 0.5, r * 0.055, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Stapler — dark navy low-profile stapler with glow
export function drawBoss5(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, tick: number): void {
  ctx.save();
  const r = radius;
  const stapleAnim = Math.abs(Math.sin(tick * 0.0015)) * r * 0.07;

  // Bottom body
  ctx.fillStyle = '#1a2a55';
  ctx.fillRect(cx - r * 0.72, cy - r * 0.08, r * 1.44, r * 0.46);

  // Top arm (pressing part, hinged)
  ctx.fillStyle = '#223366';
  ctx.fillRect(cx - r * 0.72, cy - r * 0.38 - stapleAnim, r * 1.44, r * 0.32);

  // Metal rail on top arm
  ctx.fillStyle = '#4466aa';
  ctx.fillRect(cx - r * 0.55, cy - r * 0.3 - stapleAnim, r * 1.0, r * 0.1);

  // Red indicator strip
  ctx.fillStyle = '#cc2222';
  ctx.fillRect(cx - r * 0.4, cy + r * 0.02, r * 0.8, r * 0.1);

  // Blue interior glow
  const glowAlpha = 0.35 + 0.35 * Math.sin(tick * 0.005);
  const ledGrad = ctx.createRadialGradient(cx, cy + r * 0.2, 0, cx, cy + r * 0.2, r * 0.38);
  ledGrad.addColorStop(0, `rgba(80,130,255,${glowAlpha})`);
  ledGrad.addColorStop(1, 'rgba(80,130,255,0)');
  ctx.fillStyle = ledGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.2, r * 0.38, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // White light on top
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx + r * 0.55, cy - r * 0.22 - stapleAnim, 5, 0, Math.PI * 2); ctx.fill();
  const lightGlow = ctx.createRadialGradient(cx + r * 0.55, cy - r * 0.22 - stapleAnim, 0, cx + r * 0.55, cy - r * 0.22 - stapleAnim, 13);
  lightGlow.addColorStop(0, 'rgba(255,255,255,0.5)');
  lightGlow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = lightGlow;
  ctx.beginPath(); ctx.arc(cx + r * 0.55, cy - r * 0.22 - stapleAnim, 13, 0, Math.PI * 2); ctx.fill();

  // Blue eyes
  ctx.fillStyle = '#88aaff';
  ctx.beginPath(); ctx.arc(cx - r * 0.2, cy + r * 0.22, r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.2, cy + r * 0.22, r * 0.07, 0, Math.PI * 2); ctx.fill();

  // Chrome borders
  ctx.strokeStyle = '#4488cc';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - r * 0.72, cy - r * 0.08, r * 1.44, r * 0.46);
  ctx.strokeRect(cx - r * 0.72, cy - r * 0.38 - stapleAnim, r * 1.44, r * 0.32);

  ctx.restore();
}

export type DrawBossFn = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  tick: number
) => void;

export const BOSS_DRAW_FNS: DrawBossFn[] = [drawBoss0, drawBoss1, drawBoss2, drawBoss3, drawBoss4, drawBoss5];
