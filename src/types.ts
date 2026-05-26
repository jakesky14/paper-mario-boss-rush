// Panel types for ring slots
export type PanelType = 'empty' | 'action' | 'heal' | 'arrow_up' | 'arrow_left' | 'arrow_right' | 'plus_one' | 'double_power' | 'treasure_chest' | 'on_panel' | 'magic_circle' | 'arrow_down' | 'envelope' | 'coin' | 'rubber_band';

// Game phases
export type Phase =
  | 'title'
  | 'main_menu'
  | 'shop'
  | 'testing_select'
  | 'boss_intro'
  | 'setup'
  | 'puzzle'
  | 'mario_walk'
  | 'attack_choice'
  | 'mario_jump'
  | 'mario_hammer'
  | 'mario_mash'
  | 'boss_attack'
  | 'primary_target'
  | 'pencil_cutscene'
  | 'pencil_rain'
  | 'snap_shut'
  | 'boss_reload'
  | 'pencil_grab'
  | 'rainbow_smash'
  | 'rainbow_roll_attack'
  | 'pullback'
  | 'bumper_bands'
  | 'save_prompt'
  | 'victory'
  | 'game_over';

export interface AccessoryInventory {
  heartPlus: boolean;
  silverHeartPlus: boolean;
  goldHeartPlus: boolean;
  guardPlus: boolean;
  silverGuardPlus: boolean;
  goldGuardPlus: boolean;
  timePlus: boolean;
  silverTimePlus: boolean;
  goldTimePlus: boolean;
}

// Boss definition
export interface BossDef {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  color: string;
  panels: PanelDistribution;
  special?: 'hole_punch' | 'origami_king' | 'scissors' | 'tape';
}

export interface PanelDistribution {
  action: number;
  arrow_up: number;
  arrow_left: number;
  arrow_right: number;
  plus_one: number;
  double_power: number;
  treasure_chest: number;
  on_panel: number;
  magic_circle: number;
  arrow_down: number;
  envelope: number;
  empty: number;
}

// A single ring with 12 slots
export interface RingState {
  panels: PanelType[];
}

// Animation for damage numbers
export interface DamageNumber {
  value: number;
  x: number;
  y: number;
  alpha: number;
  vy: number;
  color: string;
  scale: number;
  label?: string;
  effectType?: 'damage' | 'heal';
}

// Flash effect
export interface FlashEffect {
  alpha: number;
  color: string;
  target: 'boss' | 'player';
}

// Ring rotation animation
export interface RotationAnim {
  ringIndex: number;       // 0-3
  direction: 1 | -1;      // 1=CW, -1=CCW
  progress: number;        // 0..1
  duration: number;        // ms
  elapsed: number;         // ms
}

// Slide animation
export interface SlideAnim {
  column: number;          // 0-11
  direction: 'in' | 'out';
  progress: number;
  duration: number;
  elapsed: number;
}

// Step in Mario's walk path
export interface PathStep {
  ring: number;       // 0=inner, 3=outer
  slot: number;       // 0-11
  panel: PanelType;
  pauseMs: number;    // 0 for arrows, 1000 for heal/plus_one/double_power, 300 for action
}

// Full game state
export interface GameState {
  phase: Phase;
  bossIndex: number;         // 0, 1, 2
  boss: BossDef;
  rings: RingState[];        // [ring0=innermost, ring1, ring2, ring3=outermost]
  playerHp: number;
  playerMaxHp: number;
  selectedRing: number;      // 0-3
  selectedColumn: number;    // 0-11 (for slide / hover highlight)
  movesLeft: number;
  maxMoves: number;
  puzzleTimer: number;       // ms remaining
  puzzleMaxTimer: number;    // ms
  turnNumber: number;
  damageNumbers: DamageNumber[];
  flashEffects: FlashEffect[];
  rotationAnim: RotationAnim | null;
  slideAnim: SlideAnim | null;
  introTimer: number;        // ms for boss intro screen
  lastDamageDealt: number;
  lastBossDamage: number;
  confettiParticles: ConfettiParticle[];
  titleRingAngle: number;    // for title screen spinning ring
  marioSlot: number;           // which column slot (0-11) Mario is on — always 8 (bottom-left)
  activeRingMoveStarted: boolean; // whether first arrow press on current ring selection has been made
  attackChoice: 'none' | 'pending' | 'jump' | 'hammer'; // current attack choice state
  tick: number;              // game tick for animations
  marioWalkPath: PathStep[];
  marioWalkStep: number;        // current step being animated
  marioWalkTimer: number;       // ms elapsed at current step
  marioAttackCount: number;     // 1 normally, 2 if plus_one collected
  marioDamageMult: number;      // 1.0 normally, 2.0 if double_power collected
  marioReachedAction: boolean;  // whether Mario landed on action panel
  // SET 2 — ring/column control mode
  puzzleControlMode: 'ring_select' | 'ring_edit' | 'column_select' | 'column_edit';
  ringCursor: number;           // 0-3, highlighted ring when cycling
  columnCursor: number;         // 0-11, highlighted column when cycling
  // SET 3 — boss attack projectile + block
  attackProjectileT: number;    // 0 to 1, travel progress
  blockWindowOpen: boolean;     // true when in the block timing window
  playerBlocked: boolean;       // whether player successfully blocked
  marioFinalRing: number;       // which ring Mario ended on (for hammer range check)
  marioFinalSlot: number;       // which slot Mario ended on
  attackAnimT: number;           // 0..1 progress for jump/hammer animation
  attackTimingPressed: boolean;  // player pressed Space during jump/hammer
  attackQuality: 'none' | 'nice' | 'great' | 'excellent'; // timing quality
  mushroomCount: number;           // mushroom items Mario has
  magicCircleActive: boolean;      // ON panel was stepped on this turn
  marioReachedMagicCircle: boolean;
  mashTimer: number;               // ms remaining in mash phase (5000ms)
  mashDamageTotal: number;         // accumulated mash damage
  mashCount: number;               // how many times Space has been pressed
  mashCooldown: number;            // ms until next mash press allowed (250ms reload)
  coinBonus: number;               // bonus damage from coins collected
  envelopeMessage: string;      // current envelope tip text
  envelopeTimer: number;        // ms remaining to show envelope
  attacksRemaining: number;     // attacks left for +1 panel second hit

  // Testing mode
  testingMode: boolean;

  // Persistent progression (survives between runs)
  coins: number;
  mainMenuCursor: 'fight' | 'restart' | 'shop';
  shopCursor: number;
  accessories: AccessoryInventory;
  maxUpHeartsInStock: number;
  maxUpHeartsBought: number;
  bossFirstClear: boolean[];

  // Colored Pencils (boss 0) mechanics
  pencilsAlive: boolean[];                          // 12 elements
  targetedPanels: Array<{ ring: number; slot: number }>;
  pencilsTargetIndices: number[];                   // which pencil indices (0–11) are targeting
  pencilCaseClosed: boolean;                        // Mario ended in back slots (6–9)
  bossStunned: boolean;                             // boss stunned after case explosion
  primaryTargetTimer: number;                       // ms for primary target display
  pencilCutsceneTimer: number;                      // ms for post-walk cutscene
  pencilRainCount: number;                          // alive pencils at time of rain
  pencilRainBlocked: boolean;
  pencilRainIdx: number;                            // which pencil is currently flying (0-based)
  pencilRainBlockedCount: number;                   // how many pencils blocked so far
  bossAttackName: string;                           // "PRIMARY TARGET", "PENCIL RAIN", etc.

  // Rainbow Roll mechanic (boss 0)
  rainbowRollReady: boolean;        // true once HP drops to half (75)
  rainbowRollCharging: boolean;     // true for the one-turn warning
  pencilGrabHandsPos: number;       // -3 to 3, hand position (0 = over pencils)
  pencilGrabGripped: boolean;       // has player pressed space to grip
  rainbowSmashTimer: number;        // 5000ms countdown
  rainbowSmashCount: number;        // number of smashes
  rainbowSmashCooldown: number;     // 250ms between smashes
  noReloadMode: boolean;            // after rainbow smash: boss only does 2-dmg "Worse Case"
  saveCursor: 'yes' | 'no';         // which option is highlighted in save_prompt
  rainbowRollAttackT: number;       // 0..1 progress for rainbow roll attack projectile

  rubberBands: Array<{ring: number; slot: number; origPanel: 'arrow_up' | 'arrow_down'}>;
  rubberBandCount: number;
  rubberBandHpPerBand: number;
  pullbackTimer: number;
}

export interface TargetedPanel {
  ring: number;
  slot: number;
}

export interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  angle: number;
  angularVel: number;
  alpha: number;
}
