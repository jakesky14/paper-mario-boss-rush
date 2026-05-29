import { GameState, PanelType, ConfettiParticle, DamageNumber, FlashEffect, PathStep, AccessoryInventory } from './types';
import { BOSS_DRAW_FNS, drawBoss0WithPencils, drawBoss1Solo } from './bosses';
import { NUM_RINGS, NUM_PANELS, simulatePath } from './rings';
import titleBgSrc from '../LegionofStationery.webp';
import menuBgSrc from '../91307770_p0_master1200.jpg';
import shopBgSrc from '../shop_background.png';

// Background images — loaded once at startup
const _titleBg = new Image(); _titleBg.src = titleBgSrc;
const _menuBg = new Image();  _menuBg.src = menuBgSrc;
const _shopBg = new Image();  _shopBg.src = shopBgSrc;

function drawBgImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, fallback: string): void {
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
  } else {
    ctx.fillStyle = fallback;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

// Shop item definitions (must match SHOP_COSTS order in game.ts)
const SHOP_ITEMS: { name: string; cost: number; desc: string; key: keyof AccessoryInventory | 'maxUpHeart' }[] = [
  { key: 'heartPlus',       name: 'Heart Plus',        cost: 500,  desc: '+5 Max HP (bonus on run start)' },
  { key: 'silverHeartPlus', name: 'Silver Heart Plus', cost: 1000, desc: '+10 Max HP (bonus on run start)' },
  { key: 'goldHeartPlus',   name: 'Gold Heart Plus',   cost: 2000, desc: '+20 Max HP (bonus on run start)' },
  { key: 'guardPlus',       name: 'Guard Plus',        cost: 500,  desc: 'Reduce damage 5-15% per hit' },
  { key: 'silverGuardPlus', name: 'Silver Guard Plus', cost: 1000, desc: 'Reduce damage 10-20% per hit' },
  { key: 'goldGuardPlus',   name: 'Gold Guard Plus',   cost: 2000, desc: 'Reduce damage 20-30% per hit' },
  { key: 'timePlus',        name: 'Time Plus',         cost: 500,  desc: '+5-15s Puzzle Timer per turn' },
  { key: 'silverTimePlus',  name: 'Silver Time Plus',  cost: 1000, desc: '+15-25s Puzzle Timer per turn' },
  { key: 'goldTimePlus',    name: 'Gold Time Plus',    cost: 2000, desc: '+25-50s Puzzle Timer per turn' },
  { key: 'maxUpHeart',      name: 'Max-Up Heart',      cost: 1000, desc: '+20 Max HP (permanent, cap 200)' },
];

// Layout constants
export const CANVAS_W = 900;
export const CANVAS_H = 680;
export const RING_CX = 430;
export const RING_CY = 350;
export const BOSS_RADIUS = 70;
export const RING_WIDTH = 50;
export const ARC_GAP_DEG = 1.5; // degrees gap between panels

const MARIO_SLOT = 6;

// Panel fill colors
const PANEL_COLORS: Record<PanelType, string> = {
  empty:         '',
  action:        '#cc2222',
  heal:          '#22aa55',
  arrow_up:      '#44aa44',
  arrow_left:    '#339933',
  arrow_right:   '#33aa33',
  plus_one:      '#aa44cc',
  double_power:  '#cc9900',
  treasure_chest: '#aa6600',
  on_panel:      '#22aa44',
  magic_circle:  '#222222',
  arrow_down:    '#336633',
  envelope:      '#dd6600',
  coin:          '#ffdd00',
  rubber_band:   '#cc4400',
  hole:          '#111111',
  on_panel_holed: '#22aa44',
  mario_part:    '#cc2244',
  earth_vellumental: '#116611',
};

// Ring background colors — warm tones matching screenshot
const RING_BG_COLORS = ['#d4872a', '#e0a030', '#c8b870', '#b8a860'];

function panelArcSpan(): number {
  return (2 * Math.PI) / NUM_PANELS;
}

function ringInnerRadius(ringIndex: number): number {
  return BOSS_RADIUS + ringIndex * RING_WIDTH;
}

function ringOuterRadius(ringIndex: number): number {
  return BOSS_RADIUS + (ringIndex + 1) * RING_WIDTH;
}

// Draw an arrow triangle pointing in the given angle direction
function drawArrowTriangle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  size = 10
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.65, size * 0.5);
  ctx.lineTo(-size * 0.65, size * 0.5);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}

// Draw a single panel as a pie slice with icon
function drawPanel(
  ctx: CanvasRenderingContext2D,
  ringIndex: number,
  slotIndex: number,
  panelType: PanelType,
  cx: number,
  cy: number,
  rotationOffset: number,
  highlighted: boolean,
  columnHighlighted: boolean,
  isMarioColumn: boolean,
  pathHighlight: boolean,
  isCursorColumn = false,
  magicCircleActive = false
): void {
  const innerR = ringInnerRadius(ringIndex);
  const outerR = ringOuterRadius(ringIndex);
  const arcSpan = panelArcSpan();
  const gapRad = (ARC_GAP_DEG * Math.PI) / 180;
  const startAngle = (slotIndex / NUM_PANELS) * Math.PI * 2 - Math.PI / 2 + rotationOffset + gapRad / 2;
  const endAngle = startAngle + arcSpan - gapRad;

  // Panel fill
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, startAngle, endAngle);
  ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
  ctx.closePath();

  let fillColor: string;
  if (panelType === 'empty') {
    fillColor = isMarioColumn ? lightenColor(RING_BG_COLORS[ringIndex], 20) : RING_BG_COLORS[ringIndex];
  } else if (panelType === 'magic_circle') {
    fillColor = magicCircleActive ? '#ccaa00' : '#222222';
    if (isMarioColumn) fillColor = lightenColor(fillColor, 20);
  } else {
    fillColor = PANEL_COLORS[panelType];
    if (isMarioColumn) {
      fillColor = lightenColor(fillColor, 20);
    }
    if (columnHighlighted && !isMarioColumn) {
      fillColor = lightenColor(fillColor, 15);
    }
  }
  if (isCursorColumn) {
    // Tint with cyan overlay effect (lighten toward cyan)
    fillColor = blendWithCyan(fillColor, 0.35);
  }

  ctx.fillStyle = fillColor;
  ctx.fill();

  // Border — path highlight gets bright yellow/white glow
  if (pathHighlight) {
    ctx.strokeStyle = '#ffee00';
    ctx.lineWidth = 3;
  } else {
    ctx.strokeStyle = highlighted ? '#ffffff' : '#000000';
    ctx.lineWidth = highlighted ? 2.5 : 0.8;
  }
  ctx.stroke();

  // Draw icon
  const midAngle = (startAngle + endAngle) / 2;
  const midR = (innerR + outerR) / 2;
  const iconX = cx + Math.cos(midAngle) * midR;
  const iconY = cy + Math.sin(midAngle) * midR;

  if (panelType !== 'empty') {
    drawPanelIcon(ctx, panelType, iconX, iconY, RING_WIDTH * 0.28, midAngle, midR, slotIndex, cx, cy, magicCircleActive);
  }
}

function drawPanelIcon(
  ctx: CanvasRenderingContext2D,
  panelType: PanelType,
  x: number,
  y: number,
  size: number,
  midAngle: number,
  midR: number,
  slotIndex: number,
  ringCx: number,
  ringCy: number,
  magicCircleActive = false
): void {
  ctx.save();
  ctx.translate(x, y);

  switch (panelType) {
    case 'action': {
      // Fist icon
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, size * 0.1, size * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-size * 0.5, -size * 0.65, size * 1.0, size * 0.55);
      ctx.beginPath();
      ctx.arc(-size * 0.6, -size * 0.1, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'heal': {
      // Green heart
      ctx.fillStyle = '#44cc66';
      const hs = size * 0.85;
      ctx.beginPath();
      ctx.moveTo(0, hs * 0.3);
      ctx.bezierCurveTo(-hs * 0.1, -hs * 0.1, -hs, -hs * 0.1, -hs * 0.5, -hs * 0.5);
      ctx.bezierCurveTo(-hs * 0.1, -hs * 0.9, 0, -hs * 0.6, 0, -hs * 0.4);
      ctx.bezierCurveTo(0, -hs * 0.6, hs * 0.1, -hs * 0.9, hs * 0.5, -hs * 0.5);
      ctx.bezierCurveTo(hs, -hs * 0.1, hs * 0.1, -hs * 0.1, 0, hs * 0.3);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 'arrow_up': {
      // Arrow pointing inward (toward ring center)
      ctx.restore();
      const inwardAngle = Math.atan2(ringCy - y, ringCx - x);
      drawArrowTriangle(ctx, x, y, inwardAngle + Math.PI / 2, size * 0.9);
      return;
    }
    case 'arrow_left': {
      // Arrow pointing toward adjacent slot at (slotIndex - 1) in same ring
      ctx.restore();
      const arcSpanL = (2 * Math.PI) / NUM_PANELS;
      const targetAngleL = midAngle - arcSpanL;
      const targetXL = ringCx + midR * Math.cos(targetAngleL);
      const targetYL = ringCy + midR * Math.sin(targetAngleL);
      drawArrowTriangle(ctx, x, y, Math.atan2(targetYL - y, targetXL - x) + Math.PI / 2, size * 0.9);
      return;
    }
    case 'arrow_right': {
      // Arrow pointing toward adjacent slot at (slotIndex + 1) in same ring
      ctx.restore();
      const arcSpanR = (2 * Math.PI) / NUM_PANELS;
      const targetAngleR = midAngle + arcSpanR;
      const targetXR = ringCx + midR * Math.cos(targetAngleR);
      const targetYR = ringCy + midR * Math.sin(targetAngleR);
      drawArrowTriangle(ctx, x, y, Math.atan2(targetYR - y, targetXR - x) + Math.PI / 2, size * 0.9);
      return;
    }
    case 'plus_one': {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 11px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('+1', 0, 0);
      break;
    }
    case 'double_power': {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold 11px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('×2', 0, 0);
      break;
    }
    case 'treasure_chest': {
      // Chest icon
      ctx.fillStyle = '#8b5a00';
      ctx.fillRect(-size * 0.7, -size * 0.2, size * 1.4, size * 0.9);
      ctx.fillStyle = '#c8860a';
      ctx.fillRect(-size * 0.7, -size * 0.5, size * 1.4, size * 0.4);
      ctx.fillStyle = '#ffdd44';
      ctx.fillRect(-size * 0.15, -size * 0.1, size * 0.3, size * 0.35);
      break;
    }
    case 'on_panel': {
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(size * 0.9)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ON', 0, 0);
      break;
    }
    case 'magic_circle': {
      const circColor = magicCircleActive ? '#ffdd44' : '#666666';
      ctx.strokeStyle = circColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = circColor;
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * size * 0.35, Math.sin(a) * size * 0.35, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'arrow_down': {
      ctx.restore();
      const outwardAngle = Math.atan2(y - ringCy, x - ringCx);
      drawArrowTriangle(ctx, x, y, outwardAngle + Math.PI / 2, size * 0.9);
      return;
    }
    case 'envelope': {
      // Orange rectangle with ?
      ctx.fillStyle = '#dd6600';
      ctx.fillRect(-size * 0.8, -size * 0.6, size * 1.6, size * 1.0);
      ctx.strokeStyle = '#ff9900';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-size * 0.8, -size * 0.6, size * 1.6, size * 1.0);
      // Flap (triangle at top)
      ctx.fillStyle = '#ff8800';
      ctx.beginPath();
      ctx.moveTo(-size * 0.8, -size * 0.6);
      ctx.lineTo(0, -size * 0.1);
      ctx.lineTo(size * 0.8, -size * 0.6);
      ctx.fill();
      // Question mark
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(size * 0.8)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', 0, size * 0.1);
      break;
    }
    case 'rubber_band': {
      // Orange rubber band ring
      ctx.strokeStyle = '#ff8800';
      ctx.lineWidth = size * 0.6;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      // Highlight arc
      ctx.strokeStyle = '#ffaa55';
      ctx.lineWidth = size * 0.18;
      ctx.beginPath();
      ctx.arc(-size * 0.15, -size * 0.25, size * 0.4, Math.PI * 1.1, Math.PI * 1.7);
      ctx.stroke();
      break;
    }
    case 'coin': {
      // Gold coin
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cc9900';
      ctx.font = `bold ${Math.round(size * 0.7)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', 0, 0);
      break;
    }
    case 'hole': {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.85, size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333333';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      break;
    }
    case 'on_panel_holed': {
      ctx.fillStyle = '#aaffcc';
      ctx.font = `bold ${Math.round(size * 1.2)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ON', 0, 0);
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(size * 0.45, size * 0.35, size * 0.32, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#444444';
      ctx.lineWidth = 1;
      ctx.stroke();
      break;
    }
    case 'mario_part': {
      // Red circle with white M
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.75, 0, Math.PI * 2);
      ctx.fillStyle = '#cc0033';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(size * 1.0)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', 0, 0);
      break;
    }
    case 'earth_vellumental': {
      // Green circle with turtle silhouette
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = '#114411';
      ctx.fill();
      ctx.strokeStyle = '#44ff44';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Turtle shell
      ctx.fillStyle = '#44ff44';
      ctx.beginPath();
      ctx.arc(0, -size * 0.05, size * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#114411';
      ctx.beginPath();
      ctx.arc(0, -size * 0.05, size * 0.28, 0, Math.PI * 2);
      ctx.fill();
      // Legs
      ctx.fillStyle = '#44ff44';
      const legR = size * 0.18;
      for (const [lx, ly] of [[-size*0.45, size*0.1], [size*0.45, size*0.1], [-size*0.35, size*0.42], [size*0.35, size*0.42]]) {
        ctx.beginPath();
        ctx.arc(lx, ly, legR, 0, Math.PI * 2);
        ctx.fill();
      }
      // Head
      ctx.beginPath();
      ctx.arc(0, -size * 0.58, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }

  void midAngle; // suppress unused warning for non-arrow cases
  void slotIndex;
  ctx.restore();
}

function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Blend a hex color toward cyan (#00e6ff) by 'amount' (0..1)
function blendWithCyan(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r0 = (num >> 16) & 0xff;
  const g0 = (num >> 8) & 0xff;
  const b0 = num & 0xff;
  const r = Math.round(r0 + (0 - r0) * amount);
  const g = Math.round(g0 + (230 - g0) * amount);
  const b = Math.round(b0 + (255 - b0) * amount);
  return `#${Math.min(255, r).toString(16).padStart(2, '0')}${Math.min(255, g).toString(16).padStart(2, '0')}${Math.min(255, b).toString(16).padStart(2, '0')}`;
}

// Compute the canvas pixel center of a panel at (ring, slot)
function panelCenter(ring: number, slot: number): { x: number; y: number } {
  const innerR = ringInnerRadius(ring);
  const outerR = ringOuterRadius(ring);
  const arcSpan = panelArcSpan();
  const gapRad = (ARC_GAP_DEG * Math.PI) / 180;
  const startAngle = (slot / NUM_PANELS) * Math.PI * 2 - Math.PI / 2 + gapRad / 2;
  const midAngle = startAngle + (arcSpan - gapRad) / 2;
  const midR = (innerR + outerR) / 2;
  return {
    x: RING_CX + Math.cos(midAngle) * midR,
    y: RING_CY + Math.sin(midAngle) * midR,
  };
}

// Draw all rings with optional rotation offset for one ring
export function drawRings(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  rotationAnim: GameState['rotationAnim'],
  tick: number,
  walkPath: PathStep[]
): void {
  const rings = state.rings;
  const selectedRing = state.selectedRing;
  const selectedColumn = state.selectedColumn;
  const activeRingMoveStarted = state.activeRingMoveStarted;
  const mode = state.puzzleControlMode;
  const ringCursor = state.ringCursor;
  const columnCursor = state.columnCursor;

  // Build a set of highlighted path positions
  const pathSet = new Set<string>();
  for (const step of walkPath) {
    pathSet.add(`${step.ring},${step.slot}`);
  }

  // Column pulse effect
  const columnPulse = 0.5 + 0.5 * Math.sin(tick * 0.005);

  for (let r = 0; r < NUM_RINGS; r++) {
    const ring = rings[r];
    let rotOffset = 0;
    if (rotationAnim && rotationAnim.ringIndex === r) {
      const t = easeInOut(rotationAnim.progress);
      const slotAngle = (2 * Math.PI) / NUM_PANELS;
      rotOffset = t * slotAngle * rotationAnim.direction;
    }

    const isSelected = r === selectedRing;

    for (let s = 0; s < NUM_PANELS; s++) {
      const panel = ring.panels[s];
      const colHighlight = s === selectedColumn && columnPulse > 0.3;
      // In column_select, highlight the cursor column in cyan across all rings
      const isCursorCol = (mode === 'column_select' || mode === 'column_edit') && s === columnCursor;
      const isMarioCol = s === MARIO_SLOT;
      const isPathPanel = pathSet.has(`${r},${s}`);
      drawPanel(
        ctx,
        r,
        s,
        panel,
        RING_CX,
        RING_CY,
        rotOffset,
        isSelected,
        colHighlight || isCursorCol,
        isMarioCol,
        isPathPanel,
        isCursorCol,
        state.magicCircleActive
      );
    }

    // Selected ring glow outline
    if (isSelected) {
      const innerR = ringInnerRadius(r);
      const outerR = ringOuterRadius(r);

      if (!activeRingMoveStarted) {
        const glowAlpha = 0.5 + 0.5 * Math.sin(tick * 0.008);
        ctx.strokeStyle = `rgba(255,220,50,${glowAlpha})`;
        ctx.lineWidth = 4;
      } else {
        const glowAlpha = 0.4 + 0.4 * Math.sin(tick * 0.006);
        ctx.strokeStyle = `rgba(255,255,255,${glowAlpha})`;
        ctx.lineWidth = 3;
      }
      ctx.beginPath();
      ctx.arc(RING_CX, RING_CY, outerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(RING_CX, RING_CY, innerR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ring_select mode: highlight ring cursor with pulsing cyan border
    if (mode === 'ring_select' && r === ringCursor) {
      const innerR = ringInnerRadius(r);
      const outerR = ringOuterRadius(r);
      const pulse = 0.5 + 0.5 * Math.sin(tick * 0.01);
      ctx.strokeStyle = `rgba(0,230,255,${0.5 + 0.5 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(RING_CX, RING_CY, outerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(RING_CX, RING_CY, innerR, 0, Math.PI * 2);
      ctx.stroke();
    }

    // ring_edit mode: solid bright white border + "EDITING" label
    if (mode === 'ring_edit' && r === selectedRing) {
      const innerR = ringInnerRadius(r);
      const outerR = ringOuterRadius(r);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(RING_CX, RING_CY, outerR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(RING_CX, RING_CY, innerR, 0, Math.PI * 2);
      ctx.stroke();
      // "EDITING" label above ring
      const labelY = RING_CY - outerR - 8;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EDITING', RING_CX, labelY);
    }
  }

  // Column highlight lines
  if (selectedColumn >= 0) {
    const angle = (selectedColumn / NUM_PANELS) * Math.PI * 2 - Math.PI / 2;
    const pulseAlpha = 0.2 + 0.3 * columnPulse;
    ctx.strokeStyle = `rgba(255,255,180,${pulseAlpha})`;
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(
      RING_CX + Math.cos(angle) * (BOSS_RADIUS + 2),
      RING_CY + Math.sin(angle) * (BOSS_RADIUS + 2)
    );
    ctx.lineTo(
      RING_CX + Math.cos(angle) * (BOSS_RADIUS + NUM_RINGS * RING_WIDTH - 2),
      RING_CY + Math.sin(angle) * (BOSS_RADIUS + NUM_RINGS * RING_WIDTH - 2)
    );
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw target symbols for boss 0 during primary_target and puzzle phases
  if (state.bossIndex === 0 && state.targetedPanels.length > 0 &&
      (state.phase === 'primary_target' || state.phase === 'puzzle')) {
    for (const tp of state.targetedPanels) {
      const center = panelCenter(tp.ring, tp.slot);
      const pulse = 0.5 + 0.5 * Math.sin(tick * 0.01);
      ctx.save();
      ctx.strokeStyle = `rgba(255,50,50,${0.6 + 0.4 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(center.x, center.y, 12, 0, Math.PI * 2); ctx.stroke();
      // Crosshair lines
      ctx.beginPath(); ctx.moveTo(center.x - 16, center.y); ctx.lineTo(center.x + 16, center.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(center.x, center.y - 16); ctx.lineTo(center.x, center.y + 16); ctx.stroke();
      ctx.restore();
    }
  }

  // column_select / column_edit: draw cyan highlight line for column cursor
  if (mode === 'column_select' || mode === 'column_edit') {
    const cursorAngle = (columnCursor / NUM_PANELS) * Math.PI * 2 - Math.PI / 2;
    const cyanPulse = 0.6 + 0.4 * Math.sin(tick * 0.012);
    ctx.strokeStyle = `rgba(0,230,255,${cyanPulse})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(
      RING_CX + Math.cos(cursorAngle) * (BOSS_RADIUS + 2),
      RING_CY + Math.sin(cursorAngle) * (BOSS_RADIUS + 2)
    );
    ctx.lineTo(
      RING_CX + Math.cos(cursorAngle) * (BOSS_RADIUS + NUM_RINGS * RING_WIDTH - 2),
      RING_CY + Math.sin(cursorAngle) * (BOSS_RADIUS + NUM_RINGS * RING_WIDTH - 2)
    );
    ctx.stroke();
  }
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Draw the static Mario token at ring 3, slot MARIO_SLOT (used during puzzle phase)
function drawMarioToken(ctx: CanvasRenderingContext2D, tick: number): void {
  const slotAngle = ((MARIO_SLOT + 0.5) / NUM_PANELS) * Math.PI * 2 - Math.PI / 2;
  const marioR = BOSS_RADIUS + 3.5 * RING_WIDTH; // midpoint of ring 3
  const marioX = RING_CX + marioR * Math.cos(slotAngle);
  const marioY = RING_CY + marioR * Math.sin(slotAngle);

  // Slight bob animation
  const bob = Math.sin(tick * 0.004) * 2;

  drawMarioSprite(ctx, marioX, marioY + bob);
}

// Draw Mario sprite centered at (x, y)
function drawMarioSprite(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.save();
  ctx.translate(x, y);

  // White outline glow
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 6;

  // Blue body rectangle (overalls)
  ctx.fillStyle = '#1144cc';
  ctx.fillRect(-7, 2, 14, 9);

  // Red shirt
  ctx.fillStyle = '#cc2222';
  ctx.fillRect(-6, -4, 12, 8);

  // Skin face
  ctx.fillStyle = '#f5c074';
  ctx.beginPath();
  ctx.arc(0, -9, 6, 0, Math.PI * 2);
  ctx.fill();

  // Red cap
  ctx.fillStyle = '#cc2222';
  ctx.beginPath();
  ctx.arc(0, -12, 7, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(-7, -13, 16, 4);

  // Eyes (dots)
  ctx.fillStyle = '#111';
  ctx.fillRect(-3, -11, 2, 2);
  ctx.fillRect(1, -11, 2, 2);

  ctx.shadowBlur = 0;
  ctx.restore();
}

// Draw Mario's walk animation during mario_walk phase
function drawMarioWalkToken(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  const path = state.marioWalkPath;
  if (path.length === 0) return;

  const currentStepIdx = state.marioWalkStep;
  if (currentStepIdx >= path.length) return;

  const step = path[currentStepIdx];
  const stepDuration = step.pauseMs > 0 ? step.pauseMs : 280;

  // Compute current panel center
  const currentPos = panelCenter(step.ring, step.slot);

  // Compute previous panel center for lerp
  let prevPos = currentPos;
  if (currentStepIdx > 0) {
    const prevStep = path[currentStepIdx - 1];
    prevPos = panelCenter(prevStep.ring, prevStep.slot);
  } else {
    // Mario starts at ring 3, marioSlot
    prevPos = panelCenter(3, state.marioSlot);
  }

  // Lerp based on timer progress (move during first 70% of duration)
  const moveFraction = Math.min(1, state.marioWalkTimer / (stepDuration * 0.7));
  const mx = prevPos.x + (currentPos.x - prevPos.x) * moveFraction;
  const my = prevPos.y + (currentPos.y - prevPos.y) * moveFraction;

  // Draw already-walked steps with faded gold glow
  for (let i = 0; i < currentStepIdx; i++) {
    const s = path[i];
    const pos = panelCenter(s.ring, s.slot);
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // If pause step (heal/plus_one/double_power), draw a glowing ring
  if (step.pauseMs > 0 && moveFraction >= 1) {
    const glowAlpha = 0.5 + 0.5 * Math.sin(state.tick * 0.01);
    ctx.save();
    ctx.globalAlpha = glowAlpha;
    ctx.strokeStyle = step.panel === 'heal' ? '#44ff88' : step.panel === 'plus_one' ? '#ff88ff' : '#ffdd00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(mx, my, 16, 0, Math.PI * 2);
    ctx.stroke();

    // Show effect name
    const labelText = step.panel === 'heal' ? 'HEAL!' : step.panel === 'plus_one' ? '+1 ATTACK!' : '×2 POWER!';
    ctx.globalAlpha = 1;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = step.panel === 'heal' ? '#44ff88' : step.panel === 'plus_one' ? '#ff88ff' : '#ffdd00';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(labelText, mx, my - 18);
    ctx.fillText(labelText, mx, my - 18);
    ctx.restore();
  }

  drawMarioSprite(ctx, mx, my);
}

// Draw the boss in the center circle
export function drawBossCircle(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  tick: number
): void {
  const boss = state.boss;

  // Background circle
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(RING_CX, RING_CY, BOSS_RADIUS - 2, 0, Math.PI * 2);
  ctx.fill();

  // Boss color ring
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(RING_CX, RING_CY, BOSS_RADIUS - 2, 0, Math.PI * 2);
  ctx.stroke();

  // Draw boss art
  if (state.bossIndex === 0) {
    drawBoss0WithPencils(ctx, RING_CX, RING_CY, BOSS_RADIUS, tick, state.pencilsAlive, state.pencilCaseClosed);
  } else if (state.bossIndex === 1 && state.rubberBandSoloMode) {
    drawBoss1Solo(ctx, RING_CX, RING_CY, BOSS_RADIUS, tick);
  } else {
    const drawFn = BOSS_DRAW_FNS[state.bossIndex];
    if (drawFn) {
      drawFn(ctx, RING_CX, RING_CY, BOSS_RADIUS, tick);
    }
  }
}

// Draw left sidebar
export function drawLeftSidebar(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  const boss = state.boss;

  // Background
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, 160, CANVAS_H);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, 160, CANVAS_H);

  // Boss name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS', 80, 30);

  ctx.fillStyle = boss.color;
  ctx.font = 'bold 11px monospace';
  const nameParts = boss.name.split(' ');
  nameParts.forEach((part, i) => {
    ctx.fillText(part, 80, 50 + i * 16);
  });

  // Boss HP bar
  const barY = 100;
  const barW = 130;
  const barH = 18;
  const barX = 15;

  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);

  const hpPct = Math.max(0, boss.hp / boss.maxHp);
  const hpColor = hpPct > 0.5 ? '#44cc22' : hpPct > 0.25 ? '#ddaa00' : '#cc2222';
  ctx.fillStyle = hpColor;
  ctx.fillRect(barX, barY, barW * hpPct, barH);

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${boss.hp} / ${boss.maxHp}`, 80, barY + 13);

  // Boss 1: show rubber band count
  if (state.bossIndex === 1) {
    ctx.fillStyle = '#ff8800';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Bands: ${state.rubberBandCount}/10`, 80, barY + 32);
  }

  // Boss portrait area
  ctx.fillStyle = '#444';
  ctx.fillRect(15, 130, 130, 130);
  ctx.strokeStyle = boss.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 130, 130, 130);

  // Draw mini boss portrait
  ctx.save();
  ctx.beginPath();
  ctx.rect(15, 130, 130, 130);
  ctx.clip();
  const drawFn = BOSS_DRAW_FNS[state.bossIndex];
  if (drawFn) {
    drawFn(ctx, 80, 195, 55, Date.now());
  }
  ctx.restore();

  // Turn number
  ctx.fillStyle = '#aaa';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`TURN ${state.turnNumber}`, 80, 285);

  // Boss attack damage
  ctx.fillStyle = '#ff6644';
  ctx.font = '10px monospace';
  ctx.fillText(`ATK: ${state.boss.attack}`, 80, 305);

  // Special ability
  if (state.boss.special) {
    ctx.fillStyle = '#bb88ff';
    ctx.font = '9px monospace';
    ctx.fillText('SPECIAL ACTIVE', 80, 325);
  }
}

// Draw right sidebar
export function drawRightSidebar(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  tick: number
): void {
  // Background
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(700, 0, 200, CANVAS_H);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(700, 0, 200, CANVAS_H);

  const sx = 710;
  const sw = 180;

  // Player HP label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('MARIO', sx, 30);

  // Player HP bar
  const barY = 40;
  const barH = 18;
  ctx.fillStyle = '#333';
  ctx.fillRect(sx, barY, sw, barH);

  const hpPct = Math.max(0, state.playerHp / state.playerMaxHp);
  const hpColor = hpPct > 0.5 ? '#44cc22' : hpPct > 0.25 ? '#ddaa00' : '#cc2222';
  ctx.fillStyle = hpColor;
  ctx.fillRect(sx, barY, sw * hpPct, barH);

  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(sx, barY, sw, barH);

  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${state.playerHp} / ${state.playerMaxHp}`, sx + sw / 2, barY + 13);

  // Moves left
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('RING MOVES:', sx, 82);

  const movesColor = state.movesLeft <= 1 ? '#ff4444' : '#ffffff';
  ctx.fillStyle = movesColor;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`×${state.movesLeft}`, sx + sw / 2, 112);
  ctx.textAlign = 'left';

  // Instructions — context-sensitive based on puzzle control mode
  ctx.font = '10px monospace';
  const instrY = 130;
  const mode = state.phase === 'puzzle' ? state.puzzleControlMode : null;
  let lines: string[];
  if (mode === 'ring_select') {
    lines = ['--- RING SELECT ---', '↑/↓: cycle ring', 'ENTER: edit ring', 'Z: column mode', 'SHIFT: evaluate'];
  } else if (mode === 'ring_edit') {
    lines = ['--- RING EDIT ---', '←/→: rotate ring', 'ENTER: done', '', ''];
  } else if (mode === 'column_select') {
    lines = ['--- COL SELECT ---', '←/→: cycle col', 'ENTER: edit col', 'Z: back to rings', ''];
  } else if (mode === 'column_edit') {
    lines = ['--- COL EDIT ---', '↑/↓: slide col', 'ENTER: done', '', ''];
  } else {
    lines = ['--- CONTROLS ---', '↑/↓: ring cycle', '←/→: rotate/col', 'Z: mode switch', 'ENTER: confirm'];
  }
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? '#aaa' : '#777';
    ctx.fillText(line, sx, instrY + i * 16);
  });

  // Ring indicator
  ctx.fillStyle = '#aaa';
  ctx.font = '11px monospace';
  ctx.fillText(`Ring: ${state.selectedRing + 1}`, sx, 240);
  ctx.fillText(`Col: ${state.selectedColumn + 1}`, sx + 70, 240);

  // Phase info
  ctx.fillStyle = '#66aaff';
  ctx.font = 'bold 11px monospace';
  const phaseText: Record<string, string> = {
    puzzle:      'PUZZLE PHASE',
    mario_walk:  'MARIO WALKING...',
    boss_attack: 'BOSS ATTACKS!',
    attack_choice: 'CHOOSE ATTACK!',
    setup:       'PREPARING...',
  };
  const pt = phaseText[state.phase] ?? '';
  if (pt) {
    ctx.fillText(pt, sx, 260);
  }

  // Attack modifiers during mario_walk / attack_choice
  if (state.phase === 'mario_walk' || state.phase === 'attack_choice') {
    if (state.marioAttackCount > 1) {
      ctx.fillStyle = '#ff88ff';
      ctx.font = '10px monospace';
      ctx.fillText(`ATK COUNT: ×${state.marioAttackCount}`, sx, 278);
    }
    if (state.marioDamageMult > 1) {
      ctx.fillStyle = '#ffdd00';
      ctx.font = '10px monospace';
      ctx.fillText(`POWER: ×${state.marioDamageMult}`, sx, 294);
    }
  }

  // Last damage dealt
  if (state.lastDamageDealt > 0) {
    ctx.fillStyle = '#ff6644';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Dealt: ${state.lastDamageDealt}`, sx, 312);
  }
  if (state.lastBossDamage > 0) {
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`Boss hit: ${state.lastBossDamage}`, sx, 330);
  }

  if (state.marioElevated) {
    ctx.fillStyle = '#44ff44';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('ELEVATED ▲', sx, 350);
  }

  if (state.coinBonus > 0) {
    ctx.fillStyle = '#ffdd00';
    ctx.font = '10px monospace';
    ctx.fillText(`Coin bonus: +${state.coinBonus}`, sx, 366);
  }

  void tick;
}

// Draw top bar with phase and timer
export function drawTopBar(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  ctx.fillStyle = '#0a0a18';
  ctx.fillRect(0, 0, CANVAS_W, 40);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, CANVAS_W, 40);

  // Timer bar (only during puzzle phase)
  if (state.phase === 'puzzle') {
    const timerPct = Math.max(0, state.puzzleTimer / state.puzzleMaxTimer);
    const timerColor = timerPct > 0.5 ? '#44cc22' : timerPct > 0.25 ? '#ddaa00' : '#cc2222';
    ctx.fillStyle = timerColor;
    ctx.fillRect(170, 6, (CANVAS_W - 340) * timerPct, 10);
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(170, 6, CANVAS_W - 340, 10);

    const seconds = Math.ceil(state.puzzleTimer / 1000);
    ctx.fillStyle = '#fff';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${seconds}s`, CANVAS_W / 2, 20);

    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TIME', 140, 20);
  }

  // Phase label
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAPER MARIO BOSS RUSH', CANVAS_W / 2, 35);

  // Coins display (top-right)
  ctx.fillStyle = '#ffdd00';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Coins: ${state.coins}`, CANVAS_W - 8, 14);

}

// Draw bottom bar
export function drawBottomBar(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  ctx.fillStyle = '#0a0a18';
  ctx.fillRect(0, 620, CANVAS_W, 60);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 620, CANVAS_W, 60);

  // Ring selector indicators
  for (let r = 0; r < NUM_RINGS; r++) {
    const bx = 180 + r * 90;
    const by = 635;
    const isSelected = r === state.selectedRing;

    ctx.fillStyle = isSelected ? '#ffffff' : '#333';
    ctx.strokeStyle = isSelected ? '#ffdd44' : '#555';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.fillRect(bx, by, 80, 34);
    ctx.strokeRect(bx, by, 80, 34);

    ctx.fillStyle = isSelected ? '#000' : '#aaa';
    ctx.font = isSelected ? 'bold 12px monospace' : '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`RING ${r + 1}`, bx + 40, by + 22);
  }

  // Hint text
  const hint = getPhaseHint(state);
  ctx.fillStyle = '#88aacc';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(hint, CANVAS_W / 2, 668);
}

function getPhaseHint(state: GameState): string {
  switch (state.phase) {
    case 'puzzle': {
      if (state.movesLeft <= 0) return 'No moves left — press SHIFT to evaluate';
      const mode = state.puzzleControlMode;
      if (mode === 'ring_select') return '↑↓: cycle ring | ENTER: select ring | Z: switch to columns | SHIFT: evaluate';
      if (mode === 'ring_edit') return '←→: rotate ring | ENTER: done';
      if (mode === 'column_select') return '←→: cycle column | ENTER: select | Z: back to rings';
      if (mode === 'column_edit') return '↑↓: slide column | ENTER: done';
      return '';
    }
    case 'mario_walk':
      return state.envelopeMessage ? '📨 Reading envelope...' : 'Mario is walking the path...';
    case 'mario_mash':
      return 'MASH SPACE to smash the boss!';
    case 'boss_attack':
    case 'pencil_rain':
    case 'snap_shut':
      return state.blockWindowOpen ? 'PRESS SPACE to block!' : (state.bossAttackName || 'Boss is attacking!');
    case 'rainbow_roll_attack':
      return state.blockWindowOpen ? 'PRESS SPACE to block the Rainbow Roll!' : 'RAINBOW ROLL — incoming!';
    case 'attack_choice':
      return '[J] Jump  |  [H] Hammer';
    case 'primary_target':
      return 'Memorize the targeted panels!';
    case 'pencil_cutscene':
      return 'Pencils firing at targeted panels!';
    case 'boss_reload':
      return state.noReloadMode ? 'Worse Case — boss is weakened!' : 'Boss is reloading pencils...';
    case 'pencil_grab':
      return '← → Align arms, SPACE to grip';
    case 'bumper_bands':
      return 'Rubber Band is spreading bands across the rings!';
    case 'pullback':
      return 'Rubber bands returning — HP being restored...';
    case 'rubber_bind':
      return state.blockWindowOpen ? 'PRESS SPACE to block!' : 'Rubber Band is launching bands!';
    case 'arms_grab':
      return state.armsGrabGripped
        ? (state.armsPullHeld ? 'Pulling... release ↓ to deal damage!' : 'Hold ↓ to pull the rubber bands!')
        : '← → Align arms, SPACE to grip rubber bands';
    case 'snapback':
      return state.blockWindowOpen ? 'PRESS SPACE to block!' : 'Rubber Band is rushing in!';
    case 'trapped_snapback':
      return state.marioTied ? "Tied up — can't move!" : 'TRAPPED SNAPBACK incoming!';
    case 'solo_snapback_charge':
      return 'Line up a Magic Circle to grab the band!';
    case 'solo_grab_attempt': {
      const sub = state.soloGrabSubPhase;
      if (sub === 'moving') return 'Move ← → to position hands, then SPACE to grip!';
      return 'Align hands with band and press SPACE!';
    }
    case 'solo_snapback_attack':
      return state.blockWindowOpen ? 'PRESS SPACE to block!' : 'SOLO SNAPBACK incoming!';
    case 'solo_slam':
      return 'MASH SPACE to slam the band!';
    case 'solo_slingshot':
      return state.soloSlingshotLaunched ? 'LAUNCHING...' : 'Hold ↓ to charge, release to SLINGSHOT!';
    case 'enemy_turn_announce':
      return 'Boss is preparing to attack...';
    case 'hole_punch_attack':
      return 'Hole Punch punches the inner ring!';
    case 'main_squeeze':
      return state.blockWindowOpen ? 'PRESS SPACE to block!' : 'MAIN SQUEEZE — Hole Punch is closing in!';
    case 'gettin_down':
      return state.blockWindowOpen ? 'PRESS SPACE to block!' : "GETTIN' DOWN — rhythm attack incoming!";
    case 'hole_punch_inner':
      return state.blockWindowOpen ? 'PRESS SPACE to block!' : 'HOLE PUNCH + BASE SLAP — brace for impact!';
    case 'throwing_punches': {
      const isBoardP = state.throwingPunchesIdx < state.throwingPunchesBoardCount;
      if (state.blockWindowOpen) return 'PRESS SPACE to block!';
      if (isBoardP) return `HOLE PUNCH! (unblockable) — punch ${state.throwingPunchesIdx + 1} of ${state.throwingPunchesTotal}`;
      return `THROWING PUNCHES — punch ${state.throwingPunchesIdx + 1} of ${state.throwingPunchesTotal} — PRESS SPACE to block!`;
    }
    case 'whole_punch_charge':
      return 'THE WHOLE PUNCH is charging! Use the Earth Vellumental to elevate next turn!';
    case 'whole_punch_attempt':
      return state.marioElevated ? 'ELEVATED! Hole Punch will bonk your tile!' : 'THE WHOLE PUNCH! (no elevation — brace for impact!)';
    case 'whole_punch_arms':
      return state.wholePunchPulling
        ? `Ripping... ${Math.round(state.wholePunchPullT * 100)}% — Keep pressing ← !`
        : state.wholePunchArmsPos === 3 ? 'PRESS SPACE to grip the lid corner!' : 'Use ← → to move hands to the RIGHT CORNER!';
    case 'save_prompt':
      return '← → navigate   ENTER confirm';
    default:
      return '';
  }
}

function drawSpikyBurst(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  const spikes = 10;
  const outer = 22 * scale;
  const inner = 12 * scale;
  ctx.fillStyle = '#ff1111';
  ctx.strokeStyle = '#880000';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawHealBurst(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void {
  const s = 20 * scale;
  ctx.fillStyle = '#ff55aa';
  ctx.strokeStyle = '#880033';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.35);
  ctx.bezierCurveTo(x - s * 0.1, y - s * 0.1, x - s, y - s * 0.1, x - s * 0.5, y - s * 0.5);
  ctx.bezierCurveTo(x - s * 0.1, y - s * 0.9, x, y - s * 0.65, x, y - s * 0.45);
  ctx.bezierCurveTo(x, y - s * 0.65, x + s * 0.1, y - s * 0.9, x + s * 0.5, y - s * 0.5);
  ctx.bezierCurveTo(x + s, y - s * 0.1, x + s * 0.1, y - s * 0.1, x, y + s * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// Draw floating damage numbers
export function drawDamageNumbers(
  ctx: CanvasRenderingContext2D,
  numbers: DamageNumber[]
): void {
  for (const dn of numbers) {
    ctx.save();
    ctx.globalAlpha = dn.alpha;
    const displayText = dn.label != null ? dn.label : String(dn.value);
    const fontSize = Math.round(18 * dn.scale);

    if (dn.effectType === 'damage') {
      drawSpikyBurst(ctx, dn.x, dn.y, dn.scale);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#00ccff';
      ctx.strokeStyle = '#003366';
      ctx.lineWidth = 3;
      ctx.strokeText(displayText, dn.x, dn.y);
      ctx.fillText(displayText, dn.x, dn.y);
    } else if (dn.effectType === 'heal') {
      drawHealBurst(ctx, dn.x, dn.y, dn.scale);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#00ccff';
      ctx.strokeStyle = '#003366';
      ctx.lineWidth = 3;
      ctx.strokeText(displayText, dn.x, dn.y);
      ctx.fillText(displayText, dn.x, dn.y);
    } else {
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = dn.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText(displayText, dn.x, dn.y);
      ctx.fillText(displayText, dn.x, dn.y);
    }
    ctx.restore();
  }
}

// Draw flash effects
export function drawFlashEffects(
  ctx: CanvasRenderingContext2D,
  effects: FlashEffect[]
): void {
  for (const fx of effects) {
    ctx.save();
    ctx.globalAlpha = fx.alpha;
    ctx.fillStyle = fx.color;
    if (fx.target === 'boss') {
      ctx.beginPath();
      ctx.arc(RING_CX, RING_CY, BOSS_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(700, 0, 200, CANVAS_H);
    }
    ctx.restore();
  }
}

function drawJumpAnimation(ctx: CanvasRenderingContext2D, state: GameState): void {
  const T = state.attackAnimT;

  // Arc: T 0→0.5 approach boss, 0.5→1.0 return
  const approach = T < 0.5 ? T * 2 : (1 - T) * 2; // 0→1→0

  const start = panelCenter(state.marioFinalRing, state.marioFinalSlot);
  const arcHeight = Math.sin(approach * Math.PI) * 55;
  const mx = start.x + (RING_CX - start.x) * approach;
  const my = start.y + (RING_CY - start.y) * approach - arcHeight;

  // Arc trail
  ctx.save();
  ctx.strokeStyle = 'rgba(255,220,50,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) {
    const ti = i / 20;
    const app = ti < 0.5 ? ti * 2 : (1 - ti) * 2;
    const ax = start.x + (RING_CX - start.x) * app;
    const ay = start.y + (RING_CY - start.y) * app - Math.sin(app * Math.PI) * 55;
    if (i === 0) ctx.moveTo(ax, ay);
    else ctx.lineTo(ax, ay);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Impact flash at T ≈ 0.5
  if (T >= 0.44 && T <= 0.56) {
    const flashAlpha = (0.06 - Math.abs(T - 0.5)) / 0.06;
    ctx.save();
    ctx.globalAlpha = flashAlpha * 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(RING_CX, RING_CY, BOSS_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawMarioSprite(ctx, mx, my);

  // Timing instruction / result
  ctx.save();
  ctx.font = 'bold 15px monospace';
  ctx.textAlign = 'center';
  if (!state.attackTimingPressed) {
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeText('Press SPACE at impact!', RING_CX, RING_CY - BOSS_RADIUS - 20);
      ctx.fillText('Press SPACE at impact!', RING_CX, RING_CY - BOSS_RADIUS - 20);
    }
  } else {
    const qualityText: Record<string, string> = { excellent: 'EXCELLENT!', great: 'GREAT!', nice: 'NICE!', none: 'HIT!' };
    const txt = qualityText[state.attackQuality];
    const qualityColor: Record<string, string> = { excellent: '#ffdd00', great: '#88ff44', nice: '#44ddff', none: '#aaaaaa' };
    ctx.fillStyle = qualityColor[state.attackQuality];
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 22px monospace';
    ctx.strokeText(txt, RING_CX, RING_CY - BOSS_RADIUS - 20);
    ctx.fillText(txt, RING_CX, RING_CY - BOSS_RADIUS - 20);
  }
  ctx.restore();
}

function drawHammerGauge(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const T = state.attackAnimT;
  const NICE_START = 0.62;
  const GREAT_START = 0.76;
  const EXCELLENT_START = 0.88;

  // Gauge bar
  const gx = 180, gy = 590, gw = 540, gh = 28;
  ctx.fillStyle = '#222';
  roundRect(ctx, gx, gy, gw, gh, 6);
  ctx.fill();

  // Gauge fill — color shifts from green to yellow to red as it approaches full
  const fillW = gw * T;
  const fillColor = T < 0.5 ? '#44cc22' : T < EXCELLENT_START ? '#ddaa00' : '#ff4422';
  ctx.fillStyle = fillColor;
  ctx.fillRect(gx + 1, gy + 1, Math.max(0, fillW - 2), gh - 2);

  // Quality zone highlights
  const perfPulse = 0.6 + 0.4 * Math.sin(tick * 0.012);
  // NICE zone (cyan)
  ctx.fillStyle = `rgba(68,200,255,${perfPulse * 0.6})`;
  ctx.fillRect(gx + gw * NICE_START + 1, gy + 1, gw * (GREAT_START - NICE_START) - 1, gh - 2);
  // GREAT zone (green)
  ctx.fillStyle = `rgba(100,255,80,${perfPulse * 0.7})`;
  ctx.fillRect(gx + gw * GREAT_START + 1, gy + 1, gw * (EXCELLENT_START - GREAT_START) - 1, gh - 2);
  // EXCELLENT zone (gold, replaces old "PERFECT")
  ctx.fillStyle = `rgba(255,220,0,${perfPulse})`;
  ctx.fillRect(gx + gw * EXCELLENT_START, gy + 1, gw * (1 - EXCELLENT_START) - 1, gh - 2);

  // Zone labels
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#44c8ff';
  ctx.fillText('NICE', gx + gw * (NICE_START + (GREAT_START - NICE_START) / 2), gy - 4);
  ctx.fillStyle = '#64ff50';
  ctx.fillText('GREAT', gx + gw * (GREAT_START + (EXCELLENT_START - GREAT_START) / 2), gy - 4);
  ctx.fillStyle = '#ffdd00';
  ctx.fillText('EXCELLENT', gx + gw * (EXCELLENT_START + (1 - EXCELLENT_START) / 2), gy - 4);

  // Gauge border
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  roundRect(ctx, gx, gy, gw, gh, 6);
  ctx.stroke();

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HAMMER POWER', CANVAS_W / 2, gy - 18);

  // Instruction / result
  if (!state.attackTimingPressed) {
    const inAny = T >= NICE_START;
    const blink = Math.floor(Date.now() / 300) % 2 === 0;
    if (inAny && blink) {
      const zoneColor = T >= EXCELLENT_START ? '#ffdd00' : T >= GREAT_START ? '#88ff44' : '#44ddff';
      ctx.fillStyle = zoneColor;
      ctx.font = 'bold 26px monospace';
      ctx.textAlign = 'center';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('PRESS SPACE!', CANVAS_W / 2, 570);
      ctx.fillText('PRESS SPACE!', CANVAS_W / 2, 570);
    } else if (!inAny) {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '14px monospace';
      ctx.fillText('Wait for the quality zone...', CANVAS_W / 2, 570);
    }
  } else {
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    const qualityColor2: Record<string, string> = { excellent: '#ffdd00', great: '#88ff44', nice: '#44ddff', none: '#aaaaaa' };
    const qualityLabel: Record<string, string> = { excellent: 'EXCELLENT!', great: 'GREAT!', nice: 'NICE!', none: 'HIT!' };
    ctx.fillStyle = qualityColor2[state.attackQuality];
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText(qualityLabel[state.attackQuality], CANVAS_W / 2, 570);
    ctx.fillText(qualityLabel[state.attackQuality], CANVAS_W / 2, 570);
  }

  // Mario hammer windup illustration (simple pixel art above gauge)
  const hamX = CANVAS_W / 2;
  const hamY = 530;
  const chargeScale = 0.7 + T * 0.3; // grows as gauge fills
  ctx.save();
  ctx.translate(hamX, hamY);
  ctx.scale(chargeScale, chargeScale);
  // Hammer head (rectangle)
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(-6, -28, 12, 10);
  ctx.fillStyle = '#5c3010';
  ctx.fillRect(-8, -30, 16, 5);
  // Hammer handle
  ctx.fillStyle = '#c8a060';
  ctx.fillRect(-2, -18, 4, 18);
  ctx.restore();

  void tick;
}

function drawMashPhase(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const timeLeft = state.mashTimer / 1000;
  const timerFrac = state.mashTimer / 5000;

  // Countdown bar at top
  const barX = 160, barY = 50, barW = CANVAS_W - 320, barH = 20;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  const barColor = timerFrac > 0.5 ? '#44cc22' : timerFrac > 0.25 ? '#ddaa00' : '#cc2222';
  ctx.fillStyle = barColor;
  ctx.fillRect(barX, barY, barW * timerFrac, barH);
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${timeLeft.toFixed(1)}s`, CANVAS_W / 2, barY + 14);

  ctx.fillStyle = '#ffaa00';
  ctx.font = 'bold 16px monospace';
  const mashTitle = state.bossIndex === 1 ? '1000-FOLD ARMS — SNAP THE BANDS!' : 'MAGIC CIRCLE — MASH SPACE!';
  ctx.fillText(mashTitle, CANVAS_W / 2, barY - 8);

  // Hit counter — 10 circles showing hits used
  const circStartX = CANVAS_W / 2 - 4.5 * 24;
  for (let i = 0; i < 10; i++) {
    const used = i < state.mashCount;
    const isCooldown = !used && i === state.mashCount && state.mashCooldown > 0;
    ctx.fillStyle = used ? '#444' : isCooldown ? '#ff8800' : '#ffdd00';
    ctx.beginPath();
    ctx.arc(circStartX + i * 24, barY + barH + 20, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = used ? '#222' : '#888';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (used) {
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(circStartX + i * 24 - 5, barY + barH + 15);
      ctx.lineTo(circStartX + i * 24 + 5, barY + barH + 25);
      ctx.stroke();
    }
  }

  // Hits remaining label
  ctx.fillStyle = '#aaa';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${state.mashCount}/10 hits`, CANVAS_W / 2, barY + barH + 42);

  // Total damage so far
  if (state.mashDamageTotal > 0) {
    ctx.fillStyle = '#ffdd00';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`Total: ${state.mashDamageTotal}`, CANVAS_W / 2, RING_CY + BOSS_RADIUS + 30);
  }

  // MASH prompt — shows RELOADING if on cooldown, else MASH SPACE
  const allUsed = state.mashCount >= 10;
  if (!allUsed) {
    if (state.mashCooldown > 0) {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 22px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RELOADING...', CANVAS_W / 2, RING_CY - BOSS_RADIUS - 30);
    } else {
      const blink = Math.floor(Date.now() / 200) % 2 === 0;
      if (blink) {
        const pulse = 0.8 + 0.2 * Math.sin(tick * 0.02);
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ffdd00';
        ctx.font = 'bold 30px monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('MASH SPACE!!!', CANVAS_W / 2, RING_CY - BOSS_RADIUS - 30);
        ctx.fillText('MASH SPACE!!!', CANVAS_W / 2, RING_CY - BOSS_RADIUS - 30);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Draw Mario with long reaching arms toward boss
  const marioPos = panelCenter(state.marioFinalRing, state.marioFinalSlot);
  const marioX = marioPos.x;
  const marioY = marioPos.y;

  // Arm extends toward boss center
  const armStretch = 0.5 + 0.5 * Math.sin(tick * 0.025);
  const armEndX = marioX + (RING_CX - marioX) * armStretch;
  const armEndY = marioY + (RING_CY - marioY) * armStretch;

  ctx.strokeStyle = '#f5c074';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(marioX, marioY);
  ctx.lineTo(armEndX, armEndY);
  ctx.stroke();

  // Fist at end
  ctx.fillStyle = '#f5c074';
  ctx.beginPath();
  ctx.arc(armEndX, armEndY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cc2222';
  ctx.beginPath();
  ctx.arc(armEndX, armEndY, 4, 0, Math.PI * 2);
  ctx.fill();

  drawMarioSprite(ctx, marioX, marioY);

  void tick;
}

// Draw attack choice overlay
function drawAttackChoiceOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const bw = 480;
  const bh = 260;
  const bx = CANVAS_W / 2 - bw / 2;
  const by = CANVAS_H / 2 - bh / 2;

  ctx.fillStyle = '#1a1a2e';
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.fill();

  ctx.strokeStyle = '#ffdd44';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, bw, bh, 12);
  ctx.stroke();

  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('MARIO REACHED AN ACTION PANEL!', CANVAS_W / 2, by + 38);

  // Show attack count / power multiplier
  const attackCount = state.marioAttackCount;
  const damageMult = state.marioDamageMult;
  const modParts: string[] = [];
  if (attackCount > 1) modParts.push(`ATTACK COUNT: ×${attackCount}`);
  if (damageMult > 1) modParts.push(`POWER: ×${damageMult}`);
  if (modParts.length > 0) {
    ctx.fillStyle = '#ff88ff';
    ctx.font = '12px monospace';
    ctx.fillText(modParts.join('  |  '), CANVAS_W / 2, by + 60);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = '13px monospace';
  ctx.fillText('Choose your attack:', CANVAS_W / 2, by + 82);

  const heartBonus = state.maxUpHeartsBought * 2;
  const jumpBase = 6 + heartBonus;  // normal hit
  const jumpMax = 9 + heartBonus;   // excellent hit
  const hammerBase = 7 + heartBonus;
  const hammerMax = 12 + heartBonus;

  // [J] Jump button
  const jbx = CANVAS_W / 2 - 210;
  const jby = by + 98;
  const btnW = 190;
  const btnH = 80;

  ctx.fillStyle = '#ccaa00';
  roundRect(ctx, jbx, jby, btnW, btnH, 8);
  ctx.fill();
  ctx.strokeStyle = '#ffee44';
  ctx.lineWidth = 2;
  roundRect(ctx, jbx, jby, btnW, btnH, 8);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[J] Jump', jbx + btnW / 2, jby + 32);
  ctx.font = '12px monospace';
  ctx.fillStyle = '#ffeeaa';
  ctx.fillText(`${jumpBase}-${jumpMax} × ${damageMult} × ${attackCount}`, jbx + btnW / 2, jby + 56);

  // [H] Hammer button
  const hbx = CANVAS_W / 2 + 20;
  const hby = by + 98;

  ctx.fillStyle = '#884400';
  roundRect(ctx, hbx, hby, btnW, btnH, 8);
  ctx.fill();
  ctx.strokeStyle = '#ff8822';
  ctx.lineWidth = 2;
  roundRect(ctx, hbx, hby, btnW, btnH, 8);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('[H] Hammer', hbx + btnW / 2, hby + 32);
  const hammerInRange = state.marioFinalRing <= 1;
  ctx.font = '11px monospace';
  ctx.fillStyle = hammerInRange ? '#ffcc88' : '#ff6666';
  const rangeText = hammerInRange
    ? `${hammerBase}-${hammerMax} × ${damageMult} × ${attackCount}`
    : `Ring ${state.marioFinalRing + 1} — OUT OF RANGE!`;
  ctx.fillText(rangeText, hbx + btnW / 2, hby + 56);
  if (!hammerInRange) {
    ctx.fillStyle = '#ff6666';
    ctx.font = '10px monospace';
    ctx.fillText('Must be on Ring 1 or 2!', hbx + btnW / 2, hby + 70);
  }

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Press J for Jump or H for Hammer', CANVAS_W / 2, by + bh - 16);

  // Boss 1: warn player that jump/hammer are resisted
  if (state.bossIndex === 1) {
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ Rubber Band resists attacks! Use Magic Circle → 1000-Fold Arms!', CANVAS_W / 2, by + bh - 36);
  }

  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
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

// Draw title screen
export function drawTitleScreen(
  ctx: CanvasRenderingContext2D,
  titleRingAngle: number
): void {
  drawBgImage(ctx, _titleBg, '#0a0a18');

  // Dark gradient overlay for readability
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.5, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0.65)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Title text
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 52px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 6;
  ctx.strokeText('PAPER MARIO', CANVAS_W / 2, 130);
  ctx.fillText('PAPER MARIO', CANVAS_W / 2, 130);

  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 38px monospace';
  ctx.strokeText('BOSS RUSH', CANVAS_W / 2, 180);
  ctx.fillText('BOSS RUSH', CANVAS_W / 2, 180);

  // Press space to start (blinking)
  const blink = Math.floor(Date.now() / 600) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px monospace';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('Press SPACE to Start', CANVAS_W / 2, CANVAS_H - 70);
    ctx.fillText('Press SPACE to Start', CANVAS_W / 2, CANVAS_H - 70);
  }

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '12px monospace';
  ctx.lineWidth = 0;
  ctx.fillText('6 BOSSES  ·  RING PUZZLE BATTLE  ·  LEGION OF STATIONERY', CANVAS_W / 2, CANVAS_H - 35);

  ctx.fillStyle = '#55aacc';
  ctx.fillText('Press T for Testing Mode', CANVAS_W / 2, CANVAS_H - 15);

  void titleRingAngle;
}

export function drawMainMenu(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Background switches based on cursor position
  const bgImg = state.mainMenuCursor === 'shop' ? _shopBg : _menuBg;
  drawBgImage(ctx, bgImg, state.mainMenuCursor === 'shop' ? '#8b4513' : '#cc0000');

  // Dark overlay
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 48px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText('BOSS RUSH', CANVAS_W / 2, 110);
  ctx.fillText('BOSS RUSH', CANVAS_W / 2, 110);

  // Coin display
  ctx.fillStyle = '#ffdd00';
  ctx.font = 'bold 22px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeText(`Coins: ${state.coins}`, CANVAS_W / 2, 160);
  ctx.fillText(`Coins: ${state.coins}`, CANVAS_W / 2, 160);

  // Menu options
  const fightSel   = state.mainMenuCursor === 'fight';
  const restartSel = state.mainMenuCursor === 'restart';
  const shopSel    = state.mainMenuCursor === 'shop';
  const htpSel     = state.mainMenuCursor === 'how_to_play';

  type MenuBtn = { label: string; selLabel: string; sel: boolean; y: number; color: string; selColor: string };
  const buttons: MenuBtn[] = [
    { label: 'FIGHT',       selLabel: '▶ FIGHT ◀',       sel: fightSel,   y: 245, color: '#cccccc', selColor: '#ffdd44' },
    { label: 'RESTART GAME',selLabel: '▶ RESTART GAME ◀',sel: restartSel, y: 315, color: '#cccccc', selColor: '#ff8888' },
    { label: 'SHOP',        selLabel: '▶ SHOP ◀',         sel: shopSel,    y: 385, color: '#cccccc', selColor: '#ffdd44' },
    { label: 'HOW TO PLAY', selLabel: '▶ HOW TO PLAY ◀', sel: htpSel,     y: 455, color: '#cccccc', selColor: '#88ddff' },
  ];

  for (const btn of buttons) {
    ctx.fillStyle = btn.sel ? `rgba(255,221,68,0.2)` : 'rgba(0,0,0,0.3)';
    ctx.fillRect(CANVAS_W / 2 - 160, btn.y - 42, 320, 62);
    ctx.strokeStyle = btn.sel ? btn.selColor : '#666';
    ctx.lineWidth = btn.sel ? 3 : 1;
    ctx.strokeRect(CANVAS_W / 2 - 160, btn.y - 42, 320, 62);
    ctx.fillStyle = btn.sel ? btn.selColor : btn.color;
    ctx.font = `bold ${btn.sel ? 34 : 28}px monospace`;
    ctx.lineWidth = btn.sel ? 4 : 0;
    if (btn.sel) { ctx.strokeStyle = '#000'; ctx.strokeText(btn.selLabel, CANVAS_W / 2, btn.y); }
    ctx.fillText(btn.sel ? btn.selLabel : btn.label, CANVAS_W / 2, btn.y);
  }

  // Save data notice
  try {
    if (localStorage.getItem('pmBossRush')) {
      ctx.fillStyle = '#44ff88';
      ctx.font = '14px monospace';
      ctx.lineWidth = 0;
      ctx.fillText('★ Continue save found — FIGHT will resume from saved progress', CANVAS_W / 2, CANVAS_H - 60);
    }
  } catch (_) { /* ignore */ }

  // Instructions
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.lineWidth = 0;
  ctx.fillText('↑ ↓ — navigate     ENTER / SPACE — select', CANVAS_W / 2, CANVAS_H - 25);
}

export function drawHowToPlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Subtle grid background
  ctx.strokeStyle = 'rgba(80,80,160,0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke(); }
  for (let y = 0; y < CANVAS_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke(); }

  const page = state.howToPlayPage;
  const PAGES = 2;

  // Header
  ctx.textAlign = 'center';
  ctx.fillStyle = '#88ddff';
  ctx.font = 'bold 32px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeText('HOW TO PLAY', CANVAS_W / 2, 42);
  ctx.fillText('HOW TO PLAY', CANVAS_W / 2, 42);

  // Page indicators
  for (let i = 0; i < PAGES; i++) {
    ctx.beginPath();
    ctx.arc(CANVAS_W / 2 - (PAGES - 1) * 14 + i * 28, 62, 7, 0, Math.PI * 2);
    ctx.fillStyle = i === page ? '#88ddff' : '#334455';
    ctx.fill();
    ctx.strokeStyle = '#88ddff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.textAlign = 'left';
  ctx.lineWidth = 0;

  // ── PAGE 0: CONTROLS ─────────────────────────────────────────────────────
  if (page === 0) {
    const col1 = 60, col2 = 490;

    // Section: Puzzle Controls
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('PUZZLE CONTROLS', col1, 105);
    ctx.fillStyle = '#334455';
    ctx.fillRect(col1, 110, 380, 2);

    const puzzleControls = [
      ['↑ / ↓',         'Select ring (inner → outer)'],
      ['← / →',         'Rotate selected ring CW/CCW'],
      ['Z',             'Switch to column slide mode'],
      ['↑ / ↓  (col)',  'Slide column inward/outward'],
      ['X',             'Undo ring selection'],
      ['SHIFT',         'End puzzle & walk'],
    ];
    ctx.font = '15px monospace';
    puzzleControls.forEach(([key, desc], i) => {
      const y = 136 + i * 34;
      ctx.fillStyle = '#88ddff';
      ctx.fillText(key, col1 + 8, y);
      ctx.fillStyle = '#cccccc';
      ctx.fillText(desc, col1 + 155, y);
    });

    // Section: Combat Controls
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('COMBAT CONTROLS', col2, 105);
    ctx.fillStyle = '#334455';
    ctx.fillRect(col2, 110, 360, 2);

    const combatControls = [
      ['J',       'Jump attack'],
      ['H',       'Hammer attack'],
      ['SPACE',   'Timing press (action windows)'],
      ['SPACE',   'Block incoming attacks'],
      ['SPACE',   'Mash during 1000-Fold Arms'],
      ['ENTER',   'Confirm ring'],
    ];
    ctx.font = '15px monospace';
    combatControls.forEach(([key, desc], i) => {
      const y = 136 + i * 34;
      ctx.fillStyle = '#88ddff';
      ctx.fillText(key, col2 + 8, y);
      ctx.fillStyle = '#cccccc';
      ctx.fillText(desc, col2 + 118, y);
    });

    // Section: Attack Timing
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('ATTACK TIMING', col1, 368);
    ctx.fillStyle = '#334455';
    ctx.fillRect(col1, 373, 790, 2);

    const timings = [
      ['EXCELLENT', '#ffdd00', 'Press SPACE exactly as Mario lands/swings — maximum damage'],
      ['GREAT',     '#88ff44', 'Press SPACE slightly early or late — bonus damage'],
      ['NICE',      '#44ddff', 'Press SPACE within the timing window — small bonus'],
      ['(miss)',    '#888888', 'No press or too early/late — base damage only'],
    ];
    ctx.font = '15px monospace';
    timings.forEach(([label, color, desc], i) => {
      const y = 400 + i * 34;
      ctx.fillStyle = color as string;
      ctx.font = 'bold 15px monospace';
      ctx.fillText(label, col1 + 8, y);
      ctx.fillStyle = '#cccccc';
      ctx.font = '15px monospace';
      ctx.fillText(desc, col1 + 160, y);
    });

    // Section: General
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('GENERAL', col1, 545);
    ctx.fillStyle = '#334455';
    ctx.fillRect(col1, 550, 790, 2);
    const general = [
      ['P / ESC',  'Pause / unpause'],
      ['Click',    'Pause button (top-right corner)'],
    ];
    ctx.font = '15px monospace';
    general.forEach(([key, desc], i) => {
      const y = 576 + i * 30;
      ctx.fillStyle = '#88ddff';
      ctx.fillText(key, col1 + 8, y);
      ctx.fillStyle = '#cccccc';
      ctx.fillText(desc, col1 + 155, y);
    });
  }

  // ── PAGE 1: PANELS ───────────────────────────────────────────────────────
  if (page === 1) {
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 18px monospace';
    ctx.fillText('RING PANELS', 60, 105);
    ctx.fillStyle = '#334455';
    ctx.fillRect(60, 110, 780, 2);

    const panels: Array<[string, string, string]> = [
      ['#ff4444', '▲ ARROW UP',      'Move Mario one ring inward'],
      ['#4488ff', '▼ ARROW DOWN',    'Move Mario one ring outward'],
      ['#4488ff', '◀ ARROW LEFT',    'Move Mario one slot counter-clockwise'],
      ['#4488ff', '▶ ARROW RIGHT',   'Move Mario one slot clockwise'],
      ['#ff4444', '★ ACTION',        'Mario stops here — choose Jump or Hammer attack'],
      ['#ff88ff', '◉ ON PANEL',      'Activates magic circles encountered later on this path'],
      ['#ffdd00', '✦ MAGIC CIRCLE',  'If ON activated: 1000-Fold Arms! Otherwise Mario passes through'],
      ['#88ff44', '＋1 PLUS ONE',    'Mario attacks twice this turn'],
      ['#ff8800', '×2 DOUBLE POWER', 'Damage is multiplied by 2 this turn'],
      ['#ffcc44', '🎁 TREASURE',     'Opens a chest — grants bonus coins'],
      ['#aaffcc', '✉ ENVELOPE',      'Displays a gameplay tip for this encounter'],
      ['#ffdd88', '◎ COIN',          'Collected coins add bonus damage on the final attack'],
      ['#888888', '— EMPTY',         'Mario continues in his last direction (momentum)'],
    ];

    const col1 = 70, col2 = 490;
    ctx.font = '14px monospace';
    panels.forEach(([color, name, desc], i) => {
      const col = i < 7 ? col1 : col2;
      const row = i < 7 ? i : i - 7;
      const y = 140 + row * 66;

      // Color swatch
      ctx.fillStyle = color;
      ctx.fillRect(col, y - 16, 18, 18);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.strokeRect(col, y - 16, 18, 18);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(name, col + 26, y - 2);
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '13px monospace';
      ctx.fillText(desc, col + 26, y + 15);
    });
  }

  // Footer
  ctx.textAlign = 'center';
  ctx.fillStyle = '#556677';
  ctx.font = '14px monospace';
  const nav = page === 0 ? '→ Next page' : '← Prev page';
  ctx.fillText(`${nav}     |     ESC / ENTER — back to menu`, CANVAS_W / 2, CANVAS_H - 18);
}

export function drawShop(ctx: CanvasRenderingContext2D, state: GameState): void {
  drawBgImage(ctx, _shopBg, '#8b4513');

  // Left panel overlay for item list
  ctx.fillStyle = 'rgba(10,10,30,0.72)';
  ctx.fillRect(0, 0, 480, CANVAS_H);

  ctx.textAlign = 'left';

  // Shop title
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 32px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeText('SHOP', 24, 52);
  ctx.fillText('SHOP', 24, 52);

  // Coin display
  ctx.fillStyle = '#ffdd00';
  ctx.font = 'bold 18px monospace';
  ctx.strokeText(`Coins: ${state.coins}`, 24, 84);
  ctx.fillText(`Coins: ${state.coins}`, 24, 84);

  // Item list
  const itemH = 52;
  const listTop = 108;

  for (let i = 0; i < SHOP_ITEMS.length; i++) {
    const item = SHOP_ITEMS[i];
    const y = listTop + i * itemH;
    const isSel = i === state.shopCursor;
    const isMaxUp = item.key === 'maxUpHeart';
    const owned = isMaxUp
      ? false
      : (state.accessories[item.key as keyof AccessoryInventory] === true);
    const stock = isMaxUp ? state.maxUpHeartsInStock : null;
    const canAfford = state.coins >= item.cost;

    // Row highlight
    if (isSel) {
      ctx.fillStyle = 'rgba(255,221,68,0.18)';
      ctx.fillRect(8, y - 2, 462, itemH - 4);
      ctx.strokeStyle = '#ffdd44';
      ctx.lineWidth = 2;
      ctx.strokeRect(8, y - 2, 462, itemH - 4);
    }

    // Cursor arrow
    const nameColor = owned ? '#44cc66' : (isSel ? '#ffdd44' : (canAfford ? '#ffffff' : '#888888'));
    ctx.fillStyle = nameColor;
    ctx.font = `bold 17px monospace`;
    const prefix = owned ? '✓ ' : (isSel ? '▶ ' : '  ');
    ctx.lineWidth = isSel ? 2 : 0;
    if (isSel) { ctx.strokeStyle = '#000'; ctx.strokeText(`${prefix}${item.name}`, 18, y + 20); }
    ctx.fillText(`${prefix}${item.name}`, 18, y + 20);

    // Cost / stock / owned label on right
    ctx.font = '14px monospace';
    const costStr = owned ? 'OWNED' : isMaxUp ? `${item.cost}¢  (${stock} in stock)` : `${item.cost} coins`;
    ctx.fillStyle = owned ? '#44cc66' : (canAfford ? '#ffdd44' : '#ff6666');
    ctx.textAlign = 'right';
    ctx.fillText(costStr, 466, y + 20);
    ctx.textAlign = 'left';

    // Description
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '13px monospace';
    ctx.fillText(item.desc, 28, y + 38);
  }

  // Detail panel on the right (show selected item info)
  const selItem = SHOP_ITEMS[state.shopCursor];
  if (selItem) {
    const rx = 510, rw = CANVAS_W - rx - 20;
    ctx.fillStyle = 'rgba(10,10,30,0.7)';
    ctx.fillRect(rx - 10, 80, rw + 10, 180);
    ctx.strokeStyle = '#ffdd44';
    ctx.lineWidth = 2;
    ctx.strokeRect(rx - 10, 80, rw + 10, 180);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdd44';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(selItem.name, rx + rw / 2, 115);
    ctx.fillStyle = '#ffffff';
    ctx.font = '15px monospace';
    ctx.fillText(selItem.desc, rx + rw / 2, 145);
    ctx.fillStyle = '#ffdd00';
    ctx.fillText(`Cost: ${selItem.cost} coins`, rx + rw / 2, 175);
    if (selItem.key === 'maxUpHeart') {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = '13px monospace';
      ctx.fillText(`Stock: ${state.maxUpHeartsInStock}`, rx + rw / 2, 200);
      ctx.fillText('Restocks on first boss clears', rx + rw / 2, 222);
    }
  }

  // Instructions
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '14px monospace';
  ctx.fillText('↑↓ navigate   ENTER/SPACE buy   ESC back', CANVAS_W / 2, CANVAS_H - 20);
}

// Draw boss intro screen
export function drawBossIntro(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  tick: number
): void {
  const progress = 1 - state.introTimer / 4500;
  const alpha = Math.min(1, progress * 3);

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  for (let i = 0; i < 8; i++) {
    ctx.fillStyle = i % 2 === 0 ? state.boss.color + '22' : '#00000022';
    ctx.fillRect(0, i * (CANVAS_H / 8), CANVAS_W, CANVAS_H / 8);
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  const drawFn = BOSS_DRAW_FNS[state.bossIndex];
  if (drawFn) {
    drawFn(ctx, CANVAS_W / 2, CANVAS_H / 2 + 20, 90, tick);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = state.boss.color;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText(state.boss.name, CANVAS_W / 2, CANVAS_H / 2 - 80);
  ctx.fillText(state.boss.name, CANVAS_W / 2, CANVAS_H / 2 - 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText(`HP: ${state.boss.hp}  ATK: ${state.boss.attack}`, CANVAS_W / 2, CANVAS_H / 2 - 40);
  ctx.restore();
}

// Draw victory screen
export function drawVictoryScreen(
  ctx: CanvasRenderingContext2D,
  confetti: ConfettiParticle[]
): void {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  for (const p of confetti) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 72px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 6;
  ctx.strokeText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2 - 30);
  ctx.fillText('YOU WIN!', CANVAS_W / 2, CANVAS_H / 2 - 30);

  ctx.fillStyle = '#ffffff';
  ctx.font = '22px monospace';
  ctx.fillText('All 3 bosses defeated!', CANVAS_W / 2, CANVAS_H / 2 + 30);

  const blink = Math.floor(Date.now() / 600) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#aaffaa';
    ctx.font = '16px monospace';
    ctx.fillText('Press ENTER to play again', CANVAS_W / 2, CANVAS_H / 2 + 80);
  }
}

// Draw game over screen
export function drawGameOver(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0,0,0,0.9)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.fillStyle = '#cc2222';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 20);
  ctx.fillText('GAME OVER', CANVAS_W / 2, CANVAS_H / 2 - 20);

  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText('Mario has fallen...', CANVAS_W / 2, CANVAS_H / 2 + 30);

  const blink = Math.floor(Date.now() / 600) % 2 === 0;
  if (blink) {
    ctx.fillStyle = '#ffaaaa';
    ctx.font = '16px monospace';
    ctx.fillText('Press ENTER to retry from Boss 1', CANVAS_W / 2, CANVAS_H / 2 + 70);
  }
}

// Draw the boss attack projectile traveling from boss to Mario
function drawRubberBandProjectile(ctx: CanvasRenderingContext2D, x: number, y: number, spin: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(spin);
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.strokeStyle = '#cc4400';
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 1.4);
  ctx.strokeStyle = '#ff8844';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function drawAttackProjectile(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  tick: number
): void {
  const t = state.attackProjectileT;
  if (t <= 0 || t >= 1) return;

  const marioTarget = panelCenter(state.marioFinalRing, state.marioFinalSlot);
  const marioX = marioTarget.x;
  const marioY = marioTarget.y;
  const eased = t * t * (3 - 2 * t);

  // Boss 1 (Rubber Band): draw 3 rubber band projectiles in a spread
  if (state.bossIndex === 1) {
    const offsets = [
      { ox: -18, oy: 0, delay: 0 },
      { ox: 0,   oy: 0, delay: 0.08 },
      { ox: 18,  oy: 0, delay: 0.16 },
    ];
    const angle = Math.atan2(marioY - RING_CY, marioX - RING_CX);
    const perpX = -Math.sin(angle);
    const perpY = Math.cos(angle);
    for (const { ox, delay } of offsets) {
      const localT = Math.max(0, Math.min(1, (t - delay) / (1 - delay)));
      const le = localT * localT * (3 - 2 * localT);
      const px = RING_CX + (marioX - RING_CX) * le + perpX * ox;
      const py = RING_CY + (marioY - RING_CY) * le + perpY * ox;
      drawRubberBandProjectile(ctx, px, py, tick * 0.05);
    }
    void tick;
    return;
  }

  const px = RING_CX + (marioX - RING_CX) * eased;
  const py = RING_CY + (marioY - RING_CY) * eased;

  // Direction of travel
  const angle = Math.atan2(marioY - RING_CY, marioX - RING_CX);

  const isSnapOrWorseCase = state.bossAttackName === 'SNAP SHUT' || state.bossAttackName === 'WORSE CASE';

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle - Math.PI / 2); // tip toward Mario

  if (isSnapOrWorseCase) {
    // Draw pencil case (silver rectangle)
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(-10, -18, 20, 36);
    ctx.fillStyle = '#aaaaaa';
    ctx.fillRect(-10, -18, 20, 8);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-10, -18, 20, 36);
    // Latch
    ctx.fillStyle = '#ffdd44';
    ctx.fillRect(-3, -2, 6, 6);
  } else {
    // Draw colored pencil
    const pencilColors = ['#ff4466', '#ff8800', '#ffcc00', '#44cc55', '#4488ff', '#cc44ff'];
    const colorIndex = Math.floor(tick * 0.01) % pencilColors.length;
    const pencilColor = pencilColors[colorIndex];

    // Pencil body (wood)
    ctx.fillStyle = '#f5e070';
    ctx.fillRect(-4, -16, 8, 24);
    // Colored tip
    ctx.fillStyle = pencilColor;
    ctx.beginPath();
    ctx.moveTo(-4, 8);
    ctx.lineTo(4, 8);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fill();
    // Eraser end
    ctx.fillStyle = '#ffaaaa';
    ctx.fillRect(-4, -20, 8, 6);
    // Silver ferrule
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(-4, -16, 8, 4);
    // Pencil outline
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, -20, 8, 30);
  }

  ctx.restore();
  void tick;
}

// Draw the block timing UI during boss_attack / pencil_rain / snap_shut phases
function drawBlockUI(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  tick: number
): void {
  const BLOCK_START = state.phase === 'rainbow_roll_attack' ? 0.55 : 0.62;
  const BLOCK_END = state.phase === 'rainbow_roll_attack' ? 0.85 : 0.88;
  const t = state.phase === 'rainbow_roll_attack' ? state.rainbowRollAttackT : state.attackProjectileT;

  // Timing bar at bottom
  const barX = 200, barY = 640, barW = 500, barH = 20;

  // Background
  ctx.fillStyle = '#333333';
  roundRect(ctx, barX, barY, barW, barH, 5);
  ctx.fill();

  // Progress fill
  const progress = Math.min(1, t);
  ctx.fillStyle = '#666666';
  ctx.fillRect(barX + 1, barY + 1, (barW - 2) * progress, barH - 2);

  // Block window highlight
  const winStart = barX + barW * BLOCK_START;
  const winEnd = barX + barW * BLOCK_END;
  const pulse = 0.6 + 0.4 * Math.sin(tick * 0.01);
  ctx.fillStyle = `rgba(0,255,100,${pulse})`;
  ctx.fillRect(winStart, barY + 1, winEnd - winStart, barH - 2);

  // Label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BLOCK TIMING', RING_CX, barY - 8);

  // "Press SPACE!" flash when window is open and not yet blocked
  if (state.blockWindowOpen && !state.playerBlocked) {
    const flash = 0.5 + 0.5 * Math.sin(tick * 0.025);
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS SPACE!', RING_CX, 600);
    ctx.globalAlpha = 1;
  }

  // "BLOCKED!" message if player blocked
  if (state.playerBlocked) {
    ctx.fillStyle = '#44ffaa';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BLOCKED!', RING_CX, 590);
  }

  // Attack name at top
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  const attackLabel = state.bossAttackName || `${state.boss.name} attacks!`;
  ctx.fillText(attackLabel, RING_CX, 20);
}

function drawPrimaryTargetOverlay(_ctx: CanvasRenderingContext2D, _state: GameState, _tick: number): void {
  // Targets shown on rings; attack name shown in corner — no overlay needed
}

function drawAttackNameCorner(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  if (!state.bossAttackName) return;
  const label = state.bossAttackName;
  const x = 790;
  const y = 560;
  const pulse = 0.85 + 0.15 * Math.sin(tick * 0.008);
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.textAlign = 'center';
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#ff2222';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeText(label, x, y);
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawPencilCutscene(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const blink = Math.floor(Date.now() / 200) % 2 === 0;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(160, 290, CANVAS_W - 320, 100);
  ctx.fillStyle = blink ? '#ffdd44' : '#ff8800';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PENCILS FIRE!', CANVAS_W / 2, 340);

  // Show remaining targets pulsing red
  for (const tp of state.targetedPanels) {
    const center = panelCenter(tp.ring, tp.slot);
    ctx.fillStyle = blink ? 'rgba(255,50,50,0.7)' : 'rgba(255,150,0,0.7)';
    ctx.beginPath(); ctx.arc(center.x, center.y, 14, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  void tick;
}

function drawBossReload(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const blink = Math.floor(Date.now() / 300) % 2 === 0;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(160, 295, CANVAS_W - 320, 90);
  ctx.fillStyle = blink ? '#44ff88' : '#22aa55';
  ctx.font = 'bold 30px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RELOAD', CANVAS_W / 2, 350);
  ctx.fillStyle = '#aaa';
  ctx.font = '14px monospace';
  ctx.fillText('All pencils restored!', CANVAS_W / 2, 375);
  ctx.restore();
  void tick;
  void state;
}

function drawPencilGrab(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  // Zoomed view — just boss + arms, no rings/HUD
  ctx.save();
  ctx.fillStyle = '#000a14';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw zoomed boss (pencil case) in center
  const bossCX = CANVAS_W / 2;
  const bossCY = CANVAS_H / 2 - 60;
  const zoomedRadius = BOSS_RADIUS * 2.8;

  // Boss background
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(bossCX, bossCY, zoomedRadius + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = state.boss.color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(bossCX, bossCY, zoomedRadius + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Draw boss pencils at zoomed scale
  drawBoss0WithPencils(ctx, bossCX, bossCY, zoomedRadius, tick, state.pencilsAlive, state.pencilCaseClosed);

  // Mario's 1000-fold arms from bottom of canvas toward the boss
  const marioFootX = CANVAS_W / 2;
  const marioFootY = CANVAS_H - 30;
  const armOffset = state.pencilGrabHandsPos * 28;
  const handTargetX = bossCX + armOffset;
  const handTargetY = bossCY + zoomedRadius + 20;
  const isAligned = state.pencilGrabHandsPos === 0;

  // Arm color pulses green when aligned, red when not
  const armPulse = 0.8 + 0.2 * Math.sin(tick * 0.015);
  const armColor = isAligned ? `rgba(100,255,120,${armPulse})` : '#cc2222';

  ctx.strokeStyle = isAligned ? armColor : '#cc2222';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';

  // Left arm curve
  ctx.beginPath();
  ctx.moveTo(marioFootX - 25, marioFootY);
  ctx.bezierCurveTo(
    marioFootX - 40, marioFootY - 120,
    handTargetX - 50, handTargetY + 80,
    handTargetX - 24, handTargetY
  );
  ctx.stroke();

  // Right arm curve
  ctx.beginPath();
  ctx.moveTo(marioFootX + 25, marioFootY);
  ctx.bezierCurveTo(
    marioFootX + 40, marioFootY - 120,
    handTargetX + 50, handTargetY + 80,
    handTargetX + 24, handTargetY
  );
  ctx.stroke();

  // Fists (white gloves)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(handTargetX - 24, handTargetY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(handTargetX + 24, handTargetY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Mini Mario body at bottom
  drawMarioSprite(ctx, marioFootX, marioFootY - 20);

  ctx.restore();

  // UI overlay (not zoomed)
  ctx.save();
  ctx.textAlign = 'center';

  // Title
  ctx.fillStyle = '#ff8800';
  ctx.font = 'bold 32px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText('1000-FOLD ARMS!', CANVAS_W / 2, 44);
  ctx.fillText('1000-FOLD ARMS!', CANVAS_W / 2, 44);

  // Instruction
  ctx.fillStyle = '#ffdd44';
  ctx.font = '14px monospace';
  ctx.lineWidth = 0;
  const grabInstruction = state.pencilGrabMode === 'case_close'
    ? '← → Align arms behind the case, then SPACE to slam it shut!'
    : '← → Align arms over pencils, then press SPACE to grip';
  ctx.fillText(grabInstruction, CANVAS_W / 2, 72);

  // Position bar
  const barCX = CANVAS_W / 2;
  const barY = CANVAS_H - 90;
  const barHalfW = 105; // 3 steps × 35px each side
  ctx.fillStyle = '#222';
  ctx.fillRect(barCX - barHalfW - 10, barY - 10, (barHalfW + 10) * 2, 22);
  // Center zone highlight
  ctx.fillStyle = isAligned ? 'rgba(100,255,120,0.4)' : 'rgba(255,255,255,0.1)';
  ctx.fillRect(barCX - 18, barY - 8, 36, 18);
  ctx.strokeStyle = isAligned ? '#44ff88' : '#555';
  ctx.lineWidth = 1;
  ctx.strokeRect(barCX - 18, barY - 8, 36, 18);
  // Marker
  const markerX = barCX + state.pencilGrabHandsPos * 35;
  ctx.fillStyle = isAligned ? '#44ff88' : '#ffdd44';
  ctx.beginPath();
  ctx.arc(markerX, barY + 1, 10, 0, Math.PI * 2);
  ctx.fill();
  // Tick marks
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  for (let i = -3; i <= 3; i++) {
    const tx = barCX + i * 35;
    ctx.beginPath();
    ctx.moveTo(tx, barY - 6);
    ctx.lineTo(tx, barY + 8);
    ctx.stroke();
  }

  // Grip prompt / status
  if (isAligned) {
    const blink = Math.floor(Date.now() / 350) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#44ff88';
      ctx.font = 'bold 26px monospace';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText('PRESS SPACE TO GRIP!', CANVAS_W / 2, CANVAS_H - 105);
      ctx.fillText('PRESS SPACE TO GRIP!', CANVAS_W / 2, CANVAS_H - 105);
    }
  } else {
    ctx.fillStyle = '#aaa';
    ctx.font = '15px monospace';
    ctx.lineWidth = 0;
    ctx.fillText('Align the arms to the CENTER', CANVAS_W / 2, CANVAS_H - 105);
  }

  ctx.restore();
}

function drawArmsGrab(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  ctx.save();
  ctx.fillStyle = '#000a14';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Draw zoomed boss (rubber band) in center
  const bossCX = CANVAS_W / 2;
  const bossCY = CANVAS_H / 2 - 50;
  const zoomedRadius = BOSS_RADIUS * 2.2;

  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(bossCX, bossCY, zoomedRadius + 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ff8800';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(bossCX, bossCY, zoomedRadius + 2, 0, Math.PI * 2);
  ctx.stroke();

  // Boss body (orange)
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.arc(bossCX, bossCY + zoomedRadius * 0.1, zoomedRadius * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Rubber band coils on boss (highlight where arms grab)
  ctx.strokeStyle = '#cc6600';
  ctx.lineWidth = 5;
  const grabY = bossCY - zoomedRadius * 0.35;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(bossCX - zoomedRadius * 0.4, grabY + i * 14);
    ctx.lineTo(bossCX + zoomedRadius * 0.4, grabY + i * 14);
    ctx.stroke();
  }

  // Mario's 1000-fold arms
  const marioFootX = CANVAS_W / 2;
  const marioFootY = CANVAS_H - 30;
  const armOffset = state.armsGrabGripped ? 0 : state.armsGrabHandsPos * 28;
  const handTargetX = bossCX + armOffset;
  const handTargetY = bossCY + zoomedRadius * 0.5;

  const isAligned = state.armsGrabHandsPos === 0;
  const armPulse = 0.8 + 0.2 * Math.sin(tick * 0.015);

  let armColor: string;
  if (state.armsGrabGripped) {
    // Gripped — stretch arms based on pull
    armColor = `rgba(255,200,80,${armPulse})`;
  } else {
    armColor = isAligned ? `rgba(100,255,120,${armPulse})` : '#cc2222';
  }

  // Pull stretch: when pulling, hands move up toward boss
  const pullY = state.armsGrabGripped ? handTargetY - state.armsPullT * zoomedRadius * 0.3 : handTargetY;

  ctx.strokeStyle = armColor;
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(marioFootX - 25, marioFootY);
  ctx.bezierCurveTo(marioFootX - 40, marioFootY - 120, handTargetX - 50, pullY + 80, handTargetX - 24, pullY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(marioFootX + 25, marioFootY);
  ctx.bezierCurveTo(marioFootX + 40, marioFootY - 120, handTargetX + 50, pullY + 80, handTargetX + 24, pullY);
  ctx.stroke();

  // Fists
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(handTargetX - 24, pullY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(handTargetX + 24, pullY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  drawMarioSprite(ctx, marioFootX, marioFootY - 20);
  ctx.restore();

  // UI overlay
  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ff8800';
  ctx.font = 'bold 32px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText('1000-FOLD ARMS!', CANVAS_W / 2, 44);
  ctx.fillText('1000-FOLD ARMS!', CANVAS_W / 2, 44);

  if (!state.armsGrabGripped) {
    ctx.fillStyle = '#ffdd44';
    ctx.font = '14px monospace';
    ctx.lineWidth = 0;
    ctx.fillText('← → Align over rubber bands at top, SPACE to grip', CANVAS_W / 2, 72);

    // Position bar
    const barCX = CANVAS_W / 2;
    const barY = CANVAS_H - 90;
    const barHalfW = 105;
    ctx.fillStyle = '#222';
    ctx.fillRect(barCX - barHalfW - 10, barY - 10, (barHalfW + 10) * 2, 22);
    ctx.fillStyle = isAligned ? 'rgba(100,255,120,0.4)' : 'rgba(255,255,255,0.1)';
    ctx.fillRect(barCX - 18, barY - 8, 36, 18);
    ctx.strokeStyle = isAligned ? '#44ff88' : '#555';
    ctx.lineWidth = 1;
    ctx.strokeRect(barCX - 18, barY - 8, 36, 18);
    const markerX = barCX + state.armsGrabHandsPos * 35;
    ctx.fillStyle = isAligned ? '#44ff88' : '#ffdd44';
    ctx.beginPath();
    ctx.arc(markerX, barY + 1, 10, 0, Math.PI * 2);
    ctx.fill();
    for (let i = -3; i <= 3; i++) {
      const tx = barCX + i * 35;
      ctx.strokeStyle = '#555';
      ctx.beginPath();
      ctx.moveTo(tx, barY - 6);
      ctx.lineTo(tx, barY + 8);
      ctx.stroke();
    }

    if (isAligned) {
      const blink = Math.floor(Date.now() / 350) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 26px monospace';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('PRESS SPACE TO GRIP!', CANVAS_W / 2, CANVAS_H - 105);
        ctx.fillText('PRESS SPACE TO GRIP!', CANVAS_W / 2, CANVAS_H - 105);
      }
    } else {
      ctx.fillStyle = '#aaa';
      ctx.font = '15px monospace';
      ctx.lineWidth = 0;
      ctx.fillText('Align the arms to the CENTER', CANVAS_W / 2, CANVAS_H - 105);
    }
  } else {
    // Gripped — show pull meter
    const inRange = state.marioFinalRing <= 1;
    ctx.fillStyle = inRange ? '#ffdd44' : '#ff8866';
    ctx.font = '14px monospace';
    ctx.lineWidth = 0;
    ctx.fillText(inRange ? 'Hold ↓ to pull, release to YANK!' : 'Ring too far — barely effective!', CANVAS_W / 2, 72);

    // Pull power bar
    const barX = CANVAS_W / 2 - 100;
    const barY2 = CANVAS_H - 90;
    const barW = 200;
    const barH = 20;
    ctx.fillStyle = '#222';
    ctx.fillRect(barX - 5, barY2 - 5, barW + 10, barH + 10);
    ctx.fillStyle = inRange ? '#ff4444' : '#aa6633';
    ctx.fillRect(barX, barY2, barW * state.armsPullT, barH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY2, barW, barH);

    const dmgPreview = inRange ? 20 + Math.round(state.armsPullT * 20) : 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`Pull power: ${Math.round(state.armsPullT * 100)}%  →  ~${dmgPreview} DMG`, CANVAS_W / 2, CANVAS_H - 105);

    if (state.armsPullHeld) {
      const blink = Math.floor(Date.now() / 200) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px monospace';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText('PULLING...', CANVAS_W / 2, CANVAS_H - 125);
        ctx.fillText('PULLING...', CANVAS_W / 2, CANVAS_H - 125);
      }
    }
  }

  ctx.restore();
}

export const PAUSE_BTN = { x: CANVAS_W - 52, y: 6, w: 46, h: 26 };

function drawPauseButton(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const fightPhases = ['puzzle', 'mario_walk', 'attack_choice', 'mario_jump', 'mario_hammer',
    'mario_mash', 'boss_attack', 'primary_target', 'pencil_cutscene', 'pencil_rain', 'snap_shut',
    'boss_reload', 'pencil_grab', 'rainbow_smash', 'rainbow_roll_attack', 'pullback', 'bumper_bands',
    'rubber_bind', 'arms_grab', 'snapback', 'trapped_snapback',
    'solo_snapback_charge', 'solo_grab_attempt', 'solo_snapback_attack', 'solo_slam', 'solo_slingshot',
    'gettin_down', 'hole_punch_inner', 'throwing_punches', 'main_squeeze',
    'whole_punch_charge', 'whole_punch_attempt', 'whole_punch_arms'];
  if (!fightPhases.includes(state.phase)) return;
  const { x, y, w, h } = PAUSE_BTN;
  ctx.save();
  ctx.fillStyle = state.paused ? '#ff8800' : 'rgba(40,40,40,0.8)';
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.strokeStyle = state.paused ? '#ffdd44' : '#666';
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 5);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.paused ? '▶ P' : '⏸ P', x + w / 2, y + h / 2);
  ctx.restore();
  void tick;
}

function drawRainbowSmash(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  ctx.save();

  // Overlay background
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Rainbow gradient title
  const gradient = ctx.createLinearGradient(CANVAS_W / 2 - 200, 0, CANVAS_W / 2 + 200, 0);
  gradient.addColorStop(0, '#ff0000');
  gradient.addColorStop(0.2, '#ff8800');
  gradient.addColorStop(0.4, '#ffff00');
  gradient.addColorStop(0.6, '#00ff00');
  gradient.addColorStop(0.8, '#0088ff');
  gradient.addColorStop(1, '#ff00ff');

  ctx.textAlign = 'center';
  ctx.fillStyle = gradient;
  ctx.font = 'bold 50px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 6;
  ctx.strokeText('RAINBOW ROLL!', CANVAS_W / 2, RING_CY - 130);
  ctx.fillText('RAINBOW ROLL!', CANVAS_W / 2, RING_CY - 130);

  // Timer countdown
  const timeLeft = state.rainbowSmashTimer / 1000;
  const timerFrac = state.rainbowSmashTimer / 5000;
  const barX = 160, barY = RING_CY - 95, barW = CANVAS_W - 320, barH = 18;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  const barColor = timerFrac > 0.5 ? '#44cc22' : timerFrac > 0.25 ? '#ddaa00' : '#cc2222';
  ctx.fillStyle = barColor;
  ctx.fillRect(barX, barY, barW * timerFrac, barH);
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(`${timeLeft.toFixed(1)}s`, CANVAS_W / 2, barY + 13);

  // Smash count
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(`Smashes: ${state.rainbowSmashCount}`, CANVAS_W / 2, RING_CY - 45);

  // SMASH prompt
  if (state.rainbowSmashCooldown <= 0) {
    const blink = Math.floor(Date.now() / 200) % 2 === 0;
    if (blink) {
      const pulse = 0.8 + 0.2 * Math.sin(tick * 0.02);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ffdd00';
      ctx.font = 'bold 32px monospace';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeText('SMASH SPACE!!!', CANVAS_W / 2, RING_CY + 80);
      ctx.fillText('SMASH SPACE!!!', CANVAS_W / 2, RING_CY + 80);
      ctx.globalAlpha = 1;
    }
  } else {
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('COOLDOWN...', CANVAS_W / 2, RING_CY + 80);
  }

  ctx.restore();
  void tick;
}

function drawRainbowRollAttack(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  // Draw projectile — a spiraling rainbow ball traveling from boss to Mario
  const t = state.rainbowRollAttackT;
  if (t <= 0 || t >= 1) {
    // Show "PRESS SPACE to block!" overlay
    if (t < 1) {
      const blink = Math.floor(Date.now() / 300) % 2 === 0;
      if (blink) {
        ctx.save();
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 22px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('RAINBOW ROLL ATTACK!', CANVAS_W / 2, 60);
        ctx.restore();
      }
    }
    return;
  }

  const slotAngle = ((state.marioFinalSlot + 0.5) / NUM_PANELS) * Math.PI * 2 - Math.PI / 2;
  const marioR = BOSS_RADIUS + 3.5 * RING_WIDTH;
  const marioX = RING_CX + marioR * Math.cos(slotAngle);
  const marioY = RING_CY + marioR * Math.sin(slotAngle);
  const eased = t * t * (3 - 2 * t);
  const px = RING_CX + (marioX - RING_CX) * eased;
  const py = RING_CY + (marioY - RING_CY) * eased;

  // Rainbow glow
  const rrColors = ['#ff0000','#ff8800','#ffff00','#00ff00','#0088ff','#ff00ff'];
  const rrGrad = ctx.createRadialGradient(px, py, 0, px, py, 36);
  rrColors.forEach((c, i) => rrGrad.addColorStop(i / (rrColors.length - 1), c));

  ctx.save();
  ctx.fillStyle = rrGrad;
  ctx.beginPath();
  ctx.arc(px, py, 30 + 6 * Math.sin(tick * 0.03), 0, Math.PI * 2);
  ctx.fill();

  // White core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(px, py, 10, 0, Math.PI * 2);
  ctx.fill();

  // Rainbow trail
  for (let i = 1; i <= 4; i++) {
    const trailT = Math.max(0, eased - i * 0.06);
    const tx = RING_CX + (marioX - RING_CX) * trailT;
    const ty = RING_CY + (marioY - RING_CY) * trailT;
    ctx.globalAlpha = 0.25 / i;
    ctx.fillStyle = rrColors[i % rrColors.length];
    ctx.beginPath();
    ctx.arc(tx, ty, 22 - i * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Attack name
  ctx.save();
  ctx.textAlign = 'center';
  const rPulse = 0.8 + 0.2 * Math.sin(tick * 0.01);
  ctx.globalAlpha = rPulse;
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#ff4444';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.strokeText('RAINBOW ROLL ATTACK!', CANVAS_W / 2, 60);
  ctx.fillText('RAINBOW ROLL ATTACK!', CANVAS_W / 2, 60);
  ctx.globalAlpha = 1;

  const dmgPreview = state.pencilRainCount * 4;
  ctx.fillStyle = '#ff8800';
  ctx.font = 'bold 15px monospace';
  ctx.lineWidth = 0;
  ctx.fillText(`${state.pencilRainCount} pencils × 4 dmg = ${dmgPreview} (${Math.ceil(dmgPreview/2)} if blocked)`, CANVAS_W / 2, 82);
  ctx.restore();
}

function drawEnvelopeOverlay(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (!state.envelopeMessage || state.envelopeTimer <= 0) return;
  const alpha = Math.min(1, state.envelopeTimer / 500); // fade out last 500ms

  ctx.save();
  ctx.globalAlpha = alpha;

  // Envelope box - orange with dark border
  const boxW = 580, boxH = 100;
  const boxX = CANVAS_W / 2 - boxW / 2;
  const boxY = CANVAS_H - 160;

  ctx.fillStyle = '#aa4400';
  roundRect(ctx, boxX - 2, boxY - 2, boxW + 4, boxH + 4, 10);
  ctx.fill();

  ctx.fillStyle = '#ff8800';
  roundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();

  ctx.strokeStyle = '#ffcc44';
  ctx.lineWidth = 2;
  roundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.stroke();

  // Envelope icon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('✉', boxX + 14, boxY + 34);

  // Message text - wrap if needed
  ctx.font = '14px monospace';
  ctx.fillStyle = '#fff8e8';
  ctx.textAlign = 'left';
  // Simple word wrap
  const words = state.envelopeMessage.split(' ');
  let line = '';
  let lineY = boxY + 28;
  const maxW = boxW - 60;
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, boxX + 44, lineY);
      line = word;
      lineY += 20;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, boxX + 44, lineY);

  ctx.restore();
}

function drawSavePrompt(ctx: CanvasRenderingContext2D, state: GameState): void {
  // Full overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Panel
  const pw = 520, ph = 260;
  const px = CANVAS_W / 2 - pw / 2;
  const py = CANVAS_H / 2 - ph / 2;
  ctx.fillStyle = '#1a1a2e';
  roundRect(ctx, px, py, pw, ph, 14);
  ctx.fill();
  ctx.strokeStyle = '#ffdd44';
  ctx.lineWidth = 3;
  roundRect(ctx, px, py, pw, ph, 14);
  ctx.stroke();

  ctx.textAlign = 'center';

  // Boss defeated badge
  ctx.fillStyle = '#44ff88';
  ctx.font = 'bold 18px monospace';
  ctx.fillText(`BOSS ${state.bossIndex + 1} DEFEATED!`, CANVAS_W / 2, py + 44);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px monospace';
  ctx.fillText('Save and exit?', CANVAS_W / 2, py + 86);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '14px monospace';
  ctx.fillText('Your coins, accessories and progress will be saved.', CANVAS_W / 2, py + 114);
  ctx.fillText('Returning to title will continue from the next boss.', CANVAS_W / 2, py + 134);

  // Buttons
  const yesSel = state.saveCursor === 'yes';
  const noSel = state.saveCursor === 'no';

  // YES button
  const yBx = CANVAS_W / 2 - 220, yBy = py + 158, btnW = 180, btnH = 60;
  ctx.fillStyle = yesSel ? 'rgba(68,255,136,0.25)' : 'rgba(0,0,0,0.3)';
  roundRect(ctx, yBx, yBy, btnW, btnH, 8); ctx.fill();
  ctx.strokeStyle = yesSel ? '#44ff88' : '#555';
  ctx.lineWidth = yesSel ? 3 : 1;
  roundRect(ctx, yBx, yBy, btnW, btnH, 8); ctx.stroke();
  ctx.fillStyle = yesSel ? '#44ff88' : '#aaa';
  ctx.font = `bold ${yesSel ? 28 : 22}px monospace`;
  ctx.fillText(yesSel ? '▶ YES ◀' : 'YES', yBx + btnW / 2, yBy + 38);

  // NO button
  const nBx = CANVAS_W / 2 + 40;
  ctx.fillStyle = noSel ? 'rgba(255,100,100,0.25)' : 'rgba(0,0,0,0.3)';
  roundRect(ctx, nBx, yBy, btnW, btnH, 8); ctx.fill();
  ctx.strokeStyle = noSel ? '#ff6666' : '#555';
  ctx.lineWidth = noSel ? 3 : 1;
  roundRect(ctx, nBx, yBy, btnW, btnH, 8); ctx.stroke();
  ctx.fillStyle = noSel ? '#ff8888' : '#aaa';
  ctx.font = `bold ${noSel ? 28 : 22}px monospace`;
  ctx.fillText(noSel ? '▶ NO ◀' : 'NO', nBx + btnW / 2, yBy + 38);

  ctx.fillStyle = '#666';
  ctx.font = '13px monospace';
  ctx.fillText('← → navigate    ENTER / SPACE confirm', CANVAS_W / 2, py + ph - 16);

  ctx.restore();
}

export function drawTestingSelect(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = '#0a0a18';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 30px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TESTING MODE', CANVAS_W / 2, 100);
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText('Choose a boss to fight:', CANVAS_W / 2, 140);

  const bossNames = [
    '1 — Colored Pencils (150 HP)',
    '2 — Rubber Band (100 HP)',
    '3 — Hole Punch (150 HP)',
    '4 — Tape (180 HP)',
    '5 — Scissors (336 HP)',
    '6 — Stapler (350 HP)',
  ];

  bossNames.forEach((name, i) => {
    ctx.fillStyle = '#aaddff';
    ctx.font = '20px monospace';
    ctx.fillText(name, CANVAS_W / 2, 200 + i * 40);
  });

  ctx.fillStyle = '#888';
  ctx.font = '14px monospace';
  ctx.fillText('ESC — back to title', CANVAS_W / 2, CANVAS_H - 40);
  void state;
}

function drawSnapbackPhase(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const t = state.snapbackT;
  const marioTarget = panelCenter(state.marioFinalRing, state.marioFinalSlot);

  // Boss rushes from center toward Mario
  const eased = t * t * (3 - 2 * t);
  const bossX = RING_CX + (marioTarget.x - RING_CX) * eased * 0.7;
  const bossY = RING_CY + (marioTarget.y - RING_CY) * eased * 0.7;

  // Draw rubber band boss at rushing position
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = '#ff8800';
  ctx.beginPath();
  ctx.arc(bossX, bossY, 22 + 4 * Math.sin(tick * 0.04), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cc6600';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Wrap line (rubber band)
  ctx.strokeStyle = '#ffaa33';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(RING_CX, RING_CY);
  ctx.lineTo(bossX, bossY);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();

  // SNAPBACK label
  const blink = Math.floor(Date.now() / 300) % 2 === 0;
  if (blink) {
    ctx.save();
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff6600';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('SNAPBACK!', RING_CX, RING_CY - BOSS_RADIUS - 20);
    ctx.fillText('SNAPBACK!', RING_CX, RING_CY - BOSS_RADIUS - 20);
    ctx.restore();
  }

  void tick;
}

function drawRubberBindPhase(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const bandIndex = state.rubberBindBandIndex;
  const t = state.attackProjectileT;
  const inDelay = state.rubberBindDelayTimer > 0;

  const marioTarget = panelCenter(state.marioFinalRing, state.marioFinalSlot);

  // Flying rubber band (during travel phase)
  if (!inDelay && t > 0 && t < 1) {
    const eased = t * t * (3 - 2 * t);
    const px = RING_CX + (marioTarget.x - RING_CX) * eased;
    const py = RING_CY + (marioTarget.y - RING_CY) * eased;
    drawRubberBandProjectile(ctx, px, py, tick * 0.07);
  }

  // 3 band progress indicators
  for (let i = 0; i < 3; i++) {
    const ix = marioTarget.x + (i - 1) * 22;
    const iy = marioTarget.y - 30;
    ctx.save();
    if (i < bandIndex || (i === bandIndex && inDelay)) {
      ctx.fillStyle = state.marioTied ? '#cc4400' : '#44ff88';
      ctx.beginPath();
      ctx.arc(ix, iy, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (i === bandIndex && !inDelay) {
      ctx.strokeStyle = '#ffaa44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ix, iy, 7, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(ix, iy, 7, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  // TIED indicator near Mario
  if (state.marioTied) {
    ctx.save();
    ctx.fillStyle = '#cc4400';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 15px monospace';
    ctx.textAlign = 'center';
    ctx.strokeText('TIED!', marioTarget.x, marioTarget.y + 18);
    ctx.fillText('TIED!', marioTarget.x, marioTarget.y + 18);
    ctx.restore();
  }

  void tick;
}

function drawTrappedSnapback(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const TOTAL_MS = 3000;
  const INTRO_MS = 1500;
  const elapsed = TOTAL_MS - state.trappedSnapbackTimer;

  const marioPos = panelCenter(state.marioFinalRing, state.marioFinalSlot);

  if (elapsed < INTRO_MS) {
    // Tied up message
    const blink = Math.floor(Date.now() / 300) % 2 === 0;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 275, CANVAS_W, 130);
    ctx.fillStyle = blink ? '#cc4400' : '#ff8844';
    ctx.font = 'bold 26px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText("Tied up, can't move.", CANVAS_W / 2, 325);
    ctx.fillText("Tied up, can't move.", CANVAS_W / 2, 325);
    ctx.fillStyle = '#ffdd88';
    ctx.font = '14px monospace';
    ctx.fillText('Rubber Band winds up the snapback...', CANVAS_W / 2, 360);
    ctx.restore();

    // Draw rubber band lines around Mario
    ctx.save();
    ctx.strokeStyle = '#cc4400';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);
    const pulse = 0.8 + 0.2 * Math.sin(tick * 0.05);
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(marioPos.x, marioPos.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  } else {
    // Approach: stretch rubber band line from boss to Mario
    const approachT = (elapsed - INTRO_MS) / (TOTAL_MS - INTRO_MS);
    const eased = approachT * approachT;

    // Draw stretching rubber band
    ctx.save();
    ctx.strokeStyle = '#cc4400';
    ctx.lineWidth = Math.max(2, 6 * (1 - approachT));
    ctx.setLineDash([8, 4]);
    const lineStartX = RING_CX + (marioPos.x - RING_CX) * eased * 0.6;
    const lineStartY = RING_CY + (marioPos.y - RING_CY) * eased * 0.6;
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineStartY);
    ctx.lineTo(marioPos.x, marioPos.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Show attack text
    const blink2 = Math.floor(Date.now() / 180) % 2 === 0;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(100, 288, CANVAS_W - 200, 80);
    ctx.fillStyle = blink2 ? '#ff3300' : '#ff8844';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('TRAPPED SNAPBACK!', CANVAS_W / 2, 330);
    ctx.fillText('TRAPPED SNAPBACK!', CANVAS_W / 2, 330);
    const dmgLabels = ['20-25', '16-21', '14-19', '12-17'];
    ctx.fillStyle = '#ffdd88';
    ctx.font = '13px monospace';
    ctx.fillText(`Ring ${state.marioFinalRing + 1}: ${dmgLabels[state.marioFinalRing]} incoming!`, CANVAS_W / 2, 357);
    ctx.restore();
  }

  void tick;
}

function drawBumperBands(ctx: CanvasRenderingContext2D, state: GameState): void {
  // progress 0=start, 1=done (pullbackTimer counts down from 2500)
  const totalDur = 2500;
  const progress = 1 - state.pullbackTimer / totalDur;

  // Draw each rubber band flying from boss center to its target panel position
  const bands = state.rubberBands;
  if (bands.length === 0) return;

  for (let i = 0; i < bands.length; i++) {
    // Stagger: band i starts at i/bands.length * 0.5 into the animation
    const staggerStart = (i / bands.length) * 0.5;
    const localT = Math.max(0, Math.min(1, (progress - staggerStart) / 0.6));

    if (localT <= 0) continue;

    const target = panelCenter(bands[i].ring, bands[i].slot);

    // Ease out cubic
    const eased = 1 - Math.pow(1 - localT, 3);

    const x = RING_CX + (target.x - RING_CX) * eased;
    const y = RING_CY + (target.y - RING_CY) * eased;

    // Draw a rubber band circle (orange ring)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = '#cc4400';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 1.5);
    ctx.strokeStyle = '#ff8844';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Text overlay
  const blink = Math.floor(Date.now() / 300) % 2 === 0;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(150, 290, CANVAS_W - 300, 100);
  ctx.fillStyle = blink ? '#ff6600' : '#ffaa44';
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BUMPER BANDS!', CANVAS_W / 2, 335);
  ctx.fillStyle = '#ffdd88';
  ctx.font = '13px monospace';
  ctx.fillText('Rubber Band is launching bands onto the rings!', CANVAS_W / 2, 360);
  ctx.restore();
}

function drawSoloPhase(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const phase = state.phase;

  // Full dark background
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const bCX = CANVAS_W / 2;
  const bCY = CANVAS_H / 2 - 40;

  // Draw the solo rubber band (large) at center
  if (phase === 'solo_slingshot' && state.soloSlingshotLaunched) {
    // Launch animation — band flies off toward upper-right
    const t = state.soloSlingshotT;
    const eased = t * t;
    const launchX = bCX + eased * 800;
    const launchY = bCY - eased * 600;
    const scale = 1 - t * 0.7;
    ctx.save();
    ctx.translate(launchX, launchY);
    ctx.scale(scale, scale);
    drawBoss1Solo(ctx, 0, 0, 90, tick);
    ctx.restore();

    // Speed lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255,150,50,0.6)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const sx = bCX + (Math.random() - 0.5) * 200;
      const sy = bCY + (Math.random() - 0.5) * 150;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(launchX, launchY);
      ctx.stroke();
    }
    ctx.restore();

    // "LAUNCHED!" text
    const alpha = 1 - t;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ffdd00';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText('LAUNCHED!', bCX, bCY - 130);
    ctx.fillText('LAUNCHED!', bCX, bCY - 130);
    ctx.restore();
  } else if (phase === 'solo_grab_attempt') {
    // Band oscillates or stays at pause position
    const bandOffsetX = state.soloGrabBandPos * 35;
    drawBoss1Solo(ctx, bCX + bandOffsetX, bCY, 90, tick);

    // Player 1000-fold arms cursor
    const cursorOffsetX = state.soloGrabHandsCursor * 35;
    const handX = bCX + cursorOffsetX;
    const handY = bCY + 60; // just below the band
    const footX = bCX;
    const footY = CANVAS_H - 20;
    const paused = state.soloGrabSubPhase === 'paused_left' || state.soloGrabSubPhase === 'paused_right';
    const targetPos = state.soloGrabSubPhase === 'paused_left' ? -3 : 3;
    const aligned = paused && Math.abs(state.soloGrabHandsCursor - targetPos) <= 1;
    const armPulse = 0.85 + 0.15 * Math.sin(tick * 0.015);
    const armColor = aligned ? `rgba(100,255,120,${armPulse})` : '#cc2222';

    ctx.save();
    // Left arm
    ctx.strokeStyle = armColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(footX - 25, footY);
    ctx.bezierCurveTo(footX - 40, footY - 120, handX - 50, handY + 80, handX - 20, handY);
    ctx.stroke();
    // Right arm
    ctx.beginPath();
    ctx.moveTo(footX + 25, footY);
    ctx.bezierCurveTo(footX + 40, footY - 120, handX + 50, handY + 80, handX + 20, handY);
    ctx.stroke();
    // Left glove
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(handX - 20, handY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 2;
    ctx.stroke();
    // Right glove
    ctx.beginPath();
    ctx.arc(handX + 20, handY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Aligned / grip prompt
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (paused) {
      if (aligned) {
        const blink = Math.floor(Date.now() / 250) % 2 === 0;
        if (blink) {
          ctx.fillStyle = '#44ff88';
          ctx.font = 'bold 20px monospace';
          ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
          ctx.strokeText('PRESS SPACE!', handX, handY - 40);
          ctx.fillText('PRESS SPACE!', handX, handY - 40);
        }
      } else {
        ctx.fillStyle = '#ffdd44';
        ctx.font = 'bold 14px monospace';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
        const arrow = state.soloGrabSubPhase === 'paused_left' ? '← move left!' : '→ move right!';
        ctx.strokeText(arrow, bandOffsetX + bCX, bCY - 148);
        ctx.fillText(arrow, bandOffsetX + bCX, bCY - 148);
      }
    }
    ctx.restore();
  } else if (phase === 'solo_snapback_attack') {
    const t = state.soloSnapbackAttackT;
    const marioSlotAngle = ((state.marioFinalSlot + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
    const marioR = BOSS_RADIUS + 3.5 * RING_WIDTH;
    const marioX = RING_CX + marioR * Math.cos(marioSlotAngle);
    const marioY = RING_CY + marioR * Math.sin(marioSlotAngle);

    const eased = t * t * (3 - 2 * t);
    const attackBX = bCX + (marioX - bCX) * eased * 0.8;
    const attackBY = bCY + (marioY - bCY) * eased * 0.8;

    // Speed trail
    ctx.save();
    for (let i = 3; i >= 1; i--) {
      const trailT = Math.max(0, eased - i * 0.07);
      const tx = bCX + (marioX - bCX) * trailT * 0.8;
      const ty = bCY + (marioY - bCY) * trailT * 0.8;
      ctx.globalAlpha = 0.2 / i;
      drawBoss1Solo(ctx, tx, ty, 80 - i * 8, tick);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    drawBoss1Solo(ctx, attackBX, attackBY, 90, tick);

    // Mario token at final position
    const mFinalPos = panelCenter(state.marioFinalRing, state.marioFinalSlot);
    const mOff_x = mFinalPos.x - RING_CX + bCX;
    const mOff_y = mFinalPos.y - RING_CY + bCY;
    drawMarioSprite(ctx, mOff_x, mOff_y);
  } else if (phase === 'solo_slingshot') {
    // Band stretching back
    const pull = state.soloPullT;
    const stretchX = bCX - pull * 80;
    const stretchY = bCY + pull * 40;
    drawBoss1Solo(ctx, stretchX, stretchY, 90 * (1 + pull * 0.3), tick);

    // Slingshot lines
    if (pull > 0.05) {
      ctx.save();
      ctx.strokeStyle = `rgba(255,180,50,${0.4 + pull * 0.5})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(bCX, bCY - 150);
      ctx.lineTo(stretchX, stretchY);
      ctx.moveTo(bCX, bCY + 150);
      ctx.lineTo(stretchX, stretchY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Pull power bar
    const barX = CANVAS_W / 2 - 140;
    const barY = CANVAS_H - 100;
    const barW = 280;
    const barH = 22;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX - 4, barY - 4, barW + 8, barH + 8);
    ctx.fillStyle = pull > 0.8 ? '#ffdd00' : '#ff8800';
    ctx.fillRect(barX, barY, barW * pull, barH);
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`PULL: ${Math.round(pull * 100)}%`, CANVAS_W / 2, barY - 8);

    if (!state.soloPullHeld && pull < 0.1) {
      const blink = Math.floor(Date.now() / 400) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#ffdd44';
        ctx.font = 'bold 26px monospace';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText('Hold ↓ to charge slingshot!', CANVAS_W / 2, CANVAS_H - 118);
        ctx.fillText('Hold ↓ to charge slingshot!', CANVAS_W / 2, CANVAS_H - 118);
      }
    } else if (state.soloPullHeld) {
      ctx.fillStyle = '#ffaa44';
      ctx.font = 'bold 22px monospace';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeText('Release ↓ to LAUNCH!', CANVAS_W / 2, CANVAS_H - 118);
      ctx.fillText('Release ↓ to LAUNCH!', CANVAS_W / 2, CANVAS_H - 118);
    }
  } else {
    // solo_snapback_charge and solo_slam: draw band at center
    if (phase === 'solo_slam') {
      // Shake boss based on slam count
      const shakeX = state.soloSlamCount > 0 ? (Math.random() - 0.5) * 6 : 0;
      const shakeY = state.soloSlamCount > 0 ? (Math.random() - 0.5) * 6 : 0;
      drawBoss1Solo(ctx, bCX + shakeX, bCY + shakeY, 90, tick);
    } else {
      drawBoss1Solo(ctx, bCX, bCY, 90, tick);
    }
  }

  // Attack name header
  ctx.save();
  ctx.textAlign = 'center';
  const phaseTitle: Record<string, string> = {
    solo_snapback_charge: 'SOLO SNAPBACK',
    solo_grab_attempt: 'GRAB THE BAND!',
    solo_snapback_attack: 'SOLO SNAPBACK!',
    solo_slam: 'SOLO SLAM!',
    solo_slingshot: 'SLINGSHOT!',
  };
  const titleColor: Record<string, string> = {
    solo_snapback_charge: '#ff6600',
    solo_grab_attempt: '#44ff88',
    solo_snapback_attack: '#ff2200',
    solo_slam: '#ff8800',
    solo_slingshot: '#ffdd00',
  };
  ctx.fillStyle = titleColor[phase] ?? '#ffffff';
  ctx.font = 'bold 36px monospace';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 6;
  ctx.strokeText(phaseTitle[phase] ?? '', CANVAS_W / 2, 50);
  ctx.fillText(phaseTitle[phase] ?? '', CANVAS_W / 2, 50);

  // Phase-specific overlays
  if (phase === 'solo_snapback_charge') {
    const frac = state.soloSnapbackChargeTimer / 3000;
    const blink = Math.floor(Date.now() / 200) % 2 === 0;
    const pulse = 0.6 + 0.4 * Math.sin(tick * 0.015);

    // Charge bar
    const barX = CANVAS_W / 2 - 160;
    const barY = CANVAS_H - 100;
    ctx.fillStyle = '#222';
    ctx.fillRect(barX - 4, barY - 4, 328, 28);
    const barColor = frac > 0.5 ? '#ff6600' : frac > 0.25 ? '#ff4400' : '#ff2200';
    ctx.fillStyle = barColor;
    ctx.fillRect(barX, barY, 320 * frac, 20);
    ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, 320, 20);

    if (blink) {
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#ff4400';
      ctx.font = 'bold 22px monospace';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText('GET READY TO GRAB!', CANVAS_W / 2, bCY + 140);
      ctx.fillText('GET READY TO GRAB!', CANVAS_W / 2, bCY + 140);
      ctx.globalAlpha = 1;
    }
    // Warning banner: SOLO SNAPBACK CHARGING...
    const bannerPulse = 0.55 + 0.45 * Math.sin(tick * 0.012);
    const bannerW = 420;
    const bannerH = 44;
    const bannerX = CANVAS_W / 2 - bannerW / 2;
    const bannerY = bCY + 130;
    ctx.save();
    ctx.globalAlpha = bannerPulse;
    ctx.fillStyle = '#cc3300';
    ctx.strokeStyle = '#ff6600';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText('SOLO SNAPBACK CHARGING...', CANVAS_W / 2, bannerY + 29);
    ctx.fillText('SOLO SNAPBACK CHARGING...', CANVAS_W / 2, bannerY + 29);
    ctx.restore();
  }

  if (phase === 'solo_grab_attempt') {
    // Oscillation indicator (only during moving)
    if (state.soloGrabSubPhase === 'moving') {
      const progress = state.soloGrabTimer / 3000;
      const barX = CANVAS_W / 2 - 120;
      const barY = CANVAS_H - 80;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, 240, 16);
      ctx.fillStyle = '#66aaff';
      ctx.fillRect(barX, barY, 240 * progress, 16);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, 240, 16);
      ctx.fillStyle = '#aaa';
      ctx.font = '11px monospace';
      ctx.lineWidth = 0;
      ctx.fillText('Oscillating...', CANVAS_W / 2, barY - 6);
    } else {
      // Pause window timer
      const winFrac = state.soloGrabPauseTimer / 1000;
      const barX = CANVAS_W / 2 - 120;
      const barY = CANVAS_H - 80;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, 240, 16);
      ctx.fillStyle = winFrac > 0.4 ? '#44ff88' : '#ffaa00';
      ctx.fillRect(barX, barY, 240 * winFrac, 16);
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, 240, 16);
      ctx.fillStyle = '#ffdd44';
      ctx.font = 'bold 12px monospace';
      ctx.lineWidth = 0;
      ctx.fillText('GRIP WINDOW!', CANVAS_W / 2, barY - 6);
    }
  }

  if (phase === 'solo_slam') {
    const frac = state.soloSlamTimer / 5000;
    // Countdown bar
    const barX = CANVAS_W / 2 - 150;
    const barY = CANVAS_H - 90;
    ctx.fillStyle = '#222';
    ctx.fillRect(barX - 4, barY - 4, 308, 24);
    const barColor2 = frac > 0.5 ? '#44cc22' : frac > 0.25 ? '#ddaa00' : '#cc2222';
    ctx.fillStyle = barColor2;
    ctx.fillRect(barX, barY, 300 * frac, 16);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, 300, 16);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.lineWidth = 0;
    ctx.fillText(`${(state.soloSlamTimer / 1000).toFixed(1)}s  |  Slams: ${state.soloSlamCount}`, CANVAS_W / 2, barY - 8);

    if (state.soloSlamCooldown <= 0) {
      const blink = Math.floor(Date.now() / 200) % 2 === 0;
      if (blink) {
        ctx.fillStyle = '#ffdd00';
        ctx.font = 'bold 30px monospace';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
        ctx.strokeText('MASH SPACE!!!', CANVAS_W / 2, bCY + 150);
        ctx.fillText('MASH SPACE!!!', CANVAS_W / 2, bCY + 150);
      }
    } else {
      ctx.fillStyle = '#ff8800';
      ctx.font = 'bold 18px monospace';
      ctx.lineWidth = 0;
      ctx.fillText('COOLDOWN...', CANVAS_W / 2, bCY + 150);
    }
  }

  if (phase === 'solo_snapback_attack') {
    // Block timing bar
    const BLOCK_START = 0.35;
    const BLOCK_END = 0.72;
    const barX = 200, barY = 640, barW = 500, barH = 20;
    ctx.fillStyle = '#333333';
    roundRect(ctx, barX, barY, barW, barH, 5);
    ctx.fill();
    ctx.fillStyle = '#666';
    ctx.fillRect(barX + 1, barY + 1, (barW - 2) * state.soloSnapbackAttackT, barH - 2);
    const winStart = barX + barW * BLOCK_START;
    const winEnd = barX + barW * BLOCK_END;
    const pulse2 = 0.6 + 0.4 * Math.sin(tick * 0.01);
    ctx.fillStyle = `rgba(0,255,100,${pulse2})`;
    ctx.fillRect(winStart, barY + 1, winEnd - winStart, barH - 2);
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);

    if (state.blockWindowOpen && !state.playerBlocked) {
      const flash = 0.5 + 0.5 * Math.sin(tick * 0.025);
      ctx.globalAlpha = flash;
      ctx.fillStyle = '#00ff88';
      ctx.font = 'bold 28px monospace';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
      ctx.strokeText('PRESS SPACE TO BLOCK!', CANVAS_W / 2, 600);
      ctx.fillText('PRESS SPACE TO BLOCK!', CANVAS_W / 2, 600);
      ctx.globalAlpha = 1;
    }
    if (state.playerBlocked) {
      ctx.fillStyle = '#44ffaa';
      ctx.font = 'bold 32px monospace';
      ctx.lineWidth = 0;
      ctx.fillText('BLOCKED!', CANVAS_W / 2, 590);
    }

    // Damage preview
    const dmgRanges = ['56-61', '53-58', '50-55', '45-50'];
    ctx.fillStyle = '#ff8800';
    ctx.font = '14px monospace';
    ctx.lineWidth = 0;
    ctx.fillText(`Ring ${state.marioFinalRing + 1}: ${dmgRanges[state.marioFinalRing]} damage (half if blocked)`, CANVAS_W / 2, 80);
  }

  ctx.restore();

  // Bottom hint
  const hint = getPhaseHint(state);
  if (hint) {
    ctx.save();
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 620, CANVAS_W, 60);
    ctx.fillStyle = '#88aacc';
    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(hint, CANVAS_W / 2, 655);
    ctx.restore();
  }

  void tick;
}

function drawPullback(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const totalDur = 1200;
  // progress 0=start, 1=done
  const progress = 1 - state.pullbackTimer / totalDur;

  // Animate each rubber band flying from its panel back to the boss center
  const bands = state.rubberBands;
  for (let i = 0; i < bands.length; i++) {
    const staggerStart = (i / Math.max(bands.length, 1)) * 0.4;
    const localT = Math.max(0, Math.min(1, (progress - staggerStart) / 0.65));
    if (localT <= 0) continue;
    const eased = 1 - Math.pow(1 - localT, 3);
    const src = panelCenter(bands[i].ring, bands[i].slot);
    const x = src.x + (RING_CX - src.x) * eased;
    const y = src.y + (RING_CY - src.y) * eased;
    drawRubberBandProjectile(ctx, x, y, tick * 0.04 + i);
  }

  // HP restored indicator: show heart with blue number (appears after progress > 0.5)
  if (progress > 0.5) {
    const healedHp = state.rubberBandCount * state.rubberBandHpPerBand;
    const heartAlpha = Math.min(1, (progress - 0.5) * 4);
    ctx.save();
    ctx.globalAlpha = heartAlpha;
    // Heart shape at boss center
    const hx = RING_CX;
    const hy = RING_CY - BOSS_RADIUS - 30;
    ctx.fillStyle = '#ff4466';
    ctx.beginPath();
    ctx.moveTo(hx, hy + 8);
    ctx.bezierCurveTo(hx, hy, hx - 16, hy, hx - 16, hy + 8);
    ctx.bezierCurveTo(hx - 16, hy + 20, hx, hy + 28, hx, hy + 36);
    ctx.bezierCurveTo(hx, hy + 28, hx + 16, hy + 20, hx + 16, hy + 8);
    ctx.bezierCurveTo(hx + 16, hy, hx, hy, hx, hy + 8);
    ctx.fill();
    ctx.strokeStyle = '#880022';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // HP number in blue inside heart
    ctx.fillStyle = '#44aaff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`+${healedHp}`, hx, hy + 24);
    ctx.restore();
  }

  // Text overlay
  const blink = Math.floor(Date.now() / 250) % 2 === 0;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(160, 295, CANVAS_W - 320, 90);
  ctx.fillStyle = blink ? '#ff8800' : '#ffaa44';
  ctx.font = 'bold 30px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PULLBACK!', CANVAS_W / 2, 345);
  ctx.fillStyle = '#ffdd88';
  ctx.font = '14px monospace';
  ctx.fillText('Rubber bands return...', CANVAS_W / 2, 372);
  ctx.restore();
  void tick;
}

function drawMainSqueezePhase(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const totalTime = 2500;
  const elapsed = totalTime - state.mainSqueezeTimer;
  const frac = Math.min(1, elapsed / totalTime);

  // Growing boss circle approaching Mario
  const bossStartR = BOSS_RADIUS * 0.5;
  const bossEndR = BOSS_RADIUS * 1.4;
  const bossR = bossStartR + (bossEndR - bossStartR) * frac;
  const approachX = RING_CX + (1 - frac) * 0;
  const approachY = RING_CY - (1 - frac) * 30;

  ctx.save();
  ctx.globalAlpha = 0.55 + 0.35 * frac;
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(approachX, approachY, bossR * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Label banner
  const pulse = 0.8 + 0.2 * Math.sin(tick * 0.02);
  ctx.globalAlpha = pulse;
  const bw = 360, bh = 55;
  const bx = CANVAS_W / 2 - bw / 2;
  const by = RING_CY - bh - BOSS_RADIUS - 10;
  ctx.fillStyle = '#cc3300';
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffdd44';
  ctx.font = 'bold 26px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText('MAIN SQUEEZE!', CANVAS_W / 2, by + 36);
  ctx.fillText('MAIN SQUEEZE!', CANVAS_W / 2, by + 36);
  ctx.restore();
  void tick;
}

function drawGettinDownPhase(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const totalTime = 2000;
  const elapsed = totalTime - state.gettinDownTimer;
  const frac = Math.min(1, elapsed / totalTime);

  ctx.save();
  // Animated "music notes" visual
  const pulse = 0.8 + 0.2 * Math.sin(tick * 0.025);
  ctx.globalAlpha = pulse;
  const bw = 380, bh = 55;
  const bx = CANVAS_W / 2 - bw / 2;
  const by = RING_CY - bh - BOSS_RADIUS - 10;
  ctx.fillStyle = '#442200';
  ctx.strokeStyle = '#ffaa00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffcc44';
  ctx.font = "bold 26px monospace";
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText("GETTIN' DOWN!", CANVAS_W / 2, by + 36);
  ctx.fillText("GETTIN' DOWN!", CANVAS_W / 2, by + 36);

  // Progress bar
  const barW = 300, barH = 14;
  const barX = CANVAS_W / 2 - barW / 2;
  const barY = by + bh + 10;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#ff8800';
  ctx.fillRect(barX, barY, barW * frac, barH);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.restore();
  void tick;
}

function drawHolePunchInnerPhase(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const totalTime = 3000;
  const elapsed = totalTime - state.holePunchInnerTimer;
  const frac = Math.min(1, elapsed / totalTime);

  ctx.save();
  const pulse = 0.75 + 0.25 * Math.sin(tick * 0.02);
  ctx.globalAlpha = pulse;
  const bw = 460, bh = 55;
  const bx = CANVAS_W / 2 - bw / 2;
  const by = RING_CY - bh - BOSS_RADIUS - 10;
  ctx.fillStyle = '#222';
  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  ctx.strokeText('HOLE PUNCH + BASE SLAP!', CANVAS_W / 2, by + 35);
  ctx.fillText('HOLE PUNCH + BASE SLAP!', CANVAS_W / 2, by + 35);

  // Progress bar
  const barW = 340, barH = 14;
  const barX = CANVAS_W / 2 - barW / 2;
  const barY = by + bh + 10;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(barX, barY, barW * frac, barH);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);
  ctx.restore();
  void tick;
}

function drawThrowingPunchesPhase(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const isBoardPunch = state.throwingPunchesIdx < state.throwingPunchesBoardCount;
  const frac = state.throwingPunchesDelayTimer > 0 ? 0 : state.attackProjectileT;

  // Title banner
  ctx.save();
  const bw = 460, bh = 55;
  const bx = CANVAS_W / 2 - bw / 2;
  const by = RING_CY - bh - BOSS_RADIUS - 10;
  ctx.fillStyle = '#222';
  ctx.strokeStyle = isBoardPunch ? '#ff8800' : '#ff4444';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = isBoardPunch ? '#ffaa44' : '#ff8888';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 5;
  const label = isBoardPunch ? 'THROWING PUNCHES (BOARD)' : 'THROWING PUNCHES (MARIO)';
  ctx.strokeText(label, CANVAS_W / 2, by + 35);
  ctx.fillText(label, CANVAS_W / 2, by + 35);

  // Counter
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`Punch ${state.throwingPunchesIdx + 1} / ${state.throwingPunchesTotal}`, CANVAS_W / 2, by - 12);

  // Projectile fist flying from boss to Mario
  if (frac > 0 && frac < 1) {
    const { x: mx, y: my } = marioScreenPosForState(state);
    const startX = RING_CX;
    const startY = RING_CY;
    const px = startX + (mx - startX) * frac;
    const py = startY + (my - startY) * frac + Math.sin(frac * Math.PI) * -30;

    ctx.save();
    ctx.shadowColor = isBoardPunch ? '#ff8800' : '#ff4444';
    ctx.shadowBlur = 14;
    ctx.fillStyle = isBoardPunch ? '#ff8800' : '#cc2222';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Fist symbol
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✊', px, py);
    ctx.restore();
  }

  ctx.restore();
  void tick;
}

function marioScreenPosForState(state: GameState): { x: number; y: number } {
  // Same logic as game.ts marioScreenPos — ring slot to canvas position
  const ring = state.marioFinalRing;
  const slot = state.marioFinalSlot;
  const r = BOSS_RADIUS + RING_WIDTH * (ring + 0.5);
  const angle = (slot / 12) * Math.PI * 2 - Math.PI / 2;
  return { x: RING_CX + Math.cos(angle) * r, y: RING_CY + Math.sin(angle) * r };
}

function drawWholePunchCharge(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const pulse = 0.7 + 0.3 * Math.sin(tick * 0.04);
  ctx.save();
  ctx.globalAlpha = pulse;
  const bw = 520, bh = 60;
  const bx = CANVAS_W / 2 - bw / 2, by = RING_CY - bh / 2 - 60;
  ctx.fillStyle = '#880000';
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
  ctx.strokeText('⚠ THE WHOLE PUNCH CHARGING! Use Earth Vellumental! ⚠', CANVAS_W / 2, by + 38);
  ctx.fillText('⚠ THE WHOLE PUNCH CHARGING! Use Earth Vellumental! ⚠', CANVAS_W / 2, by + 38);
  ctx.restore();
  void state; void tick;
}

function drawWholePunchAttempt(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  const elapsed = 2000 - state.wholePunchAttemptTimer;
  const frac = Math.min(1, elapsed / 2000);
  ctx.save();
  const bw = 460, bh = 55;
  const bx = CANVAS_W / 2 - bw / 2, by = RING_CY - bh - BOSS_RADIUS - 10;
  ctx.fillStyle = '#550000';
  ctx.strokeStyle = '#ff2222';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ff6666';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000'; ctx.lineWidth = 5;
  const label = state.marioElevated ? 'THE WHOLE PUNCH! (ELEVATED — Hole Punch will bonk!)' : 'THE WHOLE PUNCH!';
  ctx.strokeText(label, CANVAS_W / 2, by + 36);
  ctx.fillText(label, CANVAS_W / 2, by + 36);
  // Progress bar
  const barW = 340, barH = 12;
  const barX = CANVAS_W / 2 - barW / 2, barY = by + bh + 8;
  ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#ff2222'; ctx.fillRect(barX, barY, barW * frac, barH);
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY, barW, barH);
  ctx.restore();
  void tick;
}

function drawWholePunchArms(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  ctx.save();

  // Flipped Hole Punch boss (gray/dark rounded rectangle flipped over)
  const bx = RING_CX, by = RING_CY - BOSS_RADIUS - 20;
  ctx.fillStyle = '#555555';
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 4;
  // Flipped body (upside-down)
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(Math.PI); // flipped
  ctx.beginPath();
  ctx.roundRect(-55, -25, 110, 50, 12);
  ctx.fill(); ctx.stroke();
  // Handle (lever)
  ctx.fillStyle = '#888888';
  ctx.beginPath();
  ctx.rect(-8, -48, 16, 26);
  ctx.fill(); ctx.stroke();
  ctx.restore();

  // Banner
  const bw = 460, bh = 50;
  const bannerX = CANVAS_W / 2 - bw / 2, bannerY = RING_CY - bh - BOSS_RADIUS - 10;
  ctx.fillStyle = '#222';
  ctx.strokeStyle = '#44ff44';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.roundRect(bannerX, bannerY, bw, bh, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#44ff88';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
  const msg = state.wholePunchPulling
    ? `RIPPING! ← ← ←  ${Math.round(state.wholePunchPullT * 100)}%`
    : state.wholePunchArmsPos === 3 ? 'PRESS SPACE to grip lid corner!' : 'Move hands to RIGHT CORNER with ←/→';
  ctx.strokeText(msg, CANVAS_W / 2, bannerY + 33);
  ctx.fillText(msg, CANVAS_W / 2, bannerY + 33);

  // Arms cursor — red bezier arms
  const footX = CANVAS_W / 2, footY = RING_CY + BOSS_RADIUS + 20;
  const cursorOff = state.wholePunchArmsPos * 50;
  const targetX = RING_CX + cursorOff;
  const isAligned = state.wholePunchArmsPos === 3;
  const armColor = state.wholePunchPulling ? '#44ff88' : isAligned ? '#ffdd00' : '#cc2222';
  for (const side of [-1, 1]) {
    const handX = targetX + side * 30;
    const handY = by - 15;
    ctx.beginPath();
    ctx.moveTo(footX + side * 40, footY);
    ctx.bezierCurveTo(footX + side * 80, footY - 80, handX + side * 30, handY + 60, handX, handY);
    ctx.strokeStyle = armColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(handX, handY, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = armColor;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Pull progress bar
  if (state.wholePunchPulling) {
    const barW = 300, barH = 18;
    const barX = CANVAS_W / 2 - barW / 2, barY2 = bannerY + bh + 8;
    ctx.fillStyle = '#333'; ctx.fillRect(barX, barY2, barW, barH);
    ctx.fillStyle = '#44ff44'; ctx.fillRect(barX, barY2, barW * state.wholePunchPullT, barH);
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.strokeRect(barX, barY2, barW, barH);
  }

  // Position indicator
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`Position: ${state.wholePunchArmsPos} / 3`, CANVAS_W / 2, bannerY - 12);

  ctx.restore();
  void tick;
}

function drawEnemyTurnAnnounce(ctx: CanvasRenderingContext2D, state: GameState, tick: number): void {
  // Show for first 2000ms, then fade for 1000ms
  const elapsed = 3000 - state.enemyTurnAnnounceTimer;
  if (elapsed > 2000) return; // sign has disappeared, just waiting

  const alpha = elapsed < 1800 ? 1 : 1 - (elapsed - 1800) / 200;
  ctx.save();
  ctx.globalAlpha = alpha;

  // Purple banner
  const bw = 420, bh = 90;
  const bx = CANVAS_W / 2 - bw / 2;
  const by = CANVAS_H / 2 - bh / 2 - 20;
  ctx.fillStyle = '#550088';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#cc44ff';
  ctx.lineWidth = 4;
  ctx.strokeRect(bx, by, bw, bh);

  const pulse = 0.85 + 0.15 * Math.sin(tick * 0.02);
  ctx.globalAlpha = alpha * pulse;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 44px monospace';
  ctx.fillStyle = '#ee88ff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 5;
  ctx.strokeText("ENEMY'S TURN", CANVAS_W / 2, by + bh / 2);
  ctx.fillText("ENEMY'S TURN", CANVAS_W / 2, by + bh / 2);

  ctx.restore();
  void state; void tick;
}

// Main render function
export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  tick: number
): void {
  ctx.fillStyle = '#111122';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  switch (state.phase) {
    case 'title':
      drawTitleScreen(ctx, state.titleRingAngle);
      return;
    case 'main_menu':
      drawMainMenu(ctx, state);
      return;
    case 'how_to_play':
      drawHowToPlay(ctx, state);
      return;
    case 'shop':
      drawShop(ctx, state);
      return;
    case 'testing_select':
      drawTestingSelect(ctx, state);
      return;
    case 'boss_intro':
      drawBossIntro(ctx, state, tick);
      return;
    case 'victory':
      drawVictoryScreen(ctx, state.confettiParticles);
      return;
    case 'game_over':
      drawGameOver(ctx);
      return;
    case 'save_prompt':
      // Draw whatever was showing before, then overlay
      break;
    case 'pencil_grab':
      // Full replacement screen (no rings shown)
      drawPencilGrab(ctx, state, tick);
      drawDamageNumbers(ctx, state.damageNumbers);
      return;
    case 'arms_grab':
      drawArmsGrab(ctx, state, tick);
      drawDamageNumbers(ctx, state.damageNumbers);
      return;
    case 'solo_snapback_charge':
    case 'solo_grab_attempt':
    case 'solo_snapback_attack':
    case 'solo_slam':
    case 'solo_slingshot':
      drawSoloPhase(ctx, state, tick);
      drawDamageNumbers(ctx, state.damageNumbers);
      drawPauseButton(ctx, state, tick);
      if (state.paused) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.72)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 6;
        ctx.strokeText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 20);
        ctx.font = '18px monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.lineWidth = 0;
        ctx.fillText('Press P to resume', CANVAS_W / 2, CANVAS_H / 2 + 30);
        ctx.restore();
      }
      return;
    case 'enemy_turn_announce':
    case 'hole_punch_attack':
    case 'main_squeeze':
    case 'gettin_down':
    case 'hole_punch_inner':
    case 'throwing_punches':
    case 'whole_punch_charge':
    case 'whole_punch_attempt':
    case 'whole_punch_arms':
    case 'rainbow_smash':
    case 'rainbow_roll_attack':
    case 'pullback':
    case 'bumper_bands':
    case 'rubber_bind':
    case 'snapback':
    case 'trapped_snapback':
      // Fall through to main game view, then overlay
      break;
  }

  // Main game view
  drawTopBar(ctx, state);
  drawLeftSidebar(ctx, state);
  drawRightSidebar(ctx, state, tick);

  // Compute path preview during puzzle phase
  const walkPath: PathStep[] =
    state.phase === 'puzzle'
      ? simulatePath(state.rings, 3, state.marioSlot, state.magicCircleActive)
      : state.phase === 'mario_walk'
      ? state.marioWalkPath
      : [];

  drawRings(
    ctx,
    state,
    state.rotationAnim,
    tick,
    walkPath
  );
  drawBossCircle(ctx, state, tick);

  // Mario token: static during puzzle, animated during mario_walk
  if (state.phase === 'mario_walk') {
    drawMarioWalkToken(ctx, state);
  } else if (state.phase === 'mario_jump') {
    // drawn by drawJumpAnimation below
  } else if (state.phase === 'mario_mash') {
    // drawn by drawMashPhase below
  } else if (state.phase === 'mario_hammer') {
    // drawn by drawHammerGauge
  } else if (state.phase === 'pencil_rain' || state.phase === 'snap_shut' || state.phase === 'pencil_cutscene') {
    // Mario stays at his final walk position
    const marioFinalPos = panelCenter(state.marioFinalRing, state.marioFinalSlot);
    drawMarioSprite(ctx, marioFinalPos.x, marioFinalPos.y);
  } else if (state.phase === 'rainbow_smash' || state.phase === 'rainbow_roll_attack' || state.phase === 'pullback' || state.phase === 'bumper_bands' || state.phase === 'boss_attack' || state.phase === 'attack_choice' || state.phase === 'rubber_bind' || state.phase === 'snapback' || state.phase === 'trapped_snapback') {
    const marioFinalPos = panelCenter(state.marioFinalRing, state.marioFinalSlot);
    drawMarioSprite(ctx, marioFinalPos.x, marioFinalPos.y);
  } else {
    drawMarioToken(ctx, tick);
  }

  // Magic circle active indicator
  if (state.magicCircleActive && (state.phase === 'puzzle' || state.phase === 'primary_target')) {
    ctx.save();
    const pulse = 0.7 + 0.3 * Math.sin(tick * 0.01);
    ctx.globalAlpha = pulse;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 14px monospace';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeText('★ MAGIC CIRCLE ACTIVE — reach it to activate 1000-fold arms!', CANVAS_W / 2, 60);
    ctx.fillText('★ MAGIC CIRCLE ACTIVE — reach it to activate 1000-fold arms!', CANVAS_W / 2, 60);
    ctx.restore();
  }

  // Rainbow Roll warning overlay during puzzle phase
  if (state.bossIndex === 0 && state.rainbowRollReady && state.phase === 'puzzle') {
    ctx.save();
    const pulse = 0.6 + 0.4 * Math.sin(tick * 0.012);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff8800';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    const rrMsg = state.magicCircleActive
      ? '⚠ RAINBOW ROLL CHARGING — magic circle is ready!'
      : '⚠ RAINBOW ROLL CHARGING — hit ON panel, then magic circle!';
    ctx.strokeText(rrMsg, CANVAS_W / 2, 78);
    ctx.fillText(rrMsg, CANVAS_W / 2, 78);
    ctx.restore();
  }

  drawDamageNumbers(ctx, state.damageNumbers);
  drawEnvelopeOverlay(ctx, state);
  drawFlashEffects(ctx, state.flashEffects);

  if (state.phase === 'mario_jump') {
    drawJumpAnimation(ctx, state);
  }
  if (state.phase === 'mario_hammer') {
    drawHammerGauge(ctx, state, tick);
  }
  if (state.phase === 'mario_mash') {
    drawMashPhase(ctx, state, tick);
  }

  drawBottomBar(ctx, state);

  if (state.phase === 'boss_attack' || state.phase === 'snap_shut' || state.phase === 'pencil_rain') {
    drawAttackProjectile(ctx, state, tick);
    drawBlockUI(ctx, state, tick);
  }

  if (state.phase === 'rainbow_roll_attack') {
    drawRainbowRollAttack(ctx, state, tick);
    drawBlockUI(ctx, state, tick);
  }

  if (state.phase === 'primary_target') {
    drawPrimaryTargetOverlay(ctx, state, tick);
  }

  if (state.phase === 'pencil_cutscene') {
    drawPencilCutscene(ctx, state, tick);
  }

  if (state.phase === 'boss_reload') {
    drawBossReload(ctx, state, tick);
  }

  if (state.phase === 'attack_choice') {
    drawAttackChoiceOverlay(ctx, state);
  }

  if (state.phase === 'rainbow_smash') {
    drawRainbowSmash(ctx, state, tick);
  }

  if (state.phase === 'save_prompt') {
    drawSavePrompt(ctx, state);
  }

  // Always show current attack/action name in bottom-right corner
  drawAttackNameCorner(ctx, state, tick);

  if (state.phase === 'pullback') {
    drawPullback(ctx, state, tick);
  }

  if (state.phase === 'bumper_bands') {
    drawBumperBands(ctx, state);
  }

  if (state.phase === 'rubber_bind') {
    drawRubberBindPhase(ctx, state, tick);
  }

  if (state.phase === 'rubber_bind') {
    drawBlockUI(ctx, state, tick);
  }

  if (state.phase === 'snapback') {
    drawSnapbackPhase(ctx, state, tick);
    drawBlockUI(ctx, state, tick);
  }

  if (state.phase === 'trapped_snapback') {
    drawTrappedSnapback(ctx, state, tick);
  }

  if (state.phase === 'main_squeeze') {
    drawMainSqueezePhase(ctx, state, tick);
    drawBlockUI(ctx, state, tick);
  }

  if (state.phase === 'gettin_down') {
    drawGettinDownPhase(ctx, state, tick);
    drawBlockUI(ctx, state, tick);
  }

  if (state.phase === 'hole_punch_inner') {
    drawHolePunchInnerPhase(ctx, state, tick);
    drawBlockUI(ctx, state, tick);
  }

  if (state.phase === 'throwing_punches') {
    drawThrowingPunchesPhase(ctx, state, tick);
    drawBlockUI(ctx, state, tick);
  }

  if (state.phase === 'whole_punch_charge') {
    drawWholePunchCharge(ctx, state, tick);
  }

  if (state.phase === 'whole_punch_attempt') {
    drawWholePunchAttempt(ctx, state, tick);
  }

  if (state.phase === 'whole_punch_arms') {
    drawWholePunchArms(ctx, state, tick);
  }

  // Elevated Mario tile highlight (green box)
  if (state.marioElevated && (state.phase === 'puzzle' || state.phase === 'mario_walk' || state.phase === 'attack_choice' || state.phase === 'mario_jump' || state.phase === 'mario_hammer')) {
    const ring = state.marioFinalRing;
    const slot = state.marioFinalSlot;
    const r = BOSS_RADIUS + RING_WIDTH * (ring + 0.5);
    const angle = (slot / 12) * Math.PI * 2 - Math.PI / 2;
    const ex = RING_CX + Math.cos(angle) * r;
    const ey = RING_CY + Math.sin(angle) * r;
    ctx.save();
    const pulse = 0.6 + 0.4 * Math.sin(tick * 0.05);
    ctx.strokeStyle = '#44ff44';
    ctx.lineWidth = 4;
    ctx.globalAlpha = pulse;
    ctx.shadowColor = '#44ff44';
    ctx.shadowBlur = 12;
    ctx.strokeRect(ex - 18, ey - 18, 36, 36);
    ctx.restore();
  }

  if (state.phase === 'hole_punch_attack' && state.holePunchAnimPhase === 1) {
    // Punch flash: bright yellow/white overlay on inner ring slots 4-7
    const pulse = 0.6 + 0.4 * Math.sin(tick * 0.04);
    ctx.save();
    ctx.globalAlpha = pulse * 0.75;
    ctx.fillStyle = '#ffff44';
    // Draw flashes at approximate positions of inner ring slots 4-7
    const innerR = BOSS_RADIUS + RING_WIDTH * 0.5;
    for (let s = 4; s <= 7; s++) {
      const angle = (s / 12) * Math.PI * 2 - Math.PI / 2;
      const fx = RING_CX + Math.cos(angle) * innerR;
      const fy = RING_CY + Math.sin(angle) * innerR;
      ctx.beginPath();
      ctx.arc(fx, fy, RING_WIDTH * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Enemy's Turn announcement overlay
  if (state.phase === 'enemy_turn_announce') {
    drawEnemyTurnAnnounce(ctx, state, tick);
  }

  // Pause button (always shown during fight phases)
  drawPauseButton(ctx, state, tick);

  // Pause overlay
  if (state.paused) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 6;
    ctx.strokeText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 20);
    ctx.fillText('PAUSED', CANVAS_W / 2, CANVAS_H / 2 - 20);
    ctx.font = '18px monospace';
    ctx.fillStyle = '#aaaaaa';
    ctx.lineWidth = 0;
    ctx.fillText('Press P to resume', CANVAS_W / 2, CANVAS_H / 2 + 30);
    ctx.restore();
  }
}
