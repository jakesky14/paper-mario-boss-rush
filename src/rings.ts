import { PanelType, PanelDistribution, RingState, PathStep } from './types';

export const NUM_RINGS = 4;
export const NUM_PANELS = 12; // per ring

// Create initial ring states from a boss panel distribution
export function createRings(dist: PanelDistribution): RingState[] {
  // Build pool of panels
  const pool: PanelType[] = [];
  for (let i = 0; i < dist.action; i++) pool.push('action');
  for (let i = 0; i < dist.arrow_up; i++) pool.push('arrow_up');
  for (let i = 0; i < dist.arrow_left; i++) pool.push('arrow_left');
  for (let i = 0; i < dist.arrow_right; i++) pool.push('arrow_right');
  for (let i = 0; i < dist.plus_one; i++) pool.push('plus_one');
  for (let i = 0; i < dist.double_power; i++) pool.push('double_power');
  for (let i = 0; i < dist.treasure_chest; i++) pool.push('treasure_chest');
  for (let i = 0; i < dist.on_panel; i++) pool.push('on_panel');
  for (let i = 0; i < dist.magic_circle; i++) pool.push('magic_circle');
  for (let i = 0; i < dist.arrow_down; i++) pool.push('arrow_down');
  for (let i = 0; i < dist.envelope; i++) pool.push('envelope');
  for (let i = 0; i < dist.empty; i++) pool.push('empty');

  // Pad or trim to exactly 48 panels (4 rings * 12)
  const total = NUM_RINGS * NUM_PANELS;
  while (pool.length < total) pool.push('empty');

  // Enforce max 1 of each special panel per run
  const limitedPanels: PanelType[] = ['double_power', 'plus_one', 'treasure_chest', 'on_panel', 'envelope'];
  for (const sp of limitedPanels) {
    let found = false;
    for (let i = 0; i < pool.length; i++) {
      if (pool[i] === sp) {
        if (found) pool[i] = 'empty';
        else found = true;
      }
    }
  }

  // Shuffle
  shuffleArray(pool);

  // Split into rings
  const rings: RingState[] = [];
  for (let r = 0; r < NUM_RINGS; r++) {
    rings.push({
      panels: pool.slice(r * NUM_PANELS, (r + 1) * NUM_PANELS),
    });
  }

  return rings;
}

export function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// Rotate a ring by 1 slot. direction: 1=CW (panel index shifts up), -1=CCW
export function rotateRing(ring: RingState, direction: 1 | -1): void {
  const panels = ring.panels;
  if (direction === 1) {
    // CW: last panel goes to front
    const last = panels[panels.length - 1];
    for (let i = panels.length - 1; i > 0; i--) {
      panels[i] = panels[i - 1];
    }
    panels[0] = last;
  } else {
    // CCW: first panel goes to end
    const first = panels[0];
    for (let i = 0; i < panels.length - 1; i++) {
      panels[i] = panels[i + 1];
    }
    panels[panels.length - 1] = first;
  }
}

// Slide a column: cycles all 8 panels (4 rings on slot `column` + 4 rings on opposite slot `column+6`)
// as a single chain. Inward on one side connects to outward on the opposite side.
// 'in': chain moves ring3[col]→ring2[col]→ring1[col]→ring0[col]→ring0[opp]→ring1[opp]→ring2[opp]→ring3[opp]→ring3[col]
// 'out': reverse of the above
export function slideColumn(rings: RingState[], column: number, direction: 'in' | 'out'): void {
  const opp = (column + 6) % 12;
  if (direction === 'in') {
    const saved = rings[0].panels[column];
    rings[0].panels[column] = rings[1].panels[column];
    rings[1].panels[column] = rings[2].panels[column];
    rings[2].panels[column] = rings[3].panels[column];
    rings[3].panels[column] = rings[3].panels[opp];
    rings[3].panels[opp] = rings[2].panels[opp];
    rings[2].panels[opp] = rings[1].panels[opp];
    rings[1].panels[opp] = rings[0].panels[opp];
    rings[0].panels[opp] = saved;
  } else {
    const saved = rings[3].panels[column];
    rings[3].panels[column] = rings[2].panels[column];
    rings[2].panels[column] = rings[1].panels[column];
    rings[1].panels[column] = rings[0].panels[column];
    rings[0].panels[column] = rings[0].panels[opp];
    rings[0].panels[opp] = rings[1].panels[opp];
    rings[1].panels[opp] = rings[2].panels[opp];
    rings[2].panels[opp] = rings[3].panels[opp];
    rings[3].panels[opp] = saved;
  }
}

// Simulate Mario's path through the ring system
// Mario starts at the given ring and slot, following arrow panels
export function simulatePath(rings: RingState[], startRing = 3, startSlot = 8, magicCircleActive = false): PathStep[] {
  const steps: PathStep[] = [];
  let ring = startRing;
  let slot = startSlot;
  let lastDir: 'up' | 'down' | 'left' | 'right' = 'up'; // Mario initially faces inward
  const visited = new Set<string>();

  while (true) {
    const key = `${ring},${slot}`;
    if (visited.has(key)) break; // loop protection
    visited.add(key);

    const panel = rings[ring].panels[slot];

    if (panel === 'arrow_up') {
      steps.push({ ring, slot, panel, pauseMs: 0 });
      lastDir = 'up';
      if (ring === 0) break;
      ring--;
    } else if (panel === 'arrow_left') {
      steps.push({ ring, slot, panel, pauseMs: 0 });
      lastDir = 'left';
      slot = (slot - 1 + 12) % 12;
    } else if (panel === 'arrow_right') {
      steps.push({ ring, slot, panel, pauseMs: 0 });
      lastDir = 'right';
      slot = (slot + 1) % 12;
    } else if (panel === 'arrow_down') {
      steps.push({ ring, slot, panel, pauseMs: 0 });
      lastDir = 'down';
      if (ring === NUM_RINGS - 1) break; // can't go further out
      ring++;
    } else if (panel === 'on_panel') {
      steps.push({ ring, slot, panel, pauseMs: 500 });
      // continue in last direction (magicActive is now just cosmetic in game state)
      if (lastDir === 'up') { if (ring === 0) break; ring--; }
      else if (lastDir === 'down') { if (ring === NUM_RINGS - 1) break; ring++; }
      else if (lastDir === 'left') { slot = (slot - 1 + 12) % 12; }
      else { slot = (slot + 1) % 12; }
    } else if (panel === 'magic_circle') {
      if (magicCircleActive) {
        // Active magic circle stops Mario
        steps.push({ ring, slot, panel, pauseMs: 300 });
        break;
      } else {
        // Inactive — Mario passes through in last direction
        steps.push({ ring, slot, panel: 'empty', pauseMs: 0 });
        if (lastDir === 'up') { if (ring === 0) break; ring--; }
        else if (lastDir === 'down') { if (ring === NUM_RINGS - 1) break; ring++; }
        else if (lastDir === 'left') { slot = (slot - 1 + 12) % 12; }
        else { slot = (slot + 1) % 12; }
      }
    } else if (panel === 'treasure_chest') {
      steps.push({ ring, slot, panel, pauseMs: 800 });
      // continue in last direction
      if (lastDir === 'up') { if (ring === 0) break; ring--; }
      else if (lastDir === 'down') { if (ring === NUM_RINGS - 1) break; ring++; }
      else if (lastDir === 'left') { slot = (slot - 1 + 12) % 12; }
      else { slot = (slot + 1) % 12; }
    } else if (panel === 'heal' || panel === 'coin') {
      steps.push({ ring, slot, panel, pauseMs: 600 });
      if (lastDir === 'up') { if (ring === 0) break; ring--; }
      else if (lastDir === 'down') { if (ring === NUM_RINGS - 1) break; ring++; }
      else if (lastDir === 'left') { slot = (slot - 1 + 12) % 12; }
      else { slot = (slot + 1) % 12; }
    } else if (panel === 'plus_one' || panel === 'double_power') {
      steps.push({ ring, slot, panel, pauseMs: 1000 });
      if (lastDir === 'up') { if (ring === 0) break; ring--; }
      else if (lastDir === 'down') { if (ring === NUM_RINGS - 1) break; ring++; }
      else if (lastDir === 'left') { slot = (slot - 1 + 12) % 12; }
      else { slot = (slot + 1) % 12; }
    } else if (panel === 'envelope') {
      steps.push({ ring, slot, panel, pauseMs: 600 });
      if (lastDir === 'up') { if (ring === 0) break; ring--; }
      else if (lastDir === 'down') { if (ring === NUM_RINGS - 1) break; ring++; }
      else if (lastDir === 'left') { slot = (slot - 1 + 12) % 12; }
      else { slot = (slot + 1) % 12; }
    } else if (panel === 'rubber_band') {
      steps.push({ ring, slot, panel, pauseMs: 150 });
      // Deflect Mario inward when moving horizontally — slot stays same so stacked bands are each hit
      if (lastDir === 'left' || lastDir === 'right') {
        if (ring === 0) break;
        ring--;
        // lastDir unchanged: Mario continues left/right from the new ring on the next step
      } else {
        if (lastDir === 'up') { if (ring === 0) break; ring--; }
        else { if (ring === NUM_RINGS - 1) break; ring++; }
      }
    } else if (panel === 'action') {
      steps.push({ ring, slot, panel, pauseMs: 300 });
      break;
    } else {
      // empty — continue in last direction (momentum)
      steps.push({ ring, slot, panel: 'empty', pauseMs: 0 });
      if (lastDir === 'up') { if (ring === 0) break; ring--; }
      else if (lastDir === 'down') { if (ring === NUM_RINGS - 1) break; ring++; }
      else if (lastDir === 'left') { slot = (slot - 1 + 12) % 12; }
      else { slot = (slot + 1) % 12; }
    }
  }

  return steps;
}

// Ensure Boss 0 backside is reachable: guarantee at least 4 horizontal arrows in outer ring
export function ensureBacksideReachable(rings: RingState[]): void {
  const outerRing = rings[3];
  const horizontalArrows = outerRing.panels.filter(
    p => p === 'arrow_left' || p === 'arrow_right'
  ).length;

  if (horizontalArrows >= 4) return;

  const needed = 4 - horizontalArrows;
  let replaced = 0;

  // Find non-arrow panels to replace (skip slot 8 which is Mario's start)
  const candidates: number[] = [];
  for (let i = 0; i < NUM_PANELS; i++) {
    if (i === 8) continue; // Mario's starting slot
    const p = outerRing.panels[i];
    if (p !== 'arrow_left' && p !== 'arrow_right' && p !== 'arrow_up') {
      candidates.push(i);
    }
  }

  // Shuffle candidates for randomness
  shuffleArray(candidates);

  for (let i = 0; i < candidates.length && replaced < needed; i++) {
    outerRing.panels[candidates[i]] = 'arrow_right';
    replaced++;
  }
}

// Apply Hole Punch special: replace 4 random panels with empty
export function applyHolePunchSpecial(rings: RingState[]): void {
  const positions: Array<[number, number]> = [];
  for (let r = 0; r < NUM_RINGS; r++) {
    for (let c = 0; c < NUM_PANELS; c++) {
      positions.push([r, c]);
    }
  }
  shuffleArray(positions);
  const targets = positions.slice(0, 4);
  for (const [r, c] of targets) {
    rings[r].panels[c] = 'empty';
  }
}

// Apply Origami King special: rotate ring index 1 (ring 2) by 3 slots CW
export function applyOrigamiKingSpecial(rings: RingState[]): void {
  for (let i = 0; i < 3; i++) {
    rotateRing(rings[1], 1);
  }
}
