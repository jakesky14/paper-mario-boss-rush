import {
  GameState,
  Phase,
  DamageNumber,
  FlashEffect,
  ConfettiParticle,
  AccessoryInventory,
} from './types';
import { BOSSES } from './bosses';
import {
  createRings,
  rotateRing,
  slideColumn,
  simulatePath,
  applyHolePunchSpecial,
  applyOrigamiKingSpecial,
  ensureBacksideReachable,
  NUM_PANELS,
  shuffleArray,
} from './rings';
import { render, CANVAS_W, CANVAS_H, RING_CX, RING_CY, BOSS_RADIUS, RING_WIDTH, PAUSE_BTN } from './render';

const PUZZLE_DURATION = 40000; // ms
const MAX_MOVES = 3;
const INTRO_DURATION = 4500;
const ROTATION_ANIM_DURATION = 350;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState;
  private lastTime = 0;
  private tick = 0;
  private bossSpecialPending = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get 2D context');
    this.ctx = ctx;

    canvas.width = 900;
    canvas.height = 680;

    this.state = this.createInitialState();
    this.bindInput();
  }

  private createInitialState(): GameState {
    const boss = { ...BOSSES[0] };
    return {
      phase: 'title',
      bossIndex: 0,
      boss,
      rings: createRings(boss.panels),
      playerHp: 100,
      playerMaxHp: 100,
      selectedRing: 0,
      selectedColumn: 0,
      movesLeft: MAX_MOVES,
      maxMoves: MAX_MOVES,
      puzzleTimer: PUZZLE_DURATION,
      puzzleMaxTimer: PUZZLE_DURATION,
      turnNumber: 1,
      damageNumbers: [],
      flashEffects: [],
      rotationAnim: null,
      slideAnim: null,
      introTimer: INTRO_DURATION,
      lastDamageDealt: 0,
      lastBossDamage: 0,
      confettiParticles: [],
      titleRingAngle: 0,
      marioSlot: 6,
      activeRingMoveStarted: false,
      attackChoice: 'none',
      tick: 0,
      marioWalkPath: [],
      marioWalkStep: 0,
      marioWalkTimer: 0,
      marioAttackCount: 1,
      marioDamageMult: 1,
      marioReachedAction: false,
      puzzleControlMode: 'ring_select',
      ringCursor: 3,
      columnCursor: 6,
      attackProjectileT: 0,
      blockWindowOpen: false,
      playerBlocked: false,
      marioFinalRing: 3,
      marioFinalSlot: 6,
      attackAnimT: 0,
      attackTimingPressed: false,
      attackQuality: 'none' as const,
      mushroomCount: 3,
      magicCircleActive: false,
      marioReachedMagicCircle: false,
      mashTimer: 0,
      mashDamageTotal: 0,
      mashCount: 0,
      mashCooldown: 0,
      coinBonus: 0,
      envelopeMessage: '',
      envelopeTimer: 0,
      attacksRemaining: 1,
      paused: false,
      testingMode: false,
      coins: 1000,
      mainMenuCursor: 'fight',
      howToPlayPage: 0,
      shopCursor: 0,
      ringHistory: [],
      accessories: {
        heartPlus: false,
        silverHeartPlus: false,
        goldHeartPlus: false,
        guardPlus: false,
        silverGuardPlus: false,
        goldGuardPlus: false,
        timePlus: false,
        silverTimePlus: false,
        goldTimePlus: false,
      },
      maxUpHeartsInStock: 1,
      maxUpHeartsBought: 0,
      bossFirstClear: new Array(6).fill(false),
      pencilsAlive: new Array(12).fill(true),
      targetedPanels: [],
      pencilsTargetIndices: [],
      pencilCaseClosed: false,
      bossStunned: false,
      primaryTargetTimer: 0,
      pencilCutsceneTimer: 0,
      pencilRainCount: 0,
      pencilRainBlocked: false,
      pencilRainIdx: 0,
      pencilRainBlockedCount: 0,
      bossAttackName: '',
      rainbowRollReady: false,
      rainbowRollCharging: false,
      pencilGrabHandsPos: 0,
      pencilGrabGripped: false,
      pencilGrabMode: 'rainbow' as const,
      rainbowSmashTimer: 0,
      rainbowSmashCount: 0,
      rainbowSmashCooldown: 0,
      noReloadMode: false,
      saveCursor: 'yes',
      rainbowRollAttackT: 0,
      rubberBands: [],
      rubberBandCount: 0,
      rubberBandHpPerBand: 10,
      pullbackTimer: 0,
      marioTied: false,
      rubberBindBandIndex: 0,
      rubberBindDelayTimer: 0,
      rubberBindPermanentDmg: 0,
      trappedSnapbackTimer: 0,
      snapbackTimer: 0,
      snapbackT: 0,
      snapbackBlocked: false,
      armsGrabHandsPos: 0,
      armsGrabGripped: false,
      armsPullHeld: false,
      armsPullT: 0,
      armsPullDamageDealt: false,
      rubberBandSoloMode: false,
      soloBootsHammerRestoreHp: 0,
      soloSnapbackChargeTimer: 0,
      soloGrabTimer: 0,
      soloGrabAttempt: 0,
      soloGrabSubPhase: 'moving' as const,
      soloGrabBandPos: 0,
      soloGrabGripped: false,
      soloGrabPauseTimer: 0,
      soloSlamTimer: 0,
      soloSlamCount: 0,
      soloSlamCooldown: 0,
      soloPullHeld: false,
      soloPullT: 0,
      soloSlingshotLaunched: false,
      soloSlingshotT: 0,
      soloSnapbackAttackT: 0,
      pendingBossPhase: 'boss_attack' as Phase,
      enemyTurnAnnounceTimer: 0,
      soloGrabHandsCursor: 0,
      holePunchAttackTimer: 0,
      holePunchAnimPhase: 0,
      holePunchShuffleCount: 0,
      holePunchPunchCount: 0,
      marioPartsHolePunched: 0,
      mainSqueezeTimer: 0,
      holePunchInnerTimer: 0,
      gettinDownTimer: 0,
      throwingPunchesIdx: 0,
      throwingPunchesTotal: 0,
      throwingPunchesBoardCount: 0,
      throwingPunchesDelayTimer: 0,
      rubberBandArmsUsed: false,
      rubberBandSoloWarned: false,
      rubberBandNormalAttackUsed: false,
    };
  }

  private resetForBoss(bossIndex: number): void {
    const boss = { ...BOSSES[bossIndex] };
    const maxTimer = this.computeMaxTimer();
    this.state.bossIndex = bossIndex;
    this.state.boss = boss;
    this.state.rings = createRings(boss.panels);
    if (bossIndex === 0) {
      ensureBacksideReachable(this.state.rings);
    }
    this.state.movesLeft = MAX_MOVES;
    this.state.maxMoves = MAX_MOVES;
    this.state.puzzleMaxTimer = maxTimer;
    this.state.puzzleTimer = maxTimer;
    this.state.selectedRing = 0;
    this.state.selectedColumn = 0;
    this.state.turnNumber = 1;
    this.state.rotationAnim = null;
    this.state.slideAnim = null;
    this.state.lastDamageDealt = 0;
    this.state.lastBossDamage = 0;
    this.state.damageNumbers = [];
    this.state.flashEffects = [];
    this.state.marioSlot = 6;
    this.state.activeRingMoveStarted = false;
    this.state.attackChoice = 'none';
    this.state.marioWalkPath = [];
    this.state.marioWalkStep = 0;
    this.state.marioWalkTimer = 0;
    this.state.marioAttackCount = 1;
    this.state.marioDamageMult = 1;
    this.state.marioReachedAction = false;
    this.state.puzzleControlMode = 'ring_select';
    this.state.ringCursor = 3;
    this.state.columnCursor = 6;
    this.state.attackProjectileT = 0;
    this.state.blockWindowOpen = false;
    this.state.playerBlocked = false;
    this.state.marioFinalRing = 3;
    this.state.marioFinalSlot = 6;
    this.state.attackAnimT = 0;
    this.state.attackTimingPressed = false;
    this.state.attackQuality = 'none';
    this.state.envelopeMessage = '';
    this.state.envelopeTimer = 0;
    this.state.attacksRemaining = 1;
    this.state.mushroomCount = 3;
    this.state.magicCircleActive = false;
    this.state.marioReachedMagicCircle = false;
    this.state.mashTimer = 0;
    this.state.mashDamageTotal = 0;
    this.state.mashCount = 0;
    this.state.mashCooldown = 0;
    this.state.coinBonus = 0;
    this.state.pencilsAlive = new Array(12).fill(true);
    this.state.targetedPanels = [];
    this.state.pencilsTargetIndices = [];
    this.state.pencilCaseClosed = false;
    this.state.bossStunned = false;
    this.state.primaryTargetTimer = 0;
    this.state.pencilCutsceneTimer = 0;
    this.state.pencilRainCount = 0;
    this.state.pencilRainBlocked = false;
    this.state.pencilRainIdx = 0;
    this.state.pencilRainBlockedCount = 0;
    this.state.bossAttackName = '';
    this.state.rainbowRollReady = false;
    this.state.rainbowRollCharging = false;
    this.state.pencilGrabHandsPos = 0;
    this.state.pencilGrabGripped = false;
    this.state.pencilGrabMode = 'rainbow';
    this.state.rainbowSmashTimer = 0;
    this.state.rainbowSmashCount = 0;
    this.state.rainbowSmashCooldown = 0;
    this.state.noReloadMode = false;
    this.state.rainbowRollAttackT = 0;
    this.bossSpecialPending = false;
    this.state.rubberBands = [];
    this.state.rubberBandCount = bossIndex === 1 ? 10 : 0;
    this.state.rubberBandHpPerBand = 10;
    this.state.pullbackTimer = 0;
    this.state.marioTied = false;
    this.state.rubberBindBandIndex = 0;
    this.state.rubberBindDelayTimer = 0;
    this.state.rubberBindPermanentDmg = 0;
    this.state.trappedSnapbackTimer = 0;
    this.state.snapbackTimer = 0;
    this.state.snapbackT = 0;
    this.state.snapbackBlocked = false;
    this.state.armsGrabHandsPos = 0;
    this.state.armsGrabGripped = false;
    this.state.armsPullHeld = false;
    this.state.armsPullT = 0;
    this.state.armsPullDamageDealt = false;
    this.state.rubberBandSoloMode = false;
    this.state.soloBootsHammerRestoreHp = 0;
    this.state.soloSnapbackChargeTimer = 0;
    this.state.soloGrabTimer = 0;
    this.state.soloGrabAttempt = 0;
    this.state.soloGrabSubPhase = 'moving';
    this.state.soloGrabBandPos = 0;
    this.state.soloGrabGripped = false;
    this.state.soloGrabPauseTimer = 0;
    this.state.soloSlamTimer = 0;
    this.state.soloSlamCount = 0;
    this.state.soloSlamCooldown = 0;
    this.state.soloPullHeld = false;
    this.state.soloPullT = 0;
    this.state.soloSlingshotLaunched = false;
    this.state.soloSlingshotT = 0;
    this.state.soloSnapbackAttackT = 0;
    this.state.pendingBossPhase = 'boss_attack';
    this.state.enemyTurnAnnounceTimer = 0;
    this.state.soloGrabHandsCursor = 0;
    this.state.holePunchAttackTimer = 0;
    this.state.holePunchAnimPhase = 0;
    this.state.holePunchShuffleCount = 0;
    this.state.holePunchPunchCount = 0;
    this.state.marioPartsHolePunched = 0;
    this.state.throwingPunchesIdx = 0;
    this.state.throwingPunchesTotal = 0;
    this.state.throwingPunchesBoardCount = 0;
    this.state.throwingPunchesDelayTimer = 0;
    this.state.mainSqueezeTimer = 0;
    this.state.holePunchInnerTimer = 0;
    this.state.gettinDownTimer = 0;
    this.state.rubberBandArmsUsed = false;
    this.state.rubberBandSoloWarned = false;
    this.state.rubberBandNormalAttackUsed = false;
    if (bossIndex === 1) {
      this.state.boss.hp = this.state.rubberBandCount * this.state.rubberBandHpPerBand;
      this.state.boss.maxHp = this.state.rubberBandCount * this.state.rubberBandHpPerBand;
    }
  }

  private snapshotRings(): import('./types').PanelType[] {
    return this.state.rings.flatMap(r => [...r.panels]);
  }

  private restoreRingsFromSnapshot(snapshot: import('./types').PanelType[]): void {
    for (let r = 0; r < 4; r++) {
      this.state.rings[r].panels = snapshot.slice(r * 12, (r + 1) * 12) as import('./types').PanelType[];
    }
  }

  private startNewTurn(): void {
    this.state.ringHistory = [];
    this.state.rings = createRings(this.state.boss.panels);
    if (this.state.bossIndex === 0) {
      ensureBacksideReachable(this.state.rings);
    }
    // Boss 2 (Hole Punch): force ring 0 slots — on_panel at 6, empty at 4,5,7
    if (this.state.bossIndex === 2) {
      this.state.rings[0].panels[4] = 'empty';
      this.state.rings[0].panels[5] = 'empty';
      this.state.rings[0].panels[6] = 'on_panel';
      this.state.rings[0].panels[7] = 'empty';
    }
    // Once boss 0 HP is at half or below, place magic circle every turn (until noReloadMode)
    if (this.state.bossIndex === 0 && this.state.boss.hp <= this.state.boss.maxHp / 2 && !this.state.noReloadMode) {
      this.state.rainbowRollReady = true;
      this.state.rings[3].panels[9] = 'magic_circle';
    }
    this.state.movesLeft = MAX_MOVES;
    this.state.maxMoves = MAX_MOVES;
    const timerBonus = this.rollTimerBonus();
    const maxTimer = PUZZLE_DURATION + timerBonus;
    this.state.puzzleMaxTimer = maxTimer;
    this.state.puzzleTimer = maxTimer;
    this.state.rotationAnim = null;
    this.state.slideAnim = null;
    this.state.activeRingMoveStarted = false;
    this.state.attackChoice = 'none';
    this.state.marioWalkPath = [];
    this.state.marioWalkStep = 0;
    this.state.marioWalkTimer = 0;
    this.state.marioAttackCount = 1;
    this.state.marioDamageMult = 1;
    this.state.marioReachedAction = false;
    this.state.puzzleControlMode = 'ring_select';
    this.state.ringCursor = 3;
    this.state.columnCursor = 6;
    this.state.marioFinalRing = 3;
    this.state.marioFinalSlot = 6;
    this.state.attackAnimT = 0;
    this.state.attackTimingPressed = false;
    this.state.attackQuality = 'none';
    this.state.envelopeMessage = '';
    this.state.envelopeTimer = 0;
    this.state.attacksRemaining = 1;
    // magicCircleActive persists between turns until used
    this.state.marioReachedMagicCircle = false;
    this.state.mashTimer = 0;
    this.state.mashDamageTotal = 0;
    this.state.mashCount = 0;
    this.state.mashCooldown = 0;
    this.state.coinBonus = 0;
    this.state.targetedPanels = [];
    this.state.pencilsTargetIndices = [];
    this.state.pencilCaseClosed = false;
    this.state.bossStunned = false;
    this.state.primaryTargetTimer = 0;
    this.state.pencilCutsceneTimer = 0;
    this.state.pencilRainCount = 0;
    this.state.pencilRainBlocked = false;
    this.state.pencilRainIdx = 0;
    this.state.pencilRainBlockedCount = 0;
    this.state.bossAttackName = '';
    this.state.turnNumber++;
    this.bossSpecialPending = false;
    this.state.rubberBands = [];
    this.state.pullbackTimer = 0;
    this.state.rubberBindBandIndex = 0;
    this.state.rubberBindDelayTimer = 0;
    // NOTE: do NOT reset marioTied here - it persists until trapped_snapback fires
    // Boss 1: place rubber bands on up/down arrow positions each turn
    if (this.state.bossIndex === 1 && this.state.rubberBandCount > 0) {
      this.placeBumperBands();
    }
  }

  private transitionTo(phase: Phase): void {
    this.state.phase = phase;
  }

  private placeBumperBands(): void {
    const rings = this.state.rings;
    const count = this.state.rubberBandCount;
    const positions: Array<{ring: number; slot: number; origPanel: 'arrow_up' | 'arrow_down'}> = [];
    for (let r = 0; r < 4; r++) {
      for (let s = 0; s < 12; s++) {
        const p = rings[r].panels[s];
        if (p === 'arrow_up' || p === 'arrow_down') {
          positions.push({ ring: r, slot: s, origPanel: p as 'arrow_up' | 'arrow_down' });
        }
      }
    }
    shuffleArray(positions);
    // Keep 3 untouched, replace up to `count` others with rubber_band
    const toReplace = positions.slice(3, 3 + count);
    const newBands: Array<{ring: number; slot: number; origPanel: 'arrow_up' | 'arrow_down'}> = [];
    for (const pos of toReplace) {
      (rings[pos.ring].panels[pos.slot] as string) = 'rubber_band';
      newBands.push(pos);
    }
    this.state.rubberBands = newBands;
    this.state.boss.hp = Math.max(0, this.state.rubberBandCount * this.state.rubberBandHpPerBand - this.state.rubberBindPermanentDmg);
  }

  private bindInput(): void {
    window.addEventListener('keydown', (e) => this.handleKey(e));
    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowDown') {
        if (this.state.phase === 'arms_grab') {
          this.state.armsPullHeld = false;
        }
        if (this.state.phase === 'solo_slingshot' && !this.state.soloSlingshotLaunched) {
          this.state.soloPullHeld = false;
          if (this.state.soloPullT > 0.1) {
            this.state.soloSlingshotLaunched = true;
          }
        }
      }
    });
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  private handleKey(e: KeyboardEvent): void {
    const { phase } = this.state;

    // Pause toggle (P key) during fight phases
    const fightPhases: Phase[] = ['puzzle', 'mario_walk', 'attack_choice', 'mario_jump', 'mario_hammer',
      'mario_mash', 'boss_attack', 'primary_target', 'pencil_cutscene', 'pencil_rain', 'snap_shut',
      'boss_reload', 'pencil_grab', 'rainbow_smash', 'rainbow_roll_attack', 'pullback', 'bumper_bands',
      'rubber_bind', 'arms_grab', 'snapback', 'trapped_snapback',
      'solo_snapback_charge', 'solo_grab_attempt', 'solo_snapback_attack', 'solo_slam', 'solo_slingshot',
      'enemy_turn_announce', 'hole_punch_attack', 'main_squeeze', 'gettin_down', 'hole_punch_inner', 'throwing_punches'];
    if ((e.key === 'p' || e.key === 'P') && fightPhases.includes(phase)) {
      e.preventDefault();
      this.state.paused = !this.state.paused;
      return;
    }
    if (this.state.paused) return; // block all other keys while paused

    // Testing select
    if (phase === 'testing_select') {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 6) {
        this.state.testingMode = true;
        this.resetForBoss(num - 1);
        this.state.phase = 'boss_intro';
        this.state.introTimer = INTRO_DURATION;
      } else if (e.key === 'Escape') {
        this.transitionTo('title');
      }
      return;
    }

    // Save prompt navigation
    if (phase === 'save_prompt') {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        this.state.saveCursor = this.state.saveCursor === 'yes' ? 'no' : 'yes';
      } else if (e.code === 'Space' || e.key === 'Enter') {
        if (this.state.saveCursor === 'yes') {
          this.doSaveAndExit();
        } else {
          const nextIdx = this.state.bossIndex + 1;
          this.resetForBoss(nextIdx);
          this.transitionTo('boss_intro');
          this.state.introTimer = INTRO_DURATION;
        }
      }
      return;
    }

    // Title: T key for testing
    if (phase === 'title' && (e.key === 't' || e.key === 'T')) {
      this.transitionTo('testing_select');
      return;
    }

    // Main menu navigation
    if (phase === 'main_menu') {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const order: Array<typeof this.state.mainMenuCursor> = ['fight', 'restart', 'shop', 'how_to_play'];
        const idx = order.indexOf(this.state.mainMenuCursor);
        this.state.mainMenuCursor = order[(idx - 1 + order.length) % order.length];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const order: Array<typeof this.state.mainMenuCursor> = ['fight', 'restart', 'shop', 'how_to_play'];
        const idx = order.indexOf(this.state.mainMenuCursor);
        this.state.mainMenuCursor = order[(idx + 1) % order.length];
      } else if (e.code === 'Space' || e.key === 'Enter') {
        if (this.state.mainMenuCursor === 'fight') {
          this.startGame();
        } else if (this.state.mainMenuCursor === 'restart') {
          // Clear save and start fresh from boss 0
          try { localStorage.removeItem('pmBossRush'); } catch (_) { /* ignore */ }
          const saved = { coins: this.state.coins, accessories: { ...this.state.accessories }, maxUpHeartsBought: this.state.maxUpHeartsBought, maxUpHeartsInStock: this.state.maxUpHeartsInStock, bossFirstClear: [...this.state.bossFirstClear] };
          this.resetForBoss(0);
          this.state.coins = saved.coins;
          this.state.accessories = saved.accessories;
          this.state.maxUpHeartsBought = saved.maxUpHeartsBought;
          this.state.maxUpHeartsInStock = saved.maxUpHeartsInStock;
          this.state.bossFirstClear = saved.bossFirstClear;
          const baseMax = this.computeMaxHp();
          const heartBonus = this.rollHeartBonus();
          this.state.playerMaxHp = baseMax + heartBonus;
          this.state.playerHp = this.state.playerMaxHp;
          this.state.phase = 'boss_intro';
          this.state.introTimer = INTRO_DURATION;
        } else if (this.state.mainMenuCursor === 'shop') {
          this.transitionTo('shop');
        } else {
          this.state.howToPlayPage = 0;
          this.transitionTo('how_to_play');
        }
      }
      return;
    }

    if (phase === 'how_to_play') {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.state.howToPlayPage = Math.min(1, this.state.howToPlayPage + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        this.state.howToPlayPage = Math.max(0, this.state.howToPlayPage - 1);
      } else if (e.key === 'Escape' || e.key === 'Backspace' || e.code === 'Space' || e.key === 'Enter') {
        this.transitionTo('main_menu');
      }
      return;
    }

    // Shop navigation
    if (phase === 'shop') {
      const ITEM_COUNT = 10;
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.state.shopCursor = (this.state.shopCursor - 1 + ITEM_COUNT) % ITEM_COUNT;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.state.shopCursor = (this.state.shopCursor + 1) % ITEM_COUNT;
      } else if (e.code === 'Space' || e.key === 'Enter') {
        this.tryBuyItem();
      } else if (e.key === 'Escape') {
        this.transitionTo('main_menu');
      }
      return;
    }

    // Mushroom item use
    if ((e.key === 'i' || e.key === 'I') && this.state.mushroomCount > 0) {
      if (phase === 'puzzle' || phase === 'attack_choice' || phase === 'mario_mash') {
        this.state.mushroomCount--;
        this.state.playerHp = Math.min(this.state.playerMaxHp, this.state.playerHp + 30);
        this.state.damageNumbers.push({
          value: 30, x: RING_CX, y: RING_CY - 40, alpha: 1, vy: -2,
          color: '#44ff88', scale: 1.3, label: '🍄 +30 HP', effectType: 'heal',
        });
        return;
      }
    }

    // Space bar — context-sensitive timing actions
    if (e.code === 'Space') {
      if (phase === 'mario_mash' && this.state.mashTimer > 0 && this.state.mashCount < 10 && this.state.mashCooldown <= 0) {
        if (this.state.bossIndex === 1) {
          // Boss 1: each press destroys one rubber band permanently
          if (this.state.rubberBandCount > 0) {
            this.state.rubberBandCount--;
            const hit = this.state.rubberBandHpPerBand;
            this.state.boss.hp = this.state.rubberBandCount * this.state.rubberBandHpPerBand;
            this.state.mashDamageTotal += hit;
            this.state.mashCount++;
            this.state.mashCooldown = 250;
            // Remove one rubber band panel from rings
            if (this.state.rubberBands.length > 0) {
              const removed = this.state.rubberBands.pop()!;
              this.state.rings[removed.ring].panels[removed.slot] = 'empty';
            }
            this.state.damageNumbers.push({
              value: hit, x: RING_CX + (Math.random() - 0.5) * 60,
              y: RING_CY - 30 + (Math.random() - 0.5) * 40,
              alpha: 1, vy: -2.5, color: '#ff8800', scale: 1.4,
              label: 'SNAP!', effectType: 'damage',
            });
            this.spawnFlash('boss', '#ff8844');
            if (this.state.boss.hp <= 0) {
              this.handleBossDefeated();
              return;
            }
          }
        } else {
          const hit = 7 + Math.floor(Math.random() * 7);
          this.state.mashDamageTotal += hit;
          this.state.boss.hp = Math.max(0, this.state.boss.hp - hit);
          this.state.mashCount++;
          this.state.mashCooldown = 250;
          this.state.damageNumbers.push({
            value: hit,
            x: RING_CX + (Math.random() - 0.5) * 60,
            y: RING_CY - 30 + (Math.random() - 0.5) * 40,
            alpha: 1, vy: -2.5, color: '#ffdd00', scale: 1.2, effectType: 'damage',
          });
          this.spawnFlash('boss', '#ffaa00');
          // Check for Rainbow Roll trigger
          if (this.state.bossIndex === 0 && !this.state.rainbowRollReady &&
              this.state.boss.hp <= this.state.boss.maxHp / 2 && this.state.boss.hp > 0) {
            this.state.rainbowRollReady = true;
            this.state.rainbowRollCharging = true;
            this.state.damageNumbers.push({
              label: '!! RAINBOW ROLL NEXT TURN!!', value: 0,
              x: RING_CX, y: RING_CY - 70, alpha: 1, vy: -2, color: '#ff8800', scale: 1.4,
            });
          }
          // End mash immediately once all 10 hits used
          if (this.state.mashCount >= 10) {
            this.state.mashTimer = 0;
          }
        }
        return;
      }
      if (phase === 'rubber_bind' && this.state.blockWindowOpen && !this.state.playerBlocked && !this.state.marioTied) {
        // Block success: push Mario back one ring (outward, toward ring 3)
        this.state.marioFinalRing = Math.min(3, this.state.marioFinalRing + 1);
        this.state.playerBlocked = true;
        this.state.damageNumbers.push({
          value: 0, label: 'BLOCKED! PUSHED BACK!',
          x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -1.5, color: '#44aaff', scale: 1.3,
        });
        return;
      }
      if (phase === 'snapback' && this.state.blockWindowOpen && !this.state.snapbackBlocked) {
        this.state.snapbackBlocked = true;
        this.state.playerBlocked = true;
        return;
      }
      if (phase === 'solo_snapback_attack' && this.state.blockWindowOpen && !this.state.snapbackBlocked) {
        this.state.snapbackBlocked = true;
        this.state.playerBlocked = true;
        return;
      }
      if (phase === 'solo_slam' && this.state.soloSlamCooldown <= 0) {
        this.state.soloSlamCount++;
        this.state.soloSlamCooldown = 250;
        this.state.damageNumbers.push({
          value: 0, label: 'SLAM!',
          x: RING_CX + (Math.random() - 0.5) * 60, y: RING_CY - 50,
          alpha: 1, vy: -2, color: '#ff8800', scale: 1.5,
        });
        this.spawnFlash('boss', '#ff6600');
        return;
      }
      if ((phase === 'boss_attack' || phase === 'pencil_rain' || phase === 'snap_shut' || phase === 'rainbow_roll_attack'
        || phase === 'main_squeeze' || phase === 'gettin_down' || phase === 'hole_punch_inner' || phase === 'throwing_punches') && this.state.blockWindowOpen && !this.state.playerBlocked) {
        this.state.playerBlocked = true;
        return;
      }
      if (phase === 'mario_jump' && !this.state.attackTimingPressed) {
        const dist = Math.abs(this.state.attackAnimT - 0.5);
        this.state.attackQuality = dist <= 0.05 ? 'excellent' : dist <= 0.12 ? 'great' : dist <= 0.22 ? 'nice' : 'none';
        this.state.attackTimingPressed = true;
        return;
      }
      if (phase === 'mario_hammer' && !this.state.attackTimingPressed) {
        const T = this.state.attackAnimT;
        this.state.attackQuality = T >= 0.88 ? 'excellent' : T >= 0.76 ? 'great' : T >= 0.62 ? 'nice' : 'none';
        this.state.attackTimingPressed = true;
        this.applyFinalDamage('hammer', this.state.attackQuality === 'excellent');
        return;
      }
      if (phase === 'title') { this.transitionTo('main_menu'); return; }
      if (phase === 'game_over') { this.returnToMenu(); return; }
      if (phase === 'victory') { this.returnToMenu(); return; }
    }

    // Shift = evaluate/confirm puzzle
    if ((e.key === 'Shift') && phase === 'puzzle') {
      this.endPuzzlePhase();
      return;
    }

    // Enter on menu screens
    if (e.key === 'Enter') {
      if (phase === 'title') { this.transitionTo('main_menu'); return; }
      if (phase === 'game_over') { this.returnToMenu(); return; }
      if (phase === 'victory') { this.returnToMenu(); return; }
    }

    // Attack choice
    if (phase === 'attack_choice') {
      if (e.key === 'j' || e.key === 'J') {
        this.startJumpAttack();
      } else if (e.key === 'h' || e.key === 'H') {
        this.startHammerAttack();
      }
      return;
    }

    // pencil_grab key handling
    if (phase === 'pencil_grab') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.state.pencilGrabHandsPos = Math.max(-3, this.state.pencilGrabHandsPos - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.state.pencilGrabHandsPos = Math.min(3, this.state.pencilGrabHandsPos + 1);
      } else if (e.code === 'Space' && !this.state.pencilGrabGripped) {
        if (this.state.pencilGrabHandsPos !== 0) {
          // Arms not aligned — show warning
          this.state.damageNumbers.push({
            value: 0, label: 'ALIGN FIRST!',
            x: RING_CX, y: RING_CY - 60, alpha: 1, vy: -2, color: '#ff4444', scale: 1.3,
          });
        } else if (this.state.pencilGrabMode === 'case_close') {
          // Close the pencil case with 1000-fold arms
          this.state.pencilGrabGripped = true;
          this.state.pencilCaseClosed = true;
          const aliveCount = this.state.pencilsAlive.filter(a => a).length;
          const explosionDmg = aliveCount * 3;
          this.state.boss.hp = Math.max(0, this.state.boss.hp - explosionDmg);
          this.state.lastDamageDealt = explosionDmg;
          if (explosionDmg > 0) {
            this.state.damageNumbers.push({
              value: explosionDmg, x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2.5,
              color: '#ff4444', scale: 1.5, label: `BOOM! -${explosionDmg}`, effectType: 'damage',
            });
            this.spawnFlash('boss', '#ff4400');
          }
          // Pencils all die
          this.state.pencilsAlive = this.state.pencilsAlive.map(() => false);
          // No stun — go straight to enemy turn
          this.startEnemyTurn();
        } else {
          this.state.pencilGrabGripped = true;
          this.state.rainbowSmashTimer = 5000;
          this.state.rainbowSmashCount = 0;
          this.state.rainbowSmashCooldown = 0;
          this.transitionTo('rainbow_smash');
        }
      }
      return;
    }

    // arms_grab key handling (boss 1 1000-fold arms)
    if (phase === 'arms_grab') {
      if (!this.state.armsGrabGripped) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.state.armsGrabHandsPos = Math.max(-3, this.state.armsGrabHandsPos - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.state.armsGrabHandsPos = Math.min(3, this.state.armsGrabHandsPos + 1);
        } else if (e.code === 'Space') {
          if (this.state.armsGrabHandsPos !== 0) {
            this.state.damageNumbers.push({
              value: 0, label: 'ALIGN FIRST!',
              x: RING_CX, y: RING_CY - 60, alpha: 1, vy: -2, color: '#ff4444', scale: 1.3,
            });
          } else {
            this.state.armsGrabGripped = true;
          }
        }
      } else {
        // Gripped — ↓ to pull
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.state.armsPullHeld = true;
        }
      }
      return;
    }

    // solo_grab_attempt key handling — move cursor with ←/→, press Space to grip when aligned
    if (phase === 'solo_grab_attempt') {
      if (!this.state.soloGrabGripped) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.state.soloGrabHandsCursor = Math.max(-3, this.state.soloGrabHandsCursor - 1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.state.soloGrabHandsCursor = Math.min(3, this.state.soloGrabHandsCursor + 1);
        } else if (e.code === 'Space') {
          e.preventDefault();
          const sub = this.state.soloGrabSubPhase;
          if (sub === 'paused_left' || sub === 'paused_right') {
            const targetPos = sub === 'paused_left' ? -3 : 3;
            if (Math.abs(this.state.soloGrabHandsCursor - targetPos) <= 1) {
              this.state.soloGrabGripped = true;
            } else {
              this.state.damageNumbers.push({
                value: 0, label: 'ALIGN FIRST!',
                x: RING_CX, y: RING_CY - 60, alpha: 1, vy: -2, color: '#ff4444', scale: 1.3,
              });
              this.state.soloGrabPauseTimer = 0; // fail this attempt
            }
          }
        }
      }
      return;
    }

    // solo_slingshot key handling — ArrowDown to pull
    if (phase === 'solo_slingshot') {
      if (e.key === 'ArrowDown' && !this.state.soloSlingshotLaunched) {
        e.preventDefault();
        this.state.soloPullHeld = true;
      }
      return;
    }

    // rainbow_smash key handling
    if (phase === 'rainbow_smash' && e.code === 'Space' && this.state.rainbowSmashCooldown <= 0) {
      const hit = 10;
      this.state.boss.hp = Math.max(0, this.state.boss.hp - hit);
      this.state.rainbowSmashCount++;
      this.state.rainbowSmashCooldown = 250;
      this.state.damageNumbers.push({
        value: hit, x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2.5,
        color: '#ff4444', scale: 1.5, effectType: 'damage',
      });
      this.spawnFlash('boss', '#ff8844');
      return;
    }

    if (phase !== 'puzzle') return;
    if (this.state.rotationAnim !== null) return;

    const mode = this.state.puzzleControlMode;

    if (mode === 'ring_select') {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.state.ringCursor = (this.state.ringCursor - 1 + 4) % 4;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.state.ringCursor = (this.state.ringCursor + 1) % 4;
      } else if (e.key === 'Enter') {
        this.state.selectedRing = this.state.ringCursor;
        this.state.activeRingMoveStarted = false;
        this.state.puzzleControlMode = 'ring_edit';
      } else if (e.key === 'z' || e.key === 'Z') {
        this.state.puzzleControlMode = 'column_select';
      } else if (e.key === 'x' || e.key === 'X') {
        this.doUndo();
      }
    } else if (mode === 'ring_edit') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.doRotate(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.doRotate(1);
      } else if (e.key === 'Enter') {
        this.state.puzzleControlMode = 'ring_select';
      } else if (e.key === 'x' || e.key === 'X') {
        this.doUndo();
      }
    } else if (mode === 'column_select') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.state.columnCursor = (this.state.columnCursor - 1 + NUM_PANELS) % NUM_PANELS;
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.state.columnCursor = (this.state.columnCursor + 1) % NUM_PANELS;
      } else if (e.key === 'Enter') {
        this.state.selectedColumn = this.state.columnCursor;
        this.state.activeRingMoveStarted = false;
        this.state.puzzleControlMode = 'column_edit';
      } else if (e.key === 'z' || e.key === 'Z') {
        this.state.puzzleControlMode = 'ring_select';
      } else if (e.key === 'x' || e.key === 'X') {
        this.doUndo();
      }
    } else if (mode === 'column_edit') {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.doSlide('in');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.doSlide('out');
      } else if (e.key === 'Enter') {
        this.state.puzzleControlMode = 'column_select';
      } else if (e.key === 'x' || e.key === 'X') {
        this.doUndo();
      }
    }
  }

  private handleMouseMove(e: MouseEvent): void {
    if (this.state.phase !== 'puzzle') return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    const dx = mx - RING_CX;
    const dy = my - RING_CY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist >= BOSS_RADIUS && dist <= BOSS_RADIUS + 4 * RING_WIDTH) {
      // Get column from angle
      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      if (angle < 0) angle += Math.PI * 2;
      const col = Math.floor((angle / (Math.PI * 2)) * NUM_PANELS) % NUM_PANELS;
      this.state.selectedColumn = col;
    }
  }

  private handleClick(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (this.canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (this.canvas.height / rect.height);

    // Pause button click
    const pb = PAUSE_BTN;
    if (mx >= pb.x && mx <= pb.x + pb.w && my >= pb.y && my <= pb.y + pb.h) {
      this.state.paused = !this.state.paused;
      return;
    }

    if (this.state.paused) return;
    if (this.state.phase !== 'puzzle') return;

    const dx = mx - RING_CX;
    const dy = my - RING_CY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Click on ring to select it
    if (dist >= BOSS_RADIUS && dist <= BOSS_RADIUS + 4 * RING_WIDTH) {
      const ringIdx = Math.min(3, Math.floor((dist - BOSS_RADIUS) / RING_WIDTH));
      if (ringIdx !== this.state.selectedRing) {
        this.state.selectedRing = ringIdx;
        this.state.activeRingMoveStarted = false;
      }
    }
  }

  private doRotate(direction: 1 | -1): void {
    if (this.state.phase !== 'puzzle') return;

    if (this.state.activeRingMoveStarted) {
      // Free move on this ring selection — just rotate, no counter change
    } else {
      // First press on this ring — costs 1 move
      if (this.state.movesLeft <= 0) return;
      this.state.activeRingMoveStarted = true;
      this.state.movesLeft--;
    }

    this.state.ringHistory.push(this.snapshotRings());
    if (this.state.ringHistory.length > 20) this.state.ringHistory.shift();

    this.state.rotationAnim = {
      ringIndex: this.state.selectedRing,
      direction,
      progress: 0,
      duration: ROTATION_ANIM_DURATION,
      elapsed: 0,
    };
    // Apply immediately (animation is visual only)
    rotateRing(this.state.rings[this.state.selectedRing], direction);
  }

  private doSlide(direction: 'in' | 'out'): void {
    if (this.state.phase !== 'puzzle') return;

    if (this.state.activeRingMoveStarted) {
      // Free move on this ring selection — just slide, no counter change
    } else {
      // First press on this ring — costs 1 move
      if (this.state.movesLeft <= 0) return;
      this.state.activeRingMoveStarted = true;
      this.state.movesLeft--;
    }

    this.state.ringHistory.push(this.snapshotRings());
    if (this.state.ringHistory.length > 20) this.state.ringHistory.shift();

    this.state.slideAnim = {
      column: this.state.selectedColumn,
      direction,
      progress: 0,
      duration: ROTATION_ANIM_DURATION,
      elapsed: 0,
    };
    slideColumn(this.state.rings, this.state.selectedColumn, direction);
  }

  private doUndo(): void {
    if (this.state.phase !== 'puzzle') return;
    const snapshot = this.state.ringHistory.pop();
    if (!snapshot) return;
    this.restoreRingsFromSnapshot(snapshot);
    this.state.movesLeft = Math.min(this.state.maxMoves, this.state.movesLeft + 1);
    this.state.rotationAnim = null;
    this.state.slideAnim = null;
  }

  private endPuzzlePhase(): void {
    if (this.state.phase !== 'puzzle') return;
    // If Mario's starting panel is not an arrow, turn ends immediately
    const startPanel = this.state.rings[3].panels[this.state.marioSlot];
    const isArrow = startPanel === 'arrow_up' || startPanel === 'arrow_left' || startPanel === 'arrow_right';
    const isUsableStart = isArrow
      || startPanel === 'action'
      || startPanel === 'on_panel'
      || (startPanel === 'magic_circle' && this.state.magicCircleActive);
    if (!isUsableStart) {
      this.state.marioWalkPath = [];
      this.state.marioFinalRing = 3;
      this.state.marioFinalSlot = this.state.marioSlot;
      if (this.state.bossIndex === 0) {
        if (this.state.rainbowRollReady) {
          this.startRainbowRollAttack();
        } else {
          this.startPencilRain();
        }
      } else {
        if (this.state.boss.special === 'tape' && this.state.turnNumber % 2 === 0) {
          this.bossSpecialPending = true;
        }
        if (this.state.boss.special === 'origami_king' || this.state.boss.special === 'scissors') {
          this.bossSpecialPending = true;
        }
        this.startEnemyTurn();
      }
      return;
    }
    // Simulate Mario's path
    const path = simulatePath(this.state.rings, 3, this.state.marioSlot, this.state.magicCircleActive);
    this.state.marioWalkPath = path;
    this.state.marioWalkStep = 0;
    this.state.marioWalkTimer = 0;
    this.state.marioAttackCount = 1;
    this.state.marioDamageMult = 1;
    this.state.marioReachedAction = false;
    this.transitionTo('mario_walk');
  }

  private spawnFlash(target: 'boss' | 'player', color: string): void {
    this.state.flashEffects.push({
      alpha: 0.7,
      color,
      target,
    });
  }

  private announceEnemyTurn(phase: Phase): void {
    this.state.pendingBossPhase = phase;
    this.state.enemyTurnAnnounceTimer = 3000;
    this.transitionTo('enemy_turn_announce');
  }

  private executeBossAttack(): void {
    const phase = this.state.pendingBossPhase;
    if (phase === 'snapback') {
      this.startSnapback();
    } else if (phase === 'rubber_bind') {
      this.startRubberBind();
    } else if (phase === 'solo_snapback_attack') {
      this.startSoloSnapbackAttack();
    } else if (phase === 'main_squeeze') {
      this.state.mainSqueezeTimer = 2500;
      this.state.blockWindowOpen = false;
      this.state.playerBlocked = false;
      this.transitionTo('main_squeeze');
    } else if (phase === 'gettin_down') {
      this.state.gettinDownTimer = 2000;
      this.state.blockWindowOpen = false;
      this.state.playerBlocked = false;
      this.transitionTo('gettin_down');
    } else if (phase === 'hole_punch_inner') {
      this.state.holePunchInnerTimer = 3000;
      this.state.blockWindowOpen = false;
      this.state.playerBlocked = false;
      this.transitionTo('hole_punch_inner');
    } else if (phase === 'throwing_punches') {
      // Count all ring 0 board holes (holes from any slot, including shuffled positions)
      const r0 = this.state.rings[0].panels;
      const boardCount = r0.filter(p => p === 'hole' || p === 'on_panel_holed').length;
      const marioCount = this.state.holePunchPunchCount;
      this.state.throwingPunchesBoardCount = boardCount;
      this.state.throwingPunchesTotal = boardCount + marioCount;
      this.state.throwingPunchesIdx = 0;
      this.state.attackProjectileT = 0;
      this.state.throwingPunchesDelayTimer = 0;
      this.state.blockWindowOpen = false;
      this.state.playerBlocked = false;
      this.transitionTo('throwing_punches');
    } else {
      // boss_attack (default)
      this.state.attackProjectileT = 0;
      this.state.blockWindowOpen = false;
      this.state.playerBlocked = false;
      if (!this.state.bossAttackName) {
        this.state.bossAttackName = this.state.boss.name.toUpperCase() + '!';
      }
      this.transitionTo('boss_attack');
    }
  }

  private startSoloSnapbackAttack(): void {
    this.state.soloSnapbackAttackT = 0;
    this.state.blockWindowOpen = false;
    this.state.playerBlocked = false;
    this.state.snapbackBlocked = false;
    this.state.bossAttackName = 'SOLO SNAPBACK!';
    this.transitionTo('solo_snapback_attack');
  }

  private startEnemyTurn(): void {
    if (this.state.bossIndex === 1 && !this.state.rubberBandSoloMode) {
      const nextPhase: Phase = Math.random() < 0.5 ? 'snapback' : 'rubber_bind';
      this.state.bossAttackName = nextPhase === 'snapback' ? 'SNAPBACK!' : 'RUBBER BIND!';
      this.announceEnemyTurn(nextPhase);
    } else if (this.state.bossIndex === 1 && this.state.rubberBandSoloMode) {
      this.state.bossAttackName = 'SOLO SNAPBACK!';
      this.announceEnemyTurn('solo_snapback_attack');
    } else if (this.state.bossIndex === 2) {
      // Hole Punch attack routing based on Mario's final ring
      if (this.state.marioFinalRing <= 1) {
        // Inner ring: Hole Punch + Base Slap
        this.state.bossAttackName = 'HOLE PUNCH + BASE SLAP!';
        this.announceEnemyTurn('hole_punch_inner');
      } else if (this.state.holePunchPunchCount === 0) {
        // Outer ring, no punches: Gettin' Down
        this.state.bossAttackName = "GETTIN' DOWN!";
        this.announceEnemyTurn('gettin_down');
      } else {
        // Outer ring, has Mario punches: Throwing Punches
        this.state.bossAttackName = 'THROWING PUNCHES!';
        this.announceEnemyTurn('throwing_punches');
      }
    } else {
      this.state.bossAttackName = this.state.boss.name.toUpperCase() + '!';
      this.announceEnemyTurn('boss_attack');
    }
  }

  private startSnapback(): void {
    this.state.bossAttackName = 'SNAPBACK!';
    this.state.snapbackTimer = 2000; // total approach time
    this.state.snapbackT = 0;
    this.state.snapbackBlocked = false;
    this.state.blockWindowOpen = false;
    this.state.playerBlocked = false;
    this.transitionTo('snapback');
  }

  private startRubberBind(): void {
    this.state.bossAttackName = 'RUBBER BIND!';
    this.state.rubberBindBandIndex = 0;
    this.state.attackProjectileT = 0;
    this.state.rubberBindDelayTimer = 0;
    this.state.blockWindowOpen = false;
    this.state.playerBlocked = false;
    this.transitionTo('rubber_bind');
  }



  private startJumpAttack(): void {
    this.state.attackChoice = 'jump';
    this.state.attackAnimT = 0;
    this.state.attackTimingPressed = false;
    this.state.attackQuality = 'none';
    this.state.bossAttackName = 'JUMP!';
    this.transitionTo('mario_jump');
  }

  private startHammerAttack(): void {
    // Boss 0 non-stunned: must be in back columns — allow animation but 0 damage if wrong position
    if (this.state.bossIndex === 0 && !this.state.bossStunned) {
      const caseCloseSlots = [10, 11, 0, 1];
      if (!caseCloseSlots.includes(this.state.marioFinalSlot)) {
        // Wrong position — run hammer animation but deal 0 damage, then pencil rain
        this.state.damageNumbers.push({
          value: 0, label: 'WRONG POSITION!',
          x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2.5, color: '#ff4444', scale: 1.5,
        });
        // Fall through to start hammer animation (applyFinalDamage will set base=0 for wrong position)
      }
    }
    // Boss 2: show WRONG POSITION if not in back slots or wrong ring
    if (this.state.bossIndex === 2) {
      const hp2BackSlots = [10, 11, 0, 1];
      const wrongSlot = !hp2BackSlots.includes(this.state.marioFinalSlot);
      const wrongRing = this.state.marioFinalRing > 1;
      if (wrongSlot || wrongRing) {
        this.state.damageNumbers.push({
          value: 0, label: 'WRONG POSITION!',
          x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2.5, color: '#ff4444', scale: 1.5,
        });
        // Fall through — applyFinalDamage will set 0 damage
      }
    }
    // Range check: must be on ring 0 or 1
    if (this.state.marioFinalRing > 1) {
      this.state.lastDamageDealt = 0;
      this.state.damageNumbers.push({
        value: 0, label: 'OUT OF RANGE!',
        x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2.5, color: '#ff4444', scale: 1.5,
      });
      if (this.state.bossIndex === 0) {
        this.startPencilRain();
        return;
      }
      if (this.state.boss.special === 'tape' && this.state.turnNumber % 2 === 0) {
        this.bossSpecialPending = true;
      }
      if (this.state.boss.special === 'origami_king' || this.state.boss.special === 'scissors') {
        this.bossSpecialPending = true;
      }
      this.startEnemyTurn();
      return;
    }
    // Boss 0 non-stunned in case-close zone: case closes on hammer connect
    if (this.state.bossIndex === 0 && !this.state.bossStunned) {
      const caseCloseSlots2 = [10, 11, 0, 1];
      if (caseCloseSlots2.includes(this.state.marioFinalSlot)) {
        this.state.pencilCaseClosed = true;
      }
    }
    this.state.attackChoice = 'hammer';
    this.state.attackAnimT = 0;
    this.state.attackTimingPressed = false;
    this.state.attackQuality = 'none';
    this.state.bossAttackName = 'HAMMER!';
    this.transitionTo('mario_hammer');
  }

  private applyFinalDamage(type: 'jump' | 'hammer', perfect: boolean): void {
    const heartBonus = this.state.maxUpHeartsBought * 2;
    const quality = this.state.attackQuality;

    // Base damage per quality tier
    const jumpDmg: Record<string, number> = { none: 6, nice: 7, great: 8, excellent: 9 };
    const hammerDmg: Record<string, number> = { none: 7, nice: 8, great: 10, excellent: 12 };
    let base = (type === 'jump' ? jumpDmg[quality] : hammerDmg[quality]) + heartBonus;

    if (this.state.bossIndex === 0) {
      if (!this.state.bossStunned) {
        const backSlots = [10, 11, 0, 1];
        const frontSlots = [4, 5, 6];
        if (frontSlots.includes(this.state.marioFinalSlot) && type === 'jump') {
          const bounceDmg = this.applyGuardReduction(6);
          this.state.playerHp = Math.max(0, this.state.playerHp - bounceDmg);
          const mp = this.marioScreenPos();
          this.state.damageNumbers.push({
            value: bounceDmg, x: mp.x, y: mp.y - 20, alpha: 1, vy: -2,
            color: '#ff4444', scale: 1.2, label: `OUCH! -${bounceDmg}`, effectType: 'damage',
          });
          base = 0;
        } else if (!backSlots.includes(this.state.marioFinalSlot)) {
          base = 0;
        }
      }
    }

    // Boss 2 (Hole Punch): jump = 0 damage; hammer only in back slots + ring 0-1
    if (this.state.bossIndex === 2) {
      if (type === 'jump') {
        base = 0;
      } else if (type === 'hammer') {
        const hp2BackSlots = [10, 11, 0, 1];
        const inCorrectSlot = hp2BackSlots.includes(this.state.marioFinalSlot);
        const inCorrectRing = this.state.marioFinalRing <= 1;
        if (inCorrectSlot && inCorrectRing) {
          // Good hit — restore 2-3 hole-punched panels
          this.restoreHolePunchedPanels(2 + Math.floor(Math.random() * 2));
        } else {
          base = 0;
        }
      }
    }

    const perfMult = 1.0; // quality already baked in
    const hit = Math.round(base * this.state.marioDamageMult * perfMult);
    const total = hit + (this.state.attacksRemaining <= 1 ? this.state.coinBonus : 0);

    this.state.boss.hp = Math.max(0, this.state.boss.hp - total);
    this.state.lastDamageDealt = total;

    // Check for Rainbow Roll trigger (boss 0 HP drops to half)
    if (this.state.bossIndex === 0 && !this.state.rainbowRollReady &&
        this.state.boss.hp <= this.state.boss.maxHp / 2 && this.state.boss.hp > 0) {
      this.state.rainbowRollReady = true;
      this.state.rainbowRollCharging = true;
      this.state.damageNumbers.push({
        label: '!! RAINBOW ROLL NEXT TURN!!', value: 0,
        x: RING_CX, y: RING_CY - 70, alpha: 1, vy: -2, color: '#ff8800', scale: 1.4,
      });
    }

    this.state.damageNumbers.push({
      value: hit, x: RING_CX - 20, y: RING_CY - 50, alpha: 1, vy: -2.5,
      color: quality === 'excellent' ? '#ffdd00' : quality === 'great' ? '#88ff44' : quality === 'nice' ? '#44ddff' : '#ff6644',
      scale: 1.5,
      label: quality === 'excellent' ? 'EXCELLENT!' : quality === 'great' ? 'GREAT!' : quality === 'nice' ? 'NICE!' : undefined,
      effectType: 'damage',
    });
    this.spawnFlash('boss', perfect ? '#ffdd44' : '#ffffff');

    if (this.state.boss.hp <= 0) {
      if (this.state.bossIndex === 1 && !this.state.rubberBandSoloMode) {
        // Boots/hammer killing blow — enter solo mode; boss still gets an enemy turn
        this.state.rubberBandSoloMode = true;
        this.state.boss.hp = 1;
        // Fall through to normal post-attack routing (startEnemyTurn)
      } else {
        this.handleBossDefeated();
        return;
      }
    }

    // Second attack check
    if (this.state.attacksRemaining > 1 && this.state.boss.hp > 0) {
      this.state.attacksRemaining--;
      this.state.attackQuality = 'none';
      this.state.attackTimingPressed = false;
      this.state.attackAnimT = 0;
      this.state.attackChoice = 'pending';
      this.transitionTo('attack_choice');
      return;
    }

    // Boss 0 specific post-attack routing
    if (this.state.bossIndex === 0 && this.state.boss.hp > 0) {
      if (this.state.bossStunned) {
        // Second attack (empty case) done → snap shut
        this.state.bossStunned = false;
        this.startSnapShut();
        return;
      } else if (this.state.pencilCaseClosed) {
        // Hammer closed the case — explosion!
        const aliveCount = this.state.pencilsAlive.filter(Boolean).length;
        const explosionDmg = aliveCount * 3;
        this.state.boss.hp = Math.max(0, this.state.boss.hp - explosionDmg);
        this.state.lastDamageDealt += explosionDmg;
        this.state.damageNumbers.push({
          value: explosionDmg, x: RING_CX, y: RING_CY - 60,
          alpha: 1, vy: -2.5, color: '#ffdd00', scale: 1.8,
          label: `BOOM! ${explosionDmg}`, effectType: 'damage',
        });
        this.spawnFlash('boss', '#ffff44');
        this.state.pencilsAlive = new Array(12).fill(false);
        this.state.bossStunned = true;
        this.state.pencilCutsceneTimer = 4000;
        this.state.bossAttackName = 'CASE CLOSED!';
        if (this.state.boss.hp <= 0) {
          this.handleBossDefeated();
          return;
        }
        this.transitionTo('pencil_cutscene');
        return;
      } else {
        // Normal attack → pencil rain
        this.startPencilRain();
        return;
      }
    }

    if (this.state.boss.special === 'tape' && this.state.turnNumber % 2 === 0) {
      this.bossSpecialPending = true;
    }
    if (this.state.boss.special === 'origami_king' || this.state.boss.special === 'scissors') {
      this.bossSpecialPending = true;
    }
    this.startEnemyTurn();
  }

  private restoreHolePunchedPanels(count: number): void {
    const state = this.state;
    const holePanels: Array<{ r: number; s: number; type: 'hole' | 'on_panel_holed' }> = [];
    for (let r = 0; r < 4; r++) {
      for (let s = 0; s < 12; s++) {
        const p = state.rings[r].panels[s];
        if (p === 'hole' || p === 'on_panel_holed') {
          holePanels.push({ r, s, type: p });
        }
      }
    }
    // Shuffle and restore up to count
    for (let i = holePanels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [holePanels[i], holePanels[j]] = [holePanels[j], holePanels[i]];
    }
    const restored = holePanels.slice(0, count);
    if (restored.length > 0) {
      for (const { r, s, type } of restored) {
        state.rings[r].panels[s] = type === 'on_panel_holed' ? 'on_panel' : 'empty';
      }
      state.damageNumbers.push({
        value: 0, label: `HOLES RESTORED! +${restored.length}`,
        x: RING_CX, y: RING_CY - 70, alpha: 1, vy: -2, color: '#44ffcc', scale: 1.3,
      });
    }
  }

  private generatePrimaryTargets(): void {
    const count = 4 + Math.floor(Math.random() * 3); // 4, 5, or 6
    const allPanels: Array<{ ring: number; slot: number }> = [];
    for (let r = 0; r < 4; r++) {
      for (let s = 0; s < 12; s++) {
        allPanels.push({ ring: r, slot: s });
      }
    }
    // Simple shuffle
    for (let i = allPanels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allPanels[i], allPanels[j]] = [allPanels[j], allPanels[i]];
    }
    this.state.targetedPanels = allPanels.slice(0, count);

    // Pick the first `count` alive pencils as the ones targeting
    const indices: number[] = [];
    for (let i = 0; i < 12 && indices.length < count; i++) {
      if (this.state.pencilsAlive[i]) indices.push(i);
    }
    this.state.pencilsTargetIndices = indices;
  }

  private startPencilRain(): void {
    if (this.state.noReloadMode) {
      this.state.bossAttackName = 'WORSE CASE';
      this.state.attackProjectileT = 0;
      this.state.blockWindowOpen = false;
      this.state.playerBlocked = false;
      this.transitionTo('boss_attack');
      return;
    }
    this.state.pencilRainCount = this.state.pencilsAlive.filter(Boolean).length;
    this.state.bossAttackName = 'PENCIL RAIN';
    this.state.attackProjectileT = 0;
    this.state.blockWindowOpen = false;
    this.state.playerBlocked = false;
    this.state.pencilRainBlocked = false;
    this.state.pencilRainIdx = 0;
    this.state.pencilRainBlockedCount = 0;
    this.transitionTo('pencil_rain');
  }

  private startSnapShut(): void {
    this.state.bossAttackName = 'SNAP SHUT';
    this.state.attackProjectileT = 0;
    this.state.blockWindowOpen = false;
    this.state.playerBlocked = false;
    this.transitionTo('snap_shut');
  }

  private startBossReload(): void {
    if (!this.state.noReloadMode) {
      this.state.pencilsAlive = new Array(12).fill(true);
      this.state.bossAttackName = 'RELOAD';
    } else {
      this.state.bossAttackName = 'WORSE CASE';
    }
    this.state.primaryTargetTimer = 4500;
    this.transitionTo('boss_reload');
  }

  private startRainbowRollAttack(): void {
    const aliveCount = this.state.pencilsAlive.filter(Boolean).length;
    this.state.bossAttackName = 'RAINBOW ROLL!';
    this.state.rainbowRollAttackT = 0;
    this.state.blockWindowOpen = false;
    this.state.playerBlocked = false;
    // Store alive count in pencilRainCount for damage calc
    this.state.pencilRainCount = aliveCount;
    this.transitionTo('rainbow_roll_attack');
  }

  private startSoloSnapbackCycle(): void {
    // After a failed grab cycle, go back to setup — setup will show the charge warning,
    // then puzzle lets Mario line up a new magic circle
    this.state.bossAttackName = '';
    this.transitionTo('setup');
  }

  private marioScreenPos(): { x: number; y: number } {
    const slotAngle = ((this.state.marioSlot + 0.5) / 12) * Math.PI * 2 - Math.PI / 2;
    const marioR = BOSS_RADIUS + 3.5 * RING_WIDTH;
    return {
      x: RING_CX + marioR * Math.cos(slotAngle),
      y: RING_CY + marioR * Math.sin(slotAngle),
    };
  }

  private computeMaxHp(): number {
    let base = 100 + this.state.maxUpHeartsBought * 20;
    if (this.state.accessories.heartPlus) base += 5;
    if (this.state.accessories.silverHeartPlus) base += 10;
    if (this.state.accessories.goldHeartPlus) base += 20;
    return base;
  }

  private computeMaxTimer(): number {
    let ms = PUZZLE_DURATION;
    if (this.state.accessories.timePlus) ms += 5000;
    if (this.state.accessories.silverTimePlus) ms += 10000;
    if (this.state.accessories.goldTimePlus) ms += 20000;
    return ms;
  }

  private applyGuardReduction(damage: number): number {
    let remaining = damage;
    if (this.state.accessories.guardPlus) {
      const r = Math.random();
      const pct = r < 0.10 ? 0.05 : r < 0.80 ? 0.10 : 0.15;
      remaining = Math.max(0, remaining - Math.ceil(damage * pct));
    }
    if (this.state.accessories.silverGuardPlus) {
      const r = Math.random();
      const pct = r < 0.10 ? 0.10 : r < 0.30 ? 0.15 : 0.20;
      remaining = Math.max(0, remaining - Math.ceil(damage * pct));
    }
    if (this.state.accessories.goldGuardPlus) {
      const r = Math.random();
      const pct = r < 0.20 ? 0.20 : r < 0.70 ? 0.25 : 0.30;
      remaining = Math.max(0, remaining - Math.ceil(damage * pct));
    }
    return remaining;
  }

  private rollTimerBonus(): number {
    let bonus = 0;
    if (this.state.accessories.timePlus) {
      const r = Math.random();
      bonus += (r < 0.10 ? 5 : r < 0.80 ? 10 : 15) * 1000;
    }
    if (this.state.accessories.silverTimePlus) {
      const r = Math.random();
      bonus += (r < 0.10 ? 15 : r < 0.80 ? 20 : 25) * 1000;
    }
    if (this.state.accessories.goldTimePlus) {
      const r = Math.random();
      bonus += (r < 0.10 ? 25 : r < 0.70 ? 30 : 50) * 1000;
    }
    return bonus;
  }

  private rollHeartBonus(): number {
    let bonus = 0;
    if (this.state.accessories.heartPlus) bonus += Math.random() < 0.5 ? 10 : 15;
    if (this.state.accessories.silverHeartPlus) bonus += Math.random() < 0.5 ? 20 : 25;
    if (this.state.accessories.goldHeartPlus) bonus += Math.random() < 0.5 ? 30 : 35;
    return bonus;
  }

  private tryBuyItem(): void {
    const SHOP_ITEMS = [
      { key: 'heartPlus' },
      { key: 'silverHeartPlus' },
      { key: 'goldHeartPlus' },
      { key: 'guardPlus' },
      { key: 'silverGuardPlus' },
      { key: 'goldGuardPlus' },
      { key: 'timePlus' },
      { key: 'silverTimePlus' },
      { key: 'goldTimePlus' },
      { key: 'maxUpHeart' },
    ];
    const SHOP_COSTS = [500, 1000, 2000, 500, 1000, 2000, 500, 1000, 2000, 1000];
    const idx = this.state.shopCursor;
    const item = SHOP_ITEMS[idx];
    const cost = SHOP_COSTS[idx];

    if (this.state.coins < cost) return;

    if (item.key === 'maxUpHeart') {
      if (this.state.maxUpHeartsInStock <= 0) return;
      if (100 + this.state.maxUpHeartsBought * 20 >= 200) return; // cap reached
      this.state.coins -= cost;
      this.state.maxUpHeartsBought++;
      this.state.maxUpHeartsInStock = 0;
      const newMax = this.computeMaxHp();
      this.state.playerMaxHp = newMax;
      this.state.playerHp = Math.min(this.state.playerHp + 20, newMax);
    } else {
      const accKey = item.key as keyof AccessoryInventory;
      if (this.state.accessories[accKey]) return; // already owned
      this.state.coins -= cost;
      this.state.accessories[accKey] = true;
    }
    // Persist shop purchase immediately so startGame() loads the updated values
    try {
      const existing = this.loadSaveData() as Record<string, unknown> | null;
      const nextBossIndex = existing && typeof existing.nextBossIndex === 'number' ? existing.nextBossIndex : 0;
      localStorage.setItem('pmBossRush', JSON.stringify({
        coins: this.state.coins,
        accessories: { ...this.state.accessories },
        maxUpHeartsBought: this.state.maxUpHeartsBought,
        maxUpHeartsInStock: this.state.maxUpHeartsInStock,
        bossFirstClear: [...this.state.bossFirstClear],
        nextBossIndex,
      }));
    } catch (_) { /* ignore */ }
  }

  private onBossDefeated(bossIndex: number): void {
    if (!this.state.bossFirstClear[bossIndex]) {
      this.state.bossFirstClear[bossIndex] = true;
      this.state.coins += 300 + bossIndex * 100;
      if (100 + this.state.maxUpHeartsBought * 20 < 200 && this.state.maxUpHeartsInStock === 0) {
        this.state.maxUpHeartsInStock = 1;
      }
    } else {
      this.state.coins += 100;
    }
  }

  private handleBossDefeated(): void {
    this.onBossDefeated(this.state.bossIndex);
    if (this.state.bossIndex < 5) {
      this.state.saveCursor = 'yes';
      this.transitionTo('save_prompt');
    } else {
      this.transitionTo('victory');
      this.state.confettiParticles = this.generateConfetti();
    }
  }

  private doSaveAndExit(): void {
    const saveData = {
      coins: this.state.coins,
      accessories: { ...this.state.accessories },
      maxUpHeartsBought: this.state.maxUpHeartsBought,
      maxUpHeartsInStock: this.state.maxUpHeartsInStock,
      bossFirstClear: [...this.state.bossFirstClear],
      nextBossIndex: this.state.bossIndex + 1,
      playerMaxHp: this.state.playerMaxHp,
    };
    try { localStorage.setItem('pmBossRush', JSON.stringify(saveData)); } catch (_) { /* ignore */ }
    this.returnToMenu();
  }

  private loadSaveData(): { nextBossIndex: number } | null {
    try {
      const raw = localStorage.getItem('pmBossRush');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  hasSaveData(): boolean {
    try { return !!localStorage.getItem('pmBossRush'); } catch (_) { return false; }
  }

  private startGame(): void {
    const save = this.loadSaveData();
    if (save) {
      // Restore save data
      const s = save as Record<string, unknown>;
      if (typeof s.coins === 'number') this.state.coins = s.coins;
      if (s.accessories && typeof s.accessories === 'object') this.state.accessories = { ...this.state.accessories, ...(s.accessories as typeof this.state.accessories) };
      if (typeof s.maxUpHeartsBought === 'number') this.state.maxUpHeartsBought = s.maxUpHeartsBought;
      if (typeof s.maxUpHeartsInStock === 'number') this.state.maxUpHeartsInStock = s.maxUpHeartsInStock;
      if (Array.isArray(s.bossFirstClear)) this.state.bossFirstClear = s.bossFirstClear as boolean[];
    }
    const baseMax = this.computeMaxHp();
    const heartBonus = this.rollHeartBonus();
    const maxHp = baseMax + heartBonus;
    const startBoss = save && typeof (save as Record<string, unknown>).nextBossIndex === 'number'
      ? Math.min((save as Record<string, unknown>).nextBossIndex as number, 5)
      : 0;
    this.resetForBoss(startBoss);
    this.state.playerMaxHp = maxHp;
    this.state.playerHp = maxHp;
    this.state.phase = 'boss_intro';
    this.state.introTimer = INTRO_DURATION;
  }

  private returnToMenu(): void {
    const preserved = {
      coins: this.state.coins,
      accessories: { ...this.state.accessories },
      maxUpHeartsInStock: this.state.maxUpHeartsInStock,
      maxUpHeartsBought: this.state.maxUpHeartsBought,
      bossFirstClear: [...this.state.bossFirstClear],
    };
    try {
      localStorage.setItem('pmBossRush', JSON.stringify({
        coins: preserved.coins,
        accessories: preserved.accessories,
        maxUpHeartsBought: preserved.maxUpHeartsBought,
        maxUpHeartsInStock: preserved.maxUpHeartsInStock,
        bossFirstClear: preserved.bossFirstClear,
        nextBossIndex: 0,
      }));
    } catch (_) {}
    const newState = this.createInitialState();
    newState.phase = 'main_menu';
    newState.coins = preserved.coins;
    newState.accessories = preserved.accessories;
    newState.maxUpHeartsInStock = preserved.maxUpHeartsInStock;
    newState.maxUpHeartsBought = preserved.maxUpHeartsBought;
    newState.bossFirstClear = preserved.bossFirstClear;
    const maxHp = this.computeMaxHpFrom(preserved.accessories, preserved.maxUpHeartsBought);
    newState.playerMaxHp = maxHp;
    newState.playerHp = maxHp;
    this.state = newState;
  }

  private computeMaxHpFrom(acc: AccessoryInventory, maxUpBought: number): number {
    let base = 100 + maxUpBought * 20;
    if (acc.heartPlus) base += 5;
    if (acc.silverHeartPlus) base += 10;
    if (acc.goldHeartPlus) base += 20;
    return base;
  }


  private generateConfetti(): ConfettiParticle[] {
    const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ff8844'];
    const particles: ConfettiParticle[] = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H - CANVAS_H,
        vx: (Math.random() - 0.5) * 3,
        vy: 1.5 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 8,
        angle: Math.random() * Math.PI * 2,
        angularVel: (Math.random() - 0.5) * 0.15,
        alpha: 1,
      });
    }
    return particles;
  }

  private updateConfetti(dt: number): void {
    for (const p of this.state.confettiParticles) {
      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.angularVel;
      if (p.y > CANVAS_H + 20) {
        p.y = -20;
        p.x = Math.random() * CANVAS_W;
        p.alpha = 1;
      }
    }
    void dt;
  }

  update(dt: number): void {
    this.tick += dt;
    this.state.tick = this.tick;
    if (this.state.paused) return; // freeze all updates while paused
    const state = this.state;

    // Update damage numbers
    const aliveDmgNums: DamageNumber[] = [];
    for (const dn of state.damageNumbers) {
      dn.y += dn.vy;
      dn.alpha -= 0.012;
      dn.scale = Math.max(1, dn.scale - 0.02);
      if (dn.alpha > 0) aliveDmgNums.push(dn);
    }
    state.damageNumbers = aliveDmgNums;

    // Update flash effects
    const aliveFlashes: FlashEffect[] = [];
    for (const fx of state.flashEffects) {
      fx.alpha -= 0.04;
      if (fx.alpha > 0) aliveFlashes.push(fx);
    }
    state.flashEffects = aliveFlashes;

    // Update rotation animation
    if (state.rotationAnim) {
      state.rotationAnim.elapsed += dt;
      state.rotationAnim.progress = Math.min(1, state.rotationAnim.elapsed / state.rotationAnim.duration);
      if (state.rotationAnim.progress >= 1) {
        state.rotationAnim = null;
      }
    }

    // Update slide animation
    if (state.slideAnim) {
      state.slideAnim.elapsed += dt;
      state.slideAnim.progress = Math.min(1, state.slideAnim.elapsed / state.slideAnim.duration);
      if (state.slideAnim.progress >= 1) {
        state.slideAnim = null;
      }
    }

    // Update envelope timer (always ticks down)
    if (state.envelopeTimer > 0) state.envelopeTimer = Math.max(0, state.envelopeTimer - dt);

    switch (state.phase) {
      case 'title':
        state.titleRingAngle += 0.0008 * dt;
        break;

      case 'main_menu':
      case 'shop':
      case 'how_to_play':
        break;

      case 'boss_intro':
        state.introTimer -= dt;
        if (state.introTimer <= 0) {
          this.transitionTo('setup');
        }
        break;

      case 'setup':
        this.startNewTurn();
        if (state.bossIndex === 0) {
          this.generatePrimaryTargets();
          state.primaryTargetTimer = 4500;
          state.bossAttackName = 'PRIMARY TARGET';
          this.transitionTo('primary_target');
        } else if (state.bossIndex === 1) {
          if (state.rubberBandSoloMode) {
            // Solo phase: show charge warning, then let Mario arrange a new magic circle
            state.soloSnapbackChargeTimer = 3000;
            state.bossAttackName = 'SOLO SNAPBACK CHARGING...';
            state.soloGrabHandsCursor = 0;
            this.transitionTo('solo_snapback_charge');
          } else if (state.marioTied) {
            state.trappedSnapbackTimer = 3000;
            state.bossAttackName = 'TRAPPED SNAPBACK!';
            this.transitionTo('trapped_snapback');
          } else {
            state.pullbackTimer = 2500;
            state.bossAttackName = 'BUMPER BANDS!';
            this.transitionTo('bumper_bands');
          }
        } else if (state.bossIndex === 2) {
          // Hole Punch: 2000ms animation then puzzle
          // Holes applied at the 1200ms mark (800ms remaining), not immediately
          state.holePunchAttackTimer = 2000;
          state.holePunchAnimPhase = 0;
          state.holePunchShuffleCount = 0;
          state.bossAttackName = 'HOLE PUNCH!';
          this.transitionTo('hole_punch_attack');
        } else {
          this.transitionTo('puzzle');
        }
        break;

      case 'testing_select':
        break;

      case 'primary_target':
        state.primaryTargetTimer = Math.max(0, state.primaryTargetTimer - dt);
        if (state.primaryTargetTimer <= 0) {
          this.transitionTo('puzzle');
        }
        break;

      case 'enemy_turn_announce': {
        state.enemyTurnAnnounceTimer = Math.max(0, state.enemyTurnAnnounceTimer - dt);
        if (state.enemyTurnAnnounceTimer <= 0) {
          this.executeBossAttack();
        }
        break;
      }

      case 'hole_punch_attack': {
        const prevTimer = state.holePunchAttackTimer;
        state.holePunchAttackTimer = Math.max(0, state.holePunchAttackTimer - dt);
        const cur = state.holePunchAttackTimer;

        // At 1200ms remaining (800ms elapsed): apply holes, set phase 1
        if (state.holePunchAnimPhase === 0 && cur <= 1200 && prevTimer > 1200) {
          state.holePunchAnimPhase = 1;
          state.rings[0].panels[4] = 'hole';
          state.rings[0].panels[5] = 'hole';
          state.rings[0].panels[6] = 'on_panel_holed';
          state.rings[0].panels[7] = 'hole';
          this.spawnFlash('boss', '#ffff00');
        }
        // At 800ms remaining: first shuffle, phase 2
        if (state.holePunchAnimPhase === 1 && cur <= 800 && prevTimer > 800) {
          state.holePunchAnimPhase = 2;
          state.holePunchShuffleCount = 1;
          const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
          const steps = 2 + Math.floor(Math.random() * 4);
          for (let i = 0; i < steps; i++) rotateRing(state.rings[0], dir);
        }
        // At 400ms remaining: second shuffle
        if (state.holePunchAnimPhase === 2 && cur <= 400 && prevTimer > 400) {
          state.holePunchAnimPhase = 3;
          state.holePunchShuffleCount = 2;
          const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
          const steps = 2 + Math.floor(Math.random() * 4);
          for (let i = 0; i < steps; i++) rotateRing(state.rings[0], dir);
        }

        if (cur <= 0) {
          state.bossAttackName = '';
          state.holePunchAnimPhase = 3;
          this.transitionTo('puzzle');
        }
        break;
      }

      case 'main_squeeze': {
        const SQUEEZE_BLOCK_START = 0.6; // last 40% of timer = block window
        const totalTime = 2500;
        const elapsed = totalTime - state.mainSqueezeTimer;
        const frac = elapsed / totalTime; // 0 at start, 1 at end
        state.mainSqueezeTimer = Math.max(0, state.mainSqueezeTimer - dt);

        // Open block window during last 40%
        if (frac >= SQUEEZE_BLOCK_START && !state.blockWindowOpen) {
          state.blockWindowOpen = true;
        }

        if (state.mainSqueezeTimer <= 0) {
          state.blockWindowOpen = false;
          if (!state.playerBlocked) {
            // Apply damage based on ring
            const ring = state.marioFinalRing;
            const ranges: [number, number][] = [[15, 19], [14, 18], [13, 17], [12, 18]];
            const [minD, maxD] = ranges[Math.min(3, ring)];
            let rawDmg = minD + Math.floor(Math.random() * (maxD - minD + 1));
            rawDmg = this.applyGuardReduction(rawDmg);
            state.playerHp = Math.max(0, state.playerHp - rawDmg);
            const mp = this.marioScreenPos();
            state.damageNumbers.push({
              value: rawDmg, x: mp.x, y: mp.y - 20, alpha: 1, vy: -2.5,
              color: '#ff4444', scale: 1.5, label: `SQUEEEZE! -${rawDmg}`, effectType: 'damage',
            });
            this.spawnFlash('player', '#ff2200');
            state.lastBossDamage = rawDmg;
            if (state.playerHp <= 0) {
              this.transitionTo('game_over');
              break;
            }
          } else {
            state.damageNumbers.push({
              value: 0, label: 'BLOCKED!',
              x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2, color: '#44ddff', scale: 1.3,
            });
          }
          this.transitionTo('setup');
        }
        break;
      }

      case 'gettin_down': {
        const GETDOWN_BLOCK_START = 0.6;
        const totalTime = 2000;
        const elapsed = totalTime - state.gettinDownTimer;
        const frac = elapsed / totalTime;
        state.gettinDownTimer = Math.max(0, state.gettinDownTimer - dt);

        if (frac >= GETDOWN_BLOCK_START && !state.blockWindowOpen) {
          state.blockWindowOpen = true;
        }

        if (state.gettinDownTimer <= 0) {
          state.blockWindowOpen = false;
          if (!state.playerBlocked) {
            const ring = state.marioFinalRing;
            let rawDmg: number;
            if (ring === 2) {
              rawDmg = 9 + Math.floor(Math.random() * 3); // 9-11
            } else {
              rawDmg = 6 + Math.floor(Math.random() * 3); // 6-8
            }
            rawDmg = this.applyGuardReduction(rawDmg);
            state.playerHp = Math.max(0, state.playerHp - rawDmg);
            const mp = this.marioScreenPos();
            state.damageNumbers.push({
              value: rawDmg, x: mp.x, y: mp.y - 20, alpha: 1, vy: -2.5,
              color: '#ff8800', scale: 1.4, label: `GETTIN' DOWN! -${rawDmg}`, effectType: 'damage',
            });
            this.spawnFlash('player', '#ff4400');
            state.lastBossDamage = rawDmg;
            if (state.playerHp <= 0) {
              this.transitionTo('game_over');
              break;
            }
          } else {
            state.damageNumbers.push({
              value: 0, label: 'BLOCKED!',
              x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2, color: '#44ddff', scale: 1.3,
            });
          }
          this.transitionTo('setup');
        }
        break;
      }

      case 'hole_punch_inner': {
        const INNER_BLOCK_START = 0.6;
        const totalTime = 3000;
        const elapsed = totalTime - state.holePunchInnerTimer;
        const frac = elapsed / totalTime;
        state.holePunchInnerTimer = Math.max(0, state.holePunchInnerTimer - dt);

        if (frac >= INNER_BLOCK_START && !state.blockWindowOpen) {
          state.blockWindowOpen = true;
        }

        if (state.holePunchInnerTimer <= 0) {
          state.blockWindowOpen = false;
          // HP hole punch effect: decrement max HP; Hole Punch gains a punch
          state.marioPartsHolePunched++;
          state.holePunchPunchCount++; // Hole Punch acquires a Mario punch to use later
          // Compute HP accessory bonus
          const hpFromHeartPlus = (state.accessories.heartPlus ? 5 : 0)
            + (state.accessories.silverHeartPlus ? 10 : 0)
            + (state.accessories.goldHeartPlus ? 15 : 0)
            + state.maxUpHeartsBought * 20;
          const prevMax = state.playerMaxHp;
          state.playerMaxHp = Math.round(state.playerMaxHp / 2 + hpFromHeartPlus / 2);
          state.playerMaxHp = Math.max(10, state.playerMaxHp); // floor
          state.playerHp = Math.min(state.playerHp, state.playerMaxHp);
          state.damageNumbers.push({
            value: prevMax - state.playerMaxHp, label: `MAX HP -${prevMax - state.playerMaxHp}!`,
            x: RING_CX, y: RING_CY - 70, alpha: 1, vy: -2, color: '#ff66ff', scale: 1.3,
          });
          // Base Slap damage
          if (!state.playerBlocked) {
            const ring = state.marioFinalRing;
            const [minD, maxD] = ring === 0 ? [15, 18] : [11, 14];
            let slapDmg = minD + Math.floor(Math.random() * (maxD - minD + 1));
            slapDmg = this.applyGuardReduction(slapDmg);
            state.playerHp = Math.max(0, state.playerHp - slapDmg);
            const mp = this.marioScreenPos();
            state.damageNumbers.push({
              value: slapDmg, x: mp.x, y: mp.y - 20, alpha: 1, vy: -2.5,
              color: '#ff4444', scale: 1.5, label: `BASE SLAP! -${slapDmg}`, effectType: 'damage',
            });
            this.spawnFlash('player', '#ff0000');
            state.lastBossDamage = slapDmg;
            if (state.playerHp <= 0) {
              this.transitionTo('game_over');
              break;
            }
          } else {
            state.damageNumbers.push({
              value: 0, label: 'BLOCKED SLAP!',
              x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2, color: '#44ddff', scale: 1.3,
            });
          }
          this.transitionTo('setup');
        }
        break;
      }

      case 'throwing_punches': {
        const THROW_TRAVEL = 900;    // ms per punch projectile
        const THROW_BLOCK_START = 0.35;
        const THROW_BLOCK_END = 0.75;
        const THROW_DELAY = 600;     // ms between punches
        const isBoardPunchNow = state.throwingPunchesIdx < state.throwingPunchesBoardCount;

        if (state.throwingPunchesDelayTimer > 0) {
          state.throwingPunchesDelayTimer = Math.max(0, state.throwingPunchesDelayTimer - dt);
          if (state.throwingPunchesDelayTimer <= 0) {
            // Start next punch
            state.attackProjectileT = 0;
            state.blockWindowOpen = false;
            state.playerBlocked = false;
          }
          break;
        }

        state.attackProjectileT = Math.min(1, state.attackProjectileT + dt / THROW_TRAVEL);
        const frac = state.attackProjectileT;

        // Board punches (hole punches) are unblockable — only Mario punches have a block window
        if (!isBoardPunchNow) {
          if (frac >= THROW_BLOCK_START && frac <= THROW_BLOCK_END && !state.blockWindowOpen) {
            state.blockWindowOpen = true;
          }
          if (frac > THROW_BLOCK_END && state.blockWindowOpen) {
            state.blockWindowOpen = false;
          }
        }

        if (state.attackProjectileT >= 1) {
          state.blockWindowOpen = false;
          const isBoardPunch = state.throwingPunchesIdx < state.throwingPunchesBoardCount;
          if (!state.playerBlocked) {
            let dmg: number;
            if (isBoardPunch) {
              dmg = 3; // unblockable, no guard reduction
            } else {
              dmg = 4 + Math.floor(Math.random() * 3); // 4-6
              dmg = this.applyGuardReduction(dmg);
            }
            state.playerHp = Math.max(0, state.playerHp - dmg);
            const mp = this.marioScreenPos();
            state.damageNumbers.push({
              value: dmg, x: mp.x, y: mp.y - 20, alpha: 1, vy: -2.5,
              color: isBoardPunch ? '#ff8800' : '#ff4444',
              scale: 1.4,
              label: isBoardPunch ? `HOLE PUNCH! -${dmg}` : `PUNCH! -${dmg}`,
              effectType: 'damage',
            });
            this.spawnFlash('player', isBoardPunch ? '#ff6600' : '#ff0000');
            state.lastBossDamage = dmg;
            if (state.playerHp <= 0) {
              this.transitionTo('game_over');
              break;
            }
          } else {
            state.damageNumbers.push({
              value: 0, label: 'BLOCKED!',
              x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2, color: '#44ddff', scale: 1.3,
            });
          }

          state.throwingPunchesIdx++;

          if (state.throwingPunchesIdx >= state.throwingPunchesTotal) {
            // All punches thrown — restore board + place Mario punches as coins
            const r0 = state.rings[0].panels;
            // Restore all board holes (any slot that was punched)
            for (let s = 0; s < 12; s++) {
              if (r0[s] === 'hole') r0[s] = 'empty';
              if (r0[s] === 'on_panel_holed') r0[s] = 'on_panel';
            }
            // Place Mario punches as coin panels on random outer ring slots
            const marioPunchCount = state.holePunchPunchCount;
            if (marioPunchCount > 0) {
              const candidates: Array<[number, number]> = [];
              for (const r of [2, 3]) {
                for (let c = 0; c < 12; c++) {
                  if (state.rings[r].panels[c] === 'empty') candidates.push([r, c]);
                }
              }
              // shuffle candidates
              for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
              }
              const toPlace = Math.min(marioPunchCount, candidates.length);
              for (let i = 0; i < toPlace; i++) {
                const [r, c] = candidates[i];
                state.rings[r].panels[c] = 'coin';
              }
            }
            state.holePunchPunchCount = 0;
            this.transitionTo('setup');
          } else {
            state.throwingPunchesDelayTimer = THROW_DELAY;
          }
        }
        break;
      }

      case 'bumper_bands': {
        state.pullbackTimer = Math.max(0, state.pullbackTimer - dt);
        if (state.pullbackTimer <= 0) {
          state.bossAttackName = '';
          this.transitionTo('puzzle');
        }
        break;
      }

      case 'rubber_bind': {
        const BIND_TRAVEL = 900;
        const BIND_BLOCK_START = 0.28;
        const BIND_BLOCK_END = 0.65;
        const BIND_DELAY = 900;

        if (state.rubberBindDelayTimer > 0) {
          state.rubberBindDelayTimer = Math.max(0, state.rubberBindDelayTimer - dt);
          if (state.rubberBindDelayTimer <= 0) {
            state.rubberBindBandIndex++;
            if (state.rubberBindBandIndex >= 3) {
              state.pullbackTimer = 1200;
              state.bossAttackName = 'PULLBACK!';
              this.transitionTo('pullback');
            } else {
              state.attackProjectileT = 0;
              state.playerBlocked = false;
              state.blockWindowOpen = false;
            }
          }
          break;
        }

        state.attackProjectileT = Math.min(1, state.attackProjectileT + dt / BIND_TRAVEL);

        if (!state.marioTied && state.attackProjectileT >= BIND_BLOCK_START && state.attackProjectileT < BIND_BLOCK_END) {
          state.blockWindowOpen = true;
        } else {
          state.blockWindowOpen = false;
        }

        if (state.attackProjectileT >= 1) {
          state.blockWindowOpen = false;
          if (state.playerBlocked) {
            this.spawnFlash('player', '#44aaff');
          } else {
            if (!state.marioTied) {
              state.marioTied = true;
              state.rubberBindPermanentDmg += 3;
            }
            const bindDmgTable: number[] = [8, 7, 7, 6];
            const rawDmg = bindDmgTable[Math.min(3, state.marioFinalRing)];
            const actualDmg = this.applyGuardReduction(rawDmg);
            state.playerHp = Math.max(0, state.playerHp - actualDmg);
            state.lastBossDamage = actualDmg;
            const gapRad = (1.5 * Math.PI) / 180;
            const arcSpan = (2 * Math.PI) / 12;
            const startAngle = (state.marioFinalSlot / 12) * Math.PI * 2 - Math.PI / 2 + gapRad / 2;
            const midAngle = startAngle + (arcSpan - gapRad) / 2;
            const midR = BOSS_RADIUS + (state.marioFinalRing + 0.5) * RING_WIDTH;
            const mpx = RING_CX + Math.cos(midAngle) * midR;
            const mpy = RING_CY + Math.sin(midAngle) * midR;
            state.damageNumbers.push({
              value: actualDmg, x: mpx, y: mpy - 30,
              alpha: 1, vy: -2, color: '#ff4444', scale: 1.4,
              label: 'TIED!', effectType: 'damage',
            });
            this.spawnFlash('player', '#ff4400');
            if (state.playerHp <= 0) {
              this.transitionTo('game_over');
              break;
            }
          }
          state.rubberBindDelayTimer = BIND_DELAY;
        }
        break;
      }

      case 'snapback': {
        const SNAPBACK_TRAVEL = 1600; // ms for boss to approach
        const SNAPBACK_BLOCK_START = 0.35;
        const SNAPBACK_BLOCK_END = 0.7;
        state.snapbackT = Math.min(1, state.snapbackT + dt / SNAPBACK_TRAVEL);

        if (state.snapbackT >= SNAPBACK_BLOCK_START && state.snapbackT < SNAPBACK_BLOCK_END) {
          state.blockWindowOpen = true;
        } else {
          state.blockWindowOpen = false;
        }

        if (state.snapbackT >= 1) {
          state.blockWindowOpen = false;
          const rawDmg = 16;
          const actualDmg = state.snapbackBlocked ? this.applyGuardReduction(8) : this.applyGuardReduction(rawDmg);
          state.playerHp = Math.max(0, state.playerHp - actualDmg);
          state.lastBossDamage = actualDmg;
          const mp = this.marioScreenPos();
          state.damageNumbers.push({
            value: actualDmg, x: mp.x, y: mp.y - 30,
            alpha: 1, vy: -2.5, color: '#ff4444', scale: 1.5,
            label: state.snapbackBlocked ? `BLOCKED! -${actualDmg}` : `SNAPBACK! -${actualDmg}`,
            effectType: 'damage',
          });
          this.spawnFlash('player', state.snapbackBlocked ? '#44aaff' : '#ff4400');
          state.bossAttackName = '';
          if (state.playerHp <= 0) {
            this.transitionTo('game_over');
          } else {
            // Snapback doesn't deplete rubber bands — go straight to pullback
            state.pullbackTimer = 1200;
            state.bossAttackName = 'PULLBACK!';
            this.transitionTo('pullback');
          }
        }
        break;
      }

      case 'trapped_snapback': {
        state.trappedSnapbackTimer = Math.max(0, state.trappedSnapbackTimer - dt);
        if (state.trappedSnapbackTimer <= 0) {
          const snapRanges: [number, number][] = [[20, 25], [16, 21], [14, 19], [12, 17]];
          const [minDmg, maxDmg] = snapRanges[Math.min(3, state.marioFinalRing)];
          const rawDmg = minDmg + Math.floor(Math.random() * (maxDmg - minDmg + 1));
          const actualDmg = rawDmg; // unblockable, no guard reduction
          state.playerHp = Math.max(0, state.playerHp - actualDmg);
          state.lastBossDamage = actualDmg;
          const gapRad = (1.5 * Math.PI) / 180;
          const arcSpan = (2 * Math.PI) / 12;
          const startAngle = (state.marioFinalSlot / 12) * Math.PI * 2 - Math.PI / 2 + gapRad / 2;
          const midAngle = startAngle + (arcSpan - gapRad) / 2;
          const midR = BOSS_RADIUS + (state.marioFinalRing + 0.5) * RING_WIDTH;
          const mpx = RING_CX + Math.cos(midAngle) * midR;
          const mpy = RING_CY + Math.sin(midAngle) * midR;
          state.damageNumbers.push({
            value: actualDmg, x: mpx, y: mpy - 30,
            alpha: 1, vy: -3, color: '#ff2200', scale: 2.0,
            label: 'SNAPBACK!', effectType: 'damage',
          });
          this.spawnFlash('player', '#ff0000');
          state.marioTied = false;
          state.bossAttackName = '';
          if (state.playerHp <= 0) {
            this.transitionTo('game_over');
          } else {
            state.pullbackTimer = 1200;
            state.bossAttackName = 'PULLBACK!';
            this.transitionTo('pullback');
          }
        }
        break;
      }

      case 'puzzle':
        state.puzzleTimer -= dt;
        if (state.puzzleTimer <= 0) {
          this.endPuzzlePhase();
        }
        break;

      case 'mario_walk': {
        const path = state.marioWalkPath;
        if (path.length === 0) {
          // No path at all — go straight to boss attack
          this.startEnemyTurn();
          break;
        }

        const step = path[state.marioWalkStep];
        const stepDuration = step.pauseMs > 0 ? step.pauseMs : 280; // 280ms per arrow step

        state.marioWalkTimer += dt;

        if (state.marioWalkTimer >= stepDuration) {
          // Boss 0: targeted panel check (3 unblockable damage)
          if (state.bossIndex === 0) {
            const isTargeted = state.targetedPanels.some(
              tp => tp.ring === step.ring && tp.slot === step.slot
            );
            if (isTargeted) {
              const targetDmg = this.applyGuardReduction(3);
              state.playerHp = Math.max(0, state.playerHp - targetDmg);
              state.targetedPanels = state.targetedPanels.filter(
                tp => !(tp.ring === step.ring && tp.slot === step.slot)
              );
              state.damageNumbers.push({
                value: targetDmg, x: RING_CX, y: RING_CY - 30,
                alpha: 1, vy: -2, color: '#ff4444', scale: 1.2,
                label: `TARGET! -${targetDmg}`, effectType: 'damage',
              });
              if (state.playerHp <= 0) {
                this.transitionTo('game_over');
                break;
              }
            }
          }

          // Hole fall-in (boss 2)
          if (step.panel === 'hole') {
            state.marioFinalRing = step.ring;
            state.marioFinalSlot = step.slot;
            state.damageNumbers.push({
              value: 0, label: 'FELL IN!',
              x: RING_CX, y: RING_CY - 50, alpha: 1, vy: -2.5, color: '#ff4444', scale: 1.8,
            });
            this.spawnFlash('player', '#ff0000');
            if (state.bossIndex === 2) {
              // Main Squeeze — boss 2 grabs Mario in a hole
              state.bossAttackName = 'MAIN SQUEEZE!';
              this.announceEnemyTurn('main_squeeze');
            } else {
              this.startEnemyTurn();
            }
            break;
          }

          // Apply step effects
          if (step.panel === 'heal') {
            state.playerHp = Math.min(state.playerMaxHp, state.playerHp + 20);
            state.damageNumbers.push({
              value: 20, x: RING_CX, y: RING_CY - 40, alpha: 1, vy: -2,
              color: '#44ff88', scale: 1.3, effectType: 'heal',
            });
          } else if (step.panel === 'plus_one') {
            state.marioAttackCount = 1; // no longer doubles damage
            state.attacksRemaining = 2; // gives a second attack choice
            state.damageNumbers.push({
              value: 0,
              label: '+1 ATTACK!',
              x: RING_CX,
              y: RING_CY - 40,
              alpha: 1,
              vy: -2,
              color: '#ff88ff',
              scale: 1.3,
            });
          } else if (step.panel === 'double_power') {
            state.marioDamageMult = 2;
            state.damageNumbers.push({
              value: 0,
              label: '×2 POWER!',
              x: RING_CX,
              y: RING_CY - 40,
              alpha: 1,
              vy: -2,
              color: '#ffdd00',
              scale: 1.3,
            });
          } else if (step.panel === 'action') {
            state.marioReachedAction = true;
          } else if (step.panel === 'on_panel') {
            state.magicCircleActive = true;
            state.damageNumbers.push({
              value: 0,
              label: 'MAGIC ON!',
              x: RING_CX,
              y: RING_CY - 40,
              alpha: 1,
              vy: -2,
              color: '#ffaa00',
              scale: 1.3,
            });
          } else if (step.panel === 'magic_circle') {
            // Only reached if magicCircleActive (simulatePath stops here when active)
            state.marioReachedMagicCircle = true;
            state.magicCircleActive = false; // consumed — needs ON again next time
          } else if (step.panel === 'treasure_chest') {
            state.playerHp = Math.min(state.playerMaxHp, state.playerHp + 10);
            state.damageNumbers.push({
              value: 10, x: RING_CX - 20, y: RING_CY - 40, alpha: 1, vy: -2,
              color: '#44ff88', scale: 1.2, label: '+10', effectType: 'heal',
            });
            // Spawn a heal and a coin in upcoming empty steps
            let healSpawned = false;
            let coinSpawned = false;
            for (let i = state.marioWalkStep + 1; i < path.length && (!healSpawned || !coinSpawned); i++) {
              if (path[i].panel === 'empty') {
                if (!healSpawned) {
                  path[i] = { ...path[i], panel: 'heal', pauseMs: 600 };
                  healSpawned = true;
                } else if (!coinSpawned) {
                  path[i] = { ...path[i], panel: 'coin', pauseMs: 200 };
                  coinSpawned = true;
                }
              }
            }
          } else if (step.panel === 'coin') {
            state.coinBonus += 5;
            state.coins += 100;
            state.damageNumbers.push({
              value: 0,
              label: '+5 DMG',
              x: RING_CX + 20,
              y: RING_CY - 35,
              alpha: 1,
              vy: -2,
              color: '#ffdd00',
              scale: 1.1,
            });
          } else if (step.panel === 'envelope') {
            // Determine message based on game state
            let msg = '';
            if (state.bossIndex === 0) {
              if (state.noReloadMode) {
                msg = "You're almost done! Attack it to finish it off!";
              } else if (state.rainbowRollReady) {
                msg = "Be bold! Just grab those pencils head-on with the 1,000-Fold Arms. If it attacks, stay calm and guard!";
              } else if (state.bossStunned) {
                msg = "When it runs out of missiles, that's your chance! Attack inside the case, but don't get TOO close!";
              } else {
                msg = "Avoid the targeted panels, sneak behind the case, then whack the lid with your hammer!";
              }
            } else if (state.bossIndex === 1) {
              if (state.rubberBandSoloMode) {
                msg = "Watch the Rubber Band's movements carefully as you try to grab it! You'll have to time it juuust right...";
              } else if (state.rubberBandArmsUsed) {
                msg = "Get close to the enemy before using the 1,000-Fold Arms. The closer you are, the more bands you'll grab. Yank those rubber bands back as far as you can, then let 'em fly!";
              } else if (state.rubberBandNormalAttackUsed) {
                msg = "Normal attacks have no effect on this Rubber Band. Use your 1,000-Fold Arms to yank at it instead!";
              } else {
                msg = "Be bold! Try bumping against one of those rubber-band panels!";
              }
            }
            if (msg) {
              state.envelopeMessage = msg;
              state.envelopeTimer = 5000;
            }
          }

          // Advance to next step
          state.marioWalkStep++;
          state.marioWalkTimer = 0;

          if (state.marioWalkStep >= path.length) {
            // Record final position for jump/hammer attacks
            const lastStep = path[path.length - 1];
            state.marioFinalRing = lastStep ? lastStep.ring : 3;
            state.marioFinalSlot = lastStep ? lastStep.slot : state.marioSlot;

            if (state.bossIndex === 0 && state.marioReachedMagicCircle && state.rainbowRollReady) {
              // Rainbow Roll intercept
              state.rainbowRollReady = false;
              const sign = Math.random() < 0.5 ? 1 : -1;
              state.pencilGrabHandsPos = sign * (2 + Math.floor(Math.random() * 2));
              state.pencilGrabGripped = false;
              state.pencilGrabMode = 'rainbow';
              this.transitionTo('pencil_grab');
            } else if (state.bossIndex === 0 && state.marioReachedMagicCircle && !state.bossStunned) {
              // 1000-fold arms to close the pencil case (from magic circle)
              const sign = Math.random() < 0.5 ? 1 : -1;
              state.pencilGrabHandsPos = sign * (1 + Math.floor(Math.random() * 3));
              state.pencilGrabGripped = false;
              state.pencilGrabMode = 'case_close';
              state.bossAttackName = '1000-FOLD ARMS!';
              this.transitionTo('pencil_grab');
            } else if (state.bossIndex === 0) {
              state.pencilCutsceneTimer = 4000;
              state.bossAttackName = 'PENCILS FIRE!';
              this.transitionTo('pencil_cutscene');
            } else if (state.marioReachedMagicCircle && state.bossIndex === 1 && state.rubberBandSoloMode) {
              // Solo phase: Mario reached the magic circle needed to grab the band
              state.bossAttackName = 'GRAB THE BAND!';
              this.transitionTo('solo_grab_attempt');
            } else if (state.marioReachedMagicCircle && state.bossIndex === 1) {
              // Boss 1 first phase: 1000-fold arms grab mechanic
              const sign = Math.random() < 0.5 ? 1 : -1;
              state.armsGrabHandsPos = sign * (1 + Math.floor(Math.random() * 3));
              state.armsGrabGripped = false;
              state.armsPullHeld = false;
              state.armsPullT = 0;
              state.armsPullDamageDealt = false;
              state.bossAttackName = '1000-FOLD ARMS!';
              this.transitionTo('arms_grab');
            } else if (state.marioReachedMagicCircle) {
              // Start mash attack (other bosses)
              state.mashTimer = 5000;
              state.mashDamageTotal = 0;
              state.bossAttackName = '1000-FOLD ARMS!';
              this.transitionTo('mario_mash');
            } else if (state.marioReachedAction) {
              // Track boss 1 normal attack (reached action but not magic circle)
              if (state.bossIndex === 1 && !state.marioReachedMagicCircle) {
                state.rubberBandNormalAttackUsed = true;
              }
              state.attackChoice = 'pending';
              this.transitionTo('attack_choice');
            } else if (state.bossIndex === 1 && state.rubberBandSoloMode) {
              // Solo mode: Mario didn't reach magic circle — Rubber Band attacks
              this.startEnemyTurn();
            } else {
              // No action — go to boss attack with 0 player damage dealt
              if (state.boss.special === 'tape' && state.turnNumber % 2 === 0) {
                this.bossSpecialPending = true;
              }
              if (state.boss.special === 'origami_king' || state.boss.special === 'scissors') {
                this.bossSpecialPending = true;
              }
              this.startEnemyTurn();
            }
          }
        }
        break;
      }

      case 'arms_grab': {
        if (state.armsGrabGripped) {
          const PULL_RATE = 0.4; // 0..1 over ~2.5 seconds of holding
          if (state.armsPullHeld) {
            state.armsPullT = Math.min(1, state.armsPullT + dt * PULL_RATE / 1000);
          } else if (state.armsPullT > 0 && !state.armsPullDamageDealt) {
            // Released — deal damage based on pull amount and Mario's ring
            state.armsPullDamageDealt = true;
            // Track for envelope messages
            if (state.bossIndex === 1) state.rubberBandArmsUsed = true;
            const inRange = state.marioFinalRing <= 1;
            let rawDmg: number;
            if (inRange) {
              rawDmg = 20 + Math.round(state.armsPullT * 20); // 20-40 based on pull
            } else {
              rawDmg = 1; // outer rings — minimal damage
            }
            const dmg = rawDmg;
            // Permanent damage (not restored by pullback)
            state.rubberBindPermanentDmg += dmg;
            state.boss.hp = Math.max(0, state.boss.hp - dmg);
            state.lastDamageDealt = dmg;
            state.damageNumbers.push({
              value: dmg, x: RING_CX, y: RING_CY - 60, alpha: 1, vy: -2.5,
              color: inRange ? '#ff4444' : '#ffaa44', scale: 1.5,
              label: inRange ? `YANK! -${dmg}` : `WEAK! -${dmg}`, effectType: 'damage',
            });
            this.spawnFlash('boss', '#ff4400');
            state.armsPullT = 0;
            // Arms kill check — permanent solo mode
            if (state.bossIndex === 1 && !state.rubberBandSoloMode && state.boss.hp <= 0) {
              state.rubberBandSoloMode = true;
              state.boss.hp = 1;
              state.soloBootsHammerRestoreHp = 0; // arms kill — no restore
            }
            // Done — go to pullback
            state.pullbackTimer = 1200;
            state.bossAttackName = 'PULLBACK!';
            this.transitionTo('pullback');
          }
        }
        break;
      }

      case 'attack_choice':
        // Waiting for player to press J or H
        break;

      case 'mario_jump': {
        const JUMP_DURATION = 1200;
        state.attackAnimT = Math.min(1, state.attackAnimT + dt / JUMP_DURATION);
        if (state.attackAnimT >= 1.0) {
          // Apply damage (quality already set when Space was pressed)
          this.applyFinalDamage('jump', state.attackQuality === 'excellent');
        }
        break;
      }

      case 'mario_hammer': {
        const HAMMER_DURATION = 1800;
        if (!state.attackTimingPressed) {
          state.attackAnimT = Math.min(1, state.attackAnimT + dt / HAMMER_DURATION);
          if (state.attackAnimT >= 1.0) {
            // Auto-apply normal damage (player was too slow or missed)
            state.attackTimingPressed = true;
            state.attackQuality = 'none';
            this.applyFinalDamage('hammer', false);
          }
        }
        break;
      }

      case 'mario_mash': {
        state.mashCooldown = Math.max(0, state.mashCooldown - dt);
        state.mashTimer = Math.max(0, state.mashTimer - dt);
        if (state.mashTimer <= 0) {
          state.lastDamageDealt = state.mashDamageTotal + state.coinBonus;

          if (state.boss.hp <= 0) {
            this.handleBossDefeated();
            break;
          }

          if (state.boss.special === 'tape' && state.turnNumber % 2 === 0) {
            this.bossSpecialPending = true;
          }
          if (state.boss.special === 'origami_king' || state.boss.special === 'scissors') {
            this.bossSpecialPending = true;
          }
          this.startEnemyTurn();
        }
        break;
      }

      case 'boss_attack': {
        const TRAVEL_MS = 2200;
        const BLOCK_START = 0.62;  // T > 0.62 = block window opens
        const BLOCK_END   = 0.88;  // T > 0.88 = too late
        const IMPACT_T    = 1.0;

        state.attackProjectileT = Math.min(IMPACT_T, state.attackProjectileT + dt / TRAVEL_MS);

        // Open block window
        if (state.attackProjectileT >= BLOCK_START && state.attackProjectileT < BLOCK_END) {
          state.blockWindowOpen = true;
        } else if (state.attackProjectileT >= BLOCK_END) {
          state.blockWindowOpen = false; // window closed
        }

        // Impact
        if (state.attackProjectileT >= IMPACT_T) {
          const bossDmg = state.boss.attack;
          let actualDmg = state.playerBlocked ? Math.max(0, Math.floor(bossDmg / 2)) : bossDmg;
          actualDmg = this.applyGuardReduction(actualDmg);
          state.playerHp = Math.max(0, state.playerHp - actualDmg);
          state.lastBossDamage = actualDmg;

          // Spawn damage number
          const marioPos = this.marioScreenPos();
          state.damageNumbers.push({
            value: actualDmg, x: marioPos.x, y: marioPos.y - 30,
            alpha: 1, vy: -2, color: state.playerBlocked ? '#44ffaa' : '#ff4444',
            scale: 1.3, label: state.playerBlocked ? 'BLOCKED!' : undefined,
            effectType: 'damage',
          });
          this.spawnFlash('player', state.playerBlocked ? '#44ff88' : '#ff0000');

          // Specials
          if (state.boss.special === 'tape' && state.turnNumber % 2 === 0) {
            this.bossSpecialPending = true;
          }
          if (state.boss.special === 'origami_king' || state.boss.special === 'scissors') {
            this.bossSpecialPending = true;
          }

          // Transition
          if (state.playerHp <= 0) {
            this.transitionTo('game_over');
          } else {
            if (this.bossSpecialPending) {
              if (state.boss.special === 'tape') applyHolePunchSpecial(state.rings);
              if (state.boss.special === 'origami_king' || state.boss.special === 'scissors') applyOrigamiKingSpecial(state.rings);
              this.bossSpecialPending = false;
            }
            this.transitionTo('setup');
          }
          break;
        }
        break;
      }

      case 'pencil_cutscene': {
        state.pencilCutsceneTimer = Math.max(0, state.pencilCutsceneTimer - dt);
        if (state.pencilCutsceneTimer <= 0) {
          if (state.bossStunned) {
            // Explosion cutscene done — open empty case, Mario attacks again
            state.pencilCaseClosed = false;
            state.attackChoice = 'pending';
            this.transitionTo('attack_choice');
          } else {
            // Normal post-walk cutscene: remove targeted pencils
            for (const idx of state.pencilsTargetIndices) {
              state.pencilsAlive[idx] = false;
            }
            state.targetedPanels = [];
            if (state.marioReachedAction) {
              state.attackChoice = 'pending';
              this.transitionTo('attack_choice');
            } else if (state.rainbowRollReady) {
              this.startRainbowRollAttack();
            } else {
              this.startPencilRain();
            }
          }
        }
        break;
      }

      case 'pencil_rain': {
        // Sequential per-pencil: each pencil gets its own 1000ms projectile window
        if (state.pencilRainCount === 0) {
          this.startBossReload();
          break;
        }
        const PENCIL_TRAVEL_MS = 1400;
        const PR_BLOCK_START = 0.5;
        const PR_BLOCK_END = 0.85;
        state.attackProjectileT = Math.min(1, state.attackProjectileT + dt / PENCIL_TRAVEL_MS);

        if (state.attackProjectileT >= PR_BLOCK_START && state.attackProjectileT < PR_BLOCK_END) {
          state.blockWindowOpen = true;
        } else if (state.attackProjectileT >= PR_BLOCK_END) {
          state.blockWindowOpen = false;
        }

        if (state.attackProjectileT >= 1.0) {
          if (state.playerBlocked) {
            state.pencilRainBlockedCount++;
          } else {
            // This pencil hits
            const pencilDmg = this.applyGuardReduction(3);
            state.playerHp = Math.max(0, state.playerHp - pencilDmg);
            state.lastBossDamage = pencilDmg;
            const marioPos = this.marioScreenPos();
            state.damageNumbers.push({
              value: pencilDmg, x: marioPos.x + (Math.random() - 0.5) * 30,
              y: marioPos.y - 20 - state.pencilRainIdx * 12,
              alpha: 1, vy: -1.5, color: '#ff4444', scale: 1.1, effectType: 'damage',
            });
            this.spawnFlash('player', '#ff0000');
            if (state.playerHp <= 0) {
              this.transitionTo('game_over');
              break;
            }
          }
          state.pencilRainIdx++;
          if (state.pencilRainIdx >= state.pencilRainCount) {
            // All pencils fired
            state.pencilsAlive = new Array(12).fill(false);
            this.startBossReload();
          } else {
            // Next pencil
            state.attackProjectileT = 0;
            state.playerBlocked = false;
            state.blockWindowOpen = false;
          }
        }
        break;
      }

      case 'snap_shut': {
        const SNAP_TRAVEL_MS = 1000;
        state.attackProjectileT = Math.min(1, state.attackProjectileT + dt / SNAP_TRAVEL_MS);
        if (state.attackProjectileT >= 1.0) {
          const raw = state.marioFinalRing === 0 ? 17 : state.marioFinalRing === 1 ? 13 : 0;
          const snapDmg = this.applyGuardReduction(raw);
          state.lastBossDamage = snapDmg;
          if (snapDmg > 0) {
            state.playerHp = Math.max(0, state.playerHp - snapDmg);
            const marioPos = this.marioScreenPos();
            state.damageNumbers.push({
              value: snapDmg, x: marioPos.x, y: marioPos.y - 30,
              alpha: 1, vy: -2, color: '#ff8800', scale: 1.4, effectType: 'damage',
            });
            this.spawnFlash('player', '#ff8800');
          }
          if (state.playerHp <= 0) {
            this.transitionTo('game_over');
          } else {
            this.startBossReload();
          }
        }
        break;
      }

      case 'boss_reload': {
        state.primaryTargetTimer = Math.max(0, state.primaryTargetTimer - dt);
        if (state.primaryTargetTimer <= 0) {
          this.transitionTo('setup');
        }
        break;
      }

      case 'pencil_grab':
      case 'save_prompt':
        // Nothing auto-happens, wait for player input
        break;

      case 'rainbow_smash': {
        state.rainbowSmashCooldown = Math.max(0, state.rainbowSmashCooldown - dt);
        state.rainbowSmashTimer = Math.max(0, state.rainbowSmashTimer - dt);
        if (state.rainbowSmashTimer <= 0) {
          if (state.boss.hp <= 0) {
            this.handleBossDefeated();
          } else {
            // Rainbow Roll survived — boss now weakened, only "Worse Case" attacks
            state.noReloadMode = true;
            state.boss.attack = 2;
            this.transitionTo('setup');
          }
        }
        break;
      }

      case 'pullback': {
        state.pullbackTimer = Math.max(0, state.pullbackTimer - dt);
        if (state.pullbackTimer <= 0) {
          if (state.rubberBandSoloMode) {
            // Keep HP at 1 — solo sequence requires a new magic circle next puzzle
            state.boss.hp = 1;
          } else {
            state.boss.hp = Math.max(0, state.rubberBandCount * state.rubberBandHpPerBand - state.rubberBindPermanentDmg);
          }
          state.bossAttackName = '';
          this.transitionTo('setup');
        }
        break;
      }

      case 'rainbow_roll_attack': {
        const RRTRAVEL = 2800;
        const RR_BLOCK_START = 0.55;
        const RR_BLOCK_END = 0.85;
        state.rainbowRollAttackT = Math.min(1, state.rainbowRollAttackT + dt / RRTRAVEL);
        if (state.rainbowRollAttackT >= RR_BLOCK_START && state.rainbowRollAttackT < RR_BLOCK_END) {
          state.blockWindowOpen = true;
        } else if (state.rainbowRollAttackT >= RR_BLOCK_END) {
          state.blockWindowOpen = false;
        }
        if (state.rainbowRollAttackT >= 1) {
          const baseDmg = state.pencilRainCount * 4;
          const rawDmg = state.playerBlocked ? Math.ceil(baseDmg / 2) : baseDmg;
          const actualDmg = this.applyGuardReduction(rawDmg);
          state.playerHp = Math.max(0, state.playerHp - actualDmg);
          state.lastBossDamage = actualDmg;
          // rainbowRollReady stays true — rolls every turn until Mario uses magic circle
          const marioPos = this.marioScreenPos();
          state.damageNumbers.push({
            value: actualDmg, x: marioPos.x, y: marioPos.y - 30,
            alpha: 1, vy: -2, color: state.playerBlocked ? '#44ffaa' : '#ff4444',
            scale: 1.6, label: state.playerBlocked ? `BLOCKED! -${actualDmg}` : `RAINBOW ROLL! -${actualDmg}`,
            effectType: 'damage',
          });
          this.spawnFlash('player', state.playerBlocked ? '#44ff88' : '#ff0000');
          if (state.playerHp <= 0) {
            this.transitionTo('game_over');
          } else {
            this.transitionTo('setup');
          }
        }
        break;
      }

      case 'solo_snapback_charge': {
        state.soloSnapbackChargeTimer = Math.max(0, state.soloSnapbackChargeTimer - dt);
        if (state.soloSnapbackChargeTimer <= 0) {
          // Reset grab state fresh for the upcoming magic circle encounter
          state.soloGrabAttempt = 0;
          state.soloGrabTimer = 0;
          state.soloGrabSubPhase = 'moving';
          state.soloGrabBandPos = 0;
          state.soloGrabGripped = false;
          state.soloGrabPauseTimer = 0;
          state.blockWindowOpen = false;
          state.playerBlocked = false;
          state.snapbackBlocked = false;
          state.bossAttackName = '';
          this.transitionTo('puzzle');
        }
        break;
      }

      case 'solo_grab_attempt': {
        if (state.soloGrabSubPhase === 'moving') {
          state.soloGrabTimer += dt;
          // 3 oscillation cycles in 3000ms
          state.soloGrabBandPos = Math.sin(state.soloGrabTimer * 0.00628) * 3;
          if (state.soloGrabTimer >= 3000) {
            state.soloGrabSubPhase = state.soloGrabAttempt === 0 ? 'paused_left' : 'paused_right';
            state.soloGrabBandPos = state.soloGrabAttempt === 0 ? -3 : 3;
            state.soloGrabPauseTimer = 1000;
          }
        } else {
          state.soloGrabPauseTimer = Math.max(0, state.soloGrabPauseTimer - dt);
          if (state.soloGrabGripped) {
            // Success — grip secured, go to slam
            state.soloSlamTimer = 5000;
            state.soloSlamCount = 0;
            state.soloSlamCooldown = 0;
            state.bossAttackName = 'SOLO SLAM!';
            this.transitionTo('solo_slam');
          } else if (state.soloGrabPauseTimer <= 0) {
            if (state.soloGrabAttempt === 0) {
              // First attempt failed — try second
              state.soloGrabAttempt = 1;
              state.soloGrabSubPhase = 'moving';
              state.soloGrabTimer = 0;
              state.soloGrabBandPos = 0;
              state.soloGrabHandsCursor = 0;
            } else {
              // Both attempts failed — strike then solo snapback attack
              const rawDmg = 21 + Math.floor(Math.random() * 2);
              const actualDmg = this.applyGuardReduction(rawDmg);
              state.playerHp = Math.max(0, state.playerHp - actualDmg);
              state.lastBossDamage = actualDmg;
              const mp = this.marioScreenPos();
              state.damageNumbers.push({
                value: actualDmg, x: mp.x, y: mp.y - 30,
                alpha: 1, vy: -2.5, color: '#ff4444', scale: 1.8,
                label: `BAND STRIKE! -${actualDmg}`, effectType: 'damage',
              });
              this.spawnFlash('player', '#ff0000');
              if (state.playerHp <= 0) {
                this.transitionTo('game_over');
                break;
              }
              state.soloSnapbackAttackT = 0;
              state.blockWindowOpen = false;
              state.playerBlocked = false;
              state.snapbackBlocked = false;
              state.bossAttackName = 'SOLO SNAPBACK!';
              this.transitionTo('solo_snapback_attack');
            }
          }
        }
        break;
      }

      case 'solo_snapback_attack': {
        const SOLO_TRAVEL = 1800;
        const SOLO_BLOCK_START = 0.35;
        const SOLO_BLOCK_END = 0.72;
        state.soloSnapbackAttackT = Math.min(1, state.soloSnapbackAttackT + dt / SOLO_TRAVEL);
        if (state.soloSnapbackAttackT >= SOLO_BLOCK_START && state.soloSnapbackAttackT < SOLO_BLOCK_END) {
          state.blockWindowOpen = true;
        } else {
          state.blockWindowOpen = false;
        }
        if (state.soloSnapbackAttackT >= 1) {
          state.blockWindowOpen = false;
          const snapRanges: [number, number][] = [[56, 61], [53, 58], [50, 55], [45, 50]];
          const [minDmg, maxDmg] = snapRanges[Math.min(3, state.marioFinalRing)];
          const rawFull = minDmg + Math.floor(Math.random() * (maxDmg - minDmg + 1));
          const rawDmg = state.snapbackBlocked ? Math.ceil(rawFull / 2) : rawFull;
          const actualDmg = this.applyGuardReduction(rawDmg);
          state.playerHp = Math.max(0, state.playerHp - actualDmg);
          state.lastBossDamage = actualDmg;
          const mp = this.marioScreenPos();
          state.damageNumbers.push({
            value: actualDmg, x: mp.x, y: mp.y - 30,
            alpha: 1, vy: -3, color: '#ff2200', scale: 2.2,
            label: state.snapbackBlocked ? `BLOCKED! -${actualDmg}` : `SOLO SNAPBACK! -${actualDmg}`,
            effectType: 'damage',
          });
          this.spawnFlash('player', state.snapbackBlocked ? '#44aaff' : '#ff0000');
          if (state.playerHp <= 0) {
            this.transitionTo('game_over');
          } else {
            this.startSoloSnapbackCycle();
          }
        }
        break;
      }

      case 'solo_slam': {
        state.soloSlamCooldown = Math.max(0, state.soloSlamCooldown - dt);
        state.soloSlamTimer = Math.max(0, state.soloSlamTimer - dt);
        if (state.soloSlamTimer <= 0) {
          state.soloPullHeld = false;
          state.soloPullT = 0;
          state.soloSlingshotLaunched = false;
          state.soloSlingshotT = 0;
          state.bossAttackName = 'SLINGSHOT!';
          this.transitionTo('solo_slingshot');
        }
        break;
      }

      case 'solo_slingshot': {
        if (state.soloSlingshotLaunched) {
          state.soloSlingshotT = Math.min(1, state.soloSlingshotT + dt / 1200);
          if (state.soloSlingshotT >= 1) {
            this.handleBossDefeated();
          }
        } else if (state.soloPullHeld) {
          state.soloPullT = Math.min(1, state.soloPullT + dt / 1500);
          if (state.soloPullT >= 1) {
            state.soloPullHeld = false;
            state.soloSlingshotLaunched = true;
          }
        }
        break;
      }

      case 'victory':
        this.updateConfetti(dt);
        break;

      case 'game_over':
        break;
    }
  }

  draw(): void {
    render(this.ctx, this.state, this.tick);
  }

  start(): void {
    const loop = (time: number) => {
      const dt = Math.min(time - this.lastTime, 100); // cap at 100ms
      this.lastTime = time;
      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame((t) => {
      this.lastTime = t;
      requestAnimationFrame(loop);
    });
  }
}
