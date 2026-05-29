export const BOSSES = [
    {
        id: 0,
        name: 'Colored Pencils',
        hp: 150,
        maxHp: 150,
        attack: 10,
        color: '#ff4466',
        panels: { action: 4, plus_one: 0, double_power: 0, arrow_up: 6, arrow_left: 6, arrow_right: 6, treasure_chest: 3, on_panel: 2, magic_circle: 1, arrow_down: 2, envelope: 1, empty: 17 },
    },
    {
        id: 1,
        name: 'Rubber Band',
        hp: 100,
        maxHp: 100,
        attack: 14,
        color: '#ff8800',
        panels: { action: 3, plus_one: 0, double_power: 0, arrow_up: 10, arrow_left: 2, arrow_right: 2, treasure_chest: 2, on_panel: 2, magic_circle: 1, arrow_down: 6, envelope: 1, empty: 19 },
    },
    {
        id: 2,
        name: 'Hole Punch',
        hp: 150,
        maxHp: 150,
        attack: 18,
        color: '#ffcc00',
        panels: { action: 3, plus_one: 0, double_power: 0, arrow_up: 6, arrow_left: 2, arrow_right: 2, treasure_chest: 3, on_panel: 2, magic_circle: 2, arrow_down: 2, envelope: 1, empty: 25 },
        special: 'hole_punch',
    },
    {
        id: 3,
        name: 'Tape',
        hp: 180,
        maxHp: 180,
        attack: 22,
        color: '#aa44cc',
        panels: { action: 3, plus_one: 0, double_power: 0, arrow_up: 6, arrow_left: 2, arrow_right: 2, treasure_chest: 2, on_panel: 2, magic_circle: 2, arrow_down: 2, envelope: 1, empty: 26 },
        special: 'tape',
    },
    {
        id: 4,
        name: 'Scissors',
        hp: 336,
        maxHp: 336,
        attack: 26,
        color: '#22cc55',
        panels: { action: 3, plus_one: 0, double_power: 0, arrow_up: 6, arrow_left: 2, arrow_right: 2, treasure_chest: 2, on_panel: 2, magic_circle: 3, arrow_down: 2, envelope: 1, empty: 25 },
        special: 'scissors',
    },
    {
        id: 5,
        name: 'Stapler',
        hp: 350,
        maxHp: 350,
        attack: 30,
        color: '#4466cc',
        panels: { action: 3, plus_one: 0, double_power: 0, arrow_up: 6, arrow_left: 2, arrow_right: 2, treasure_chest: 2, on_panel: 2, magic_circle: 3, arrow_down: 2, envelope: 1, empty: 25 },
        special: 'origami_king',
    },
];
// Colored Pencils — silver case with rainbow pencils sticking up
export function drawBoss0(ctx, cx, cy, radius, tick) {
    drawBoss0WithPencils(ctx, cx, cy, radius, tick, new Array(12).fill(true));
}
export function drawBoss0WithPencils(ctx, cx, cy, radius, tick, pencilsAlive, caseClosed = false) {
    const r = radius;
    ctx.save();
    // Case base — red when closed, grey otherwise
    const caseMain = caseClosed ? '#cc2222' : '#cccccc';
    const caseDark = caseClosed ? '#992222' : '#aaaaaa';
    const caseBorder = caseClosed ? '#ff4444' : '#777';
    ctx.fillStyle = caseMain;
    ctx.fillRect(cx - r * 0.68, cy - r * 0.05, r * 1.36, r * 0.44);
    ctx.fillStyle = caseDark;
    ctx.fillRect(cx - r * 0.68, cy + r * 0.35, r * 1.36, r * 0.08);
    ctx.strokeStyle = caseBorder;
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
        if (!pencilsAlive[i])
            continue;
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
    ctx.beginPath();
    ctx.arc(cx - r * 0.55, cy + r * 0.15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.55, cy + r * 0.15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    void tick;
}
// Rubber Band — orange coils wrapped around body, blue helmet
export function drawBoss1(ctx, cx, cy, radius, tick) {
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
    ctx.beginPath();
    ctx.arc(cx + sway - r * 0.6, cy + r * 0.05, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + sway + r * 0.6, cy + r * 0.05, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}
// Rubber Band Solo Form — single giant golden rubber band ring (thick stroke arc = safe torus)
export function drawBoss1Solo(ctx, cx, cy, radius, tick) {
    ctx.save();
    const r = radius;
    const pulse = 1 + 0.07 * Math.sin(tick * 0.004);
    const glow = 0.5 + 0.5 * Math.sin(tick * 0.006);
    // Outer radial glow
    const outerGrad = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.6);
    outerGrad.addColorStop(0, `rgba(255,160,0,${glow * 0.5})`);
    outerGrad.addColorStop(1, 'rgba(200,60,0,0)');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    ctx.fill();
    // Torus drawn as thick stroked arc (avoids destination-out compositing issues)
    const bandR = r * 0.68 * pulse;
    const bandThick = r * 0.44;
    // Shadow ring
    ctx.shadowColor = 'rgba(180,50,0,0.7)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(cx, cy, bandR, 0, Math.PI * 2);
    ctx.strokeStyle = '#aa4400';
    ctx.lineWidth = bandThick + 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Main orange body
    ctx.beginPath();
    ctx.arc(cx, cy, bandR, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = bandThick;
    ctx.stroke();
    // Gold sheen — top-left arc
    ctx.beginPath();
    ctx.arc(cx, cy, bandR, Math.PI * 1.1, Math.PI * 1.85);
    ctx.strokeStyle = `rgba(255,230,80,${0.55 + 0.35 * glow})`;
    ctx.lineWidth = bandThick * 0.5;
    ctx.stroke();
    // Bright top gleam
    ctx.beginPath();
    ctx.arc(cx, cy, bandR, Math.PI * 1.25, Math.PI * 1.62);
    ctx.strokeStyle = `rgba(255,255,190,${0.35 + 0.25 * glow})`;
    ctx.lineWidth = bandThick * 0.25;
    ctx.stroke();
    // Dark shadow bottom-right
    ctx.beginPath();
    ctx.arc(cx, cy, bandR, Math.PI * 0.1, Math.PI * 0.88);
    ctx.strokeStyle = 'rgba(130,40,0,0.5)';
    ctx.lineWidth = bandThick * 0.4;
    ctx.stroke();
    // Rotation stripe lines on the band surface
    const stripeAngle = tick * 0.0008;
    for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + stripeAngle;
        const inner = bandR - bandThick / 2 + 4;
        const outer = bandR + bandThick / 2 - 4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
        ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
        ctx.strokeStyle = 'rgba(110,35,0,0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    // Outer border
    ctx.beginPath();
    ctx.arc(cx, cy, bandR + bandThick / 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,130,0,${0.65 + 0.25 * glow})`;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Inner border
    ctx.beginPath();
    ctx.arc(cx, cy, bandR - bandThick / 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(170,55,0,0.65)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
    void tick;
}
// Hole Punch — yellow hole-punch machine with lever arm
export function drawBoss2(ctx, cx, cy, radius, tick) {
    ctx.save();
    const r = radius;
    const punchAnim = Math.abs(Math.sin(tick * 0.002)) * r * 0.18; // lever animates downward
    // Main yellow rectangular body (rounded corners)
    ctx.fillStyle = '#ffdd44';
    ctx.strokeStyle = '#cc9900';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(cx - r * 0.58, cy - r * 0.55, r * 1.16, r * 1.05, r * 0.1);
    ctx.fill();
    ctx.stroke();
    // Body shading (darker stripe on right)
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.roundRect(cx + r * 0.28, cy - r * 0.55, r * 0.3, r * 1.05, [0, r * 0.1, r * 0.1, 0]);
    ctx.fill();
    // Gray arm / lever on the left side
    const armTopX = cx - r * 0.55;
    const armTopY = cy - r * 0.38;
    const armBotX = cx - r * 0.1;
    const armBotY = cy + r * 0.2 + punchAnim;
    // Lever body
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = r * 0.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(armTopX, armTopY);
    ctx.lineTo(armBotX, armBotY);
    ctx.stroke();
    ctx.lineCap = 'butt';
    // Circular punch die at bottom of lever
    ctx.fillStyle = '#666666';
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(armBotX, armBotY + r * 0.08, r * 0.14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Dark rectangular punch slot at bottom
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.roundRect(cx - r * 0.45, cy + r * 0.38, r * 0.9, r * 0.13, 4);
    ctx.fill();
    // Eyes (dark circles on body)
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(cx + r * 0.1, cy - r * 0.2, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.38, cy - r * 0.2, r * 0.11, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx + r * 0.13, cy - r * 0.23, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.41, cy - r * 0.23, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // Angry eyebrows
    ctx.strokeStyle = '#884400';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.01, cy - r * 0.33);
    ctx.lineTo(cx + r * 0.19, cy - r * 0.29);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.29, cy - r * 0.29);
    ctx.lineTo(cx + r * 0.49, cy - r * 0.33);
    ctx.stroke();
    // Top bolt/knob on the machine
    ctx.fillStyle = '#888888';
    ctx.beginPath();
    ctx.arc(cx - r * 0.55, cy - r * 0.38, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    void tick;
}
// Tape — purple tape dispenser with tan roll
export function drawBoss3(ctx, cx, cy, radius, tick) {
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
    ctx.beginPath();
    ctx.arc(cx - r * 0.1, cy - r * 0.28, r * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#c8a060';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - r * 0.1, cy - r * 0.28, r * 0.18, rollSpin, rollSpin + Math.PI * 1.6);
    ctx.stroke();
    ctx.fillStyle = '#cc9944';
    ctx.beginPath();
    ctx.arc(cx - r * 0.1, cy - r * 0.28, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.beginPath();
    ctx.arc(cx - r * 0.22, cy + r * 0.28, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.22, cy + r * 0.28, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx - r * 0.22, cy + r * 0.28, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.22, cy + r * 0.28, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // Yellow base strip
    ctx.fillStyle = '#ddcc00';
    ctx.fillRect(cx - r * 0.65, cy + r * 0.55, r * 1.3, r * 0.1);
    ctx.restore();
    void rollSpin;
}
// Scissors — large green scissors standing upright
export function drawBoss4(ctx, cx, cy, radius, tick) {
    ctx.save();
    const r = radius;
    const snap = Math.abs(Math.sin(tick * 0.003)) * r * 0.1;
    // Bottom blade (lower, moves down with snap)
    ctx.fillStyle = '#22aa44';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy + snap);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.3 + snap);
    ctx.lineTo(cx + r * 0.6, cy - r * 0.15 + snap);
    ctx.lineTo(cx - r * 0.45, cy + r * 0.15 + snap);
    ctx.closePath();
    ctx.fill();
    // Top blade (upper, moves up with snap)
    ctx.fillStyle = '#33cc55';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.6, cy - snap);
    ctx.lineTo(cx + r * 0.5, cy + r * 0.3 - snap);
    ctx.lineTo(cx + r * 0.6, cy + r * 0.15 - snap);
    ctx.lineTo(cx - r * 0.45, cy - r * 0.15 - snap);
    ctx.closePath();
    ctx.fill();
    // Central screw/pivot
    ctx.fillStyle = '#888';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ccc';
    ctx.beginPath();
    ctx.arc(cx - r * 0.15, cy, r * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // Ring handles
    ctx.strokeStyle = '#22aa44';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx - r * 0.55, cy - r * 0.3 - snap, r * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - r * 0.55, cy + r * 0.3 + snap, r * 0.2, 0, Math.PI * 2);
    ctx.stroke();
    // Blade shine
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.35, cy - r * 0.06 - snap);
    ctx.lineTo(cx + r * 0.4, cy - r * 0.24 - snap);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.35, cy + r * 0.06 + snap);
    ctx.lineTo(cx + r * 0.4, cy + r * 0.24 + snap);
    ctx.stroke();
    ctx.restore();
}
// Stapler — blue metal stapler
export function drawBoss5(ctx, cx, cy, radius, tick) {
    ctx.save();
    const r = radius;
    const staple = Math.abs(Math.sin(tick * 0.002)) * r * 0.08;
    // Lower body
    ctx.fillStyle = '#3355bb';
    ctx.fillRect(cx - r * 0.65, cy + r * 0.05, r * 1.3, r * 0.45);
    // Upper arm (staples down)
    ctx.fillStyle = '#4466cc';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.65, cy - r * 0.5 + staple);
    ctx.lineTo(cx + r * 0.65, cy - r * 0.5 + staple);
    ctx.lineTo(cx + r * 0.65, cy + r * 0.05 + staple);
    ctx.lineTo(cx - r * 0.65, cy + r * 0.05 + staple);
    ctx.closePath();
    ctx.fill();
    // Chrome hinge at back
    ctx.fillStyle = '#7799dd';
    ctx.beginPath();
    ctx.arc(cx - r * 0.55, cy + r * 0.05, r * 0.1, 0, Math.PI * 2);
    ctx.fill();
    // Staple window
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(cx - r * 0.15, cy - r * 0.35 + staple, r * 0.5, r * 0.18);
    // Silver staple coming out
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx + r * 0.05, cy + r * 0.05 + staple);
    ctx.lineTo(cx + r * 0.05, cy + r * 0.12 + staple);
    ctx.lineTo(cx + r * 0.25, cy + r * 0.12 + staple);
    ctx.lineTo(cx + r * 0.25, cy + r * 0.05 + staple);
    ctx.stroke();
    // Eyes (slots)
    ctx.fillStyle = '#ffee44';
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.25 + staple, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.2, cy - r * 0.25 + staple, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(cx - r * 0.2, cy - r * 0.25 + staple, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.2, cy - r * 0.25 + staple, r * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // Brand strip
    ctx.fillStyle = '#2244aa';
    ctx.fillRect(cx - r * 0.65, cy + r * 0.38, r * 1.3, r * 0.08);
    ctx.fillStyle = '#aabbee';
    ctx.font = `bold ${Math.round(r * 0.14)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('STAPLE', cx, cy + r * 0.48);
    ctx.restore();
    void staple;
}
export const BOSS_DRAW_FNS = [
    drawBoss0,
    drawBoss1,
    drawBoss2,
    drawBoss3,
    drawBoss4,
    drawBoss5,
];
