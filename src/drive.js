// DRIVE mode: semi / speedboat races along a winding brick course. Steering is the main gameplay; auto-fire + specials ride along.
import { THREE, E, newScene, sunLight, followSun, makeObj, rnd, clamp, lerp, pick } from './engine.js';
import * as K from './brik/brik.js';
import * as W from './brik/world.js';
import * as MD from './models.js';
import { initFx, updateFx, boom, comic, smokePuff, sparkle, setWords, addFire } from './fx.js';
import { CB, initCombat, updateCombat, tracer, nearest, damage, fireRocket, lob, splash } from './combat.js';
import { I, controls, consume, readSteer, cooldown, clearInput } from './input.js';
import { hud, setBar, toast, radio, holy } from './ui.js';
import { sfx, playTrack } from './audio.js';
import { SAVE } from './save.js';
import { QUIPS } from './data.js';
import { rescueStart, rescueUpdate } from './rescue.js';
const TH = {
  seattle: { sky: ['#0e1e4a', '#3a6ab8', '#8ac0ea', '#ffd9a8'], fog: 0xa8c4e0, ground: '#3e7a3a', road: true, hw: 190, edge: 520, amp: [520, 160], f: [1 / 2600, 1 / 900], props: ['tree', 'tree', 'tree', 'tower', 'kioskSide', 'sign'], obst: ['kiosk', 'kiosk', 'cones'], enemy: 'cop', words: 'boom', boss: 'swat', bossName: 'THE SANCTIMONIOUS (SWAT-ISH VAN)', finish: 'MARINA →  GAS \'N\' GULP', chatter: 'cops' },
  salish: { sky: ['#10204a', '#2a5aa8', '#7ab8e8', '#ffe0b0'], fog: 0x9ab8d8, water: '#1f6fb8', hw: 300, edge: 700, amp: [700, 200], f: [1 / 3000, 1 / 1100], props: ['tree', 'tree', 'house', 'tree'], obst: ['log', 'log', 'orca', 'ferry'], enemy: 'cutter', words: 'boom', boss: 'bigcutter', bossName: 'COAST REGARD CUTTER "U.S.S. HALL MONITOR"', finish: 'CANADA →', chatter: 'cops' },
  border: { sky: ['#1a1a4a', '#4a5ab8', '#b8a8e8', '#ffd0b0'], fog: 0xb8b0d8, water: '#2a6aa8', hw: 300, edge: 700, amp: [700, 220], f: [1 / 2800, 1 / 1000], props: ['maple', 'maple', 'tree', 'house'], obst: ['geese', 'canoe', 'log', 'zamboat'], enemy: 'canoeE', words: 'canada', boss: 'hovercraft', bossName: 'RCMP HOVERCRAFT "THE APOLOGY"', finish: 'VANCOUVER →', chatter: 'canada' },
  transcanada: { sky: ['#0c1a4a', '#2a5aa8', '#7ab8e8', '#ffe0b0'], fog: 0xa0c0e0, ground: '#4a7a3a', road: true, hw: 200, edge: 560, amp: [560, 160], f: [1 / 2600, 1 / 950], props: ['tree', 'tree', 'maple', 'mtn', 'sign'], obst: ['timbits', 'dam', 'moose', 'cones'], enemy: 'rcmp', words: 'canada', boss: 'bus', bossName: 'MOUNTIE PARTY BUS', finish: 'THE ROCKIES →', chatter: 'canada', julia: true },
  rocky: { sky: ['#140a30', '#4a2a7a', '#c06090', '#ffb070'], fog: 0xb08aa0, ground: '#6a6a72', road: true, hw: 190, edge: 300, cliff: true, amp: [600, 300], f: [1 / 1900, 1 / 700], props: ['mtn', 'rock', 'tree', 'rock'], obst: ['pucks', 'rock', 'cones'], enemy: 'jeep', words: 'canada', boss: 'megatank', bossName: 'PROPAGANDIA MEGAPHONE TANK', finish: 'MUSTACHE MOUNTAIN →', chatter: 'prop', julia: true },
};
const ENEMY = { cop: () => MD.cop({}), cutter: () => MD.cutter(), canoeE: () => MD.zamboat('RCMP-ISH PATROL'), rcmp: () => MD.rcmpCar(), jeep: () => MD.jeep() };
const BOSS = { swat: () => MD.swat(), bigcutter: () => MD.bigCutter(), hovercraft: () => MD.hovercraft(), bus: () => MD.mountieBus(), megatank: () => MD.megaTank() };
const PROPAG = ['YOU WILL LOVE ME!', 'Every flag is MY flag!', 'Surrender the bonds, Helvie!', 'This message approved by ME!'];
export function startDrive(L, ctx) {
  const th = TH[L.theme]; const isBoat = L.veh === 'boat'; const julia = !!th.julia;
  const scene = newScene({ bloom: 0.5, bloomTh: 0.9 });
  K.sky(scene, th.sky); scene.fog = new THREE.Fog(th.fog, 1800, 6500);
  const sun = sunLight(scene, { dir: [400, 700, -200], i: 2.6, ext: 700 });
  initFx(scene); initCombat(scene); setWords(th.words);
  const up = SAVE.up; CB.dmgMul = 1 + up.dmg * 0.25; CB.boomMul = 1 + up.boom * 0.15;
  const LEN = L.len, HW = th.hw, EDGE = th.edge;
  // ---- course centerline ----
  const [a1, a2] = th.amp, [f1, f2] = th.f; const ramp = s => Math.min(1, s / 3000);
  const cx = s => ramp(s) * (a1 * Math.sin(s * f1 * 2 * Math.PI) + a2 * Math.sin(s * f2 * 2 * Math.PI + 1.3));
  const head = s => Math.atan2(cx(s + 20) - cx(s - 20), 40);
  const P = (s, u, y = 0, out = new THREE.Vector3()) => { const h = head(s); return out.set(cx(s) + u * Math.cos(h), y, s - u * Math.sin(h)); };
  // ---- course meshes ----
  const total = LEN + 4000, STEP = 40, nSeg = Math.ceil(total / STEP) + 1;
  function ribbon(u0, u1, y, mat, vScale) { const pos = new Float32Array(nSeg * 2 * 3), uv = new Float32Array(nSeg * 2 * 2), idx = [];
    for (let i = 0; i < nSeg; i++) { const s = -1000 + i * STEP; const A = P(s, u0, y), B = P(s, u1, y); pos.set([A.x, A.y, A.z, B.x, B.y, B.z], i * 6); uv.set([0, s / vScale, 1, s / vScale], i * 4); if (i) { const k = i * 2; idx.push(k - 2, k, k - 1, k - 1, k, k + 1); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // ensure normals up
    const n = g.attributes.normal; for (let i = 0; i < n.count; i++) if (n.getY(i) < 0) n.setXYZ(i, -n.getX(i), -n.getY(i), -n.getZ(i));
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.frustumCulled = false; scene.add(m); return m; }
  const studTex = (base, line, dash, w = 256, h = 256, lanes = false) => { const t = K.canvasTex(w, h, (x, W2, H) => { x.fillStyle = base; x.fillRect(0, 0, W2, H); const c = new THREE.Color(base);
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const px = (i + .5) * W2 / 8, py = (j + .5) * H / 8; x.fillStyle = 'rgba(0,0,0,.22)'; x.beginPath(); x.arc(px + 2, py + 3, W2 / 22, 0, 7); x.fill(); x.fillStyle = '#' + c.clone().multiplyScalar(1.18).getHexString(); x.beginPath(); x.arc(px, py, W2 / 22, 0, 7); x.fill(); x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.arc(px - 3, py - 3, W2 / 60, 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 2; x.strokeRect(1, 1, W2 - 2, H - 2);
      if (lanes) { x.fillStyle = '#f4f4f4'; x.fillRect(0, 0, W2 * 0.04, H); x.fillRect(W2 * 0.96, 0, W2 * 0.04, H); x.fillStyle = '#ffd23a'; x.fillRect(W2 * 0.49, 0, W2 * 0.02, H * 0.5); } });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  let water = null;
  if (th.road) {
    const rt = studTex('#3a3a42', 0, 0, 256, 256, true); rt.repeat.set(1, 1);
    ribbon(-HW, HW, 1, new THREE.MeshStandardMaterial({ map: rt, roughness: 0.75 }), 2 * HW);
    const gt = studTex(th.ground); gt.repeat.set(6, 1);
    const gm = new THREE.MeshStandardMaterial({ map: gt, roughness: 0.85 });
    if (th.cliff) { ribbon(-HW - 60, -HW, 0.5, new THREE.MeshStandardMaterial({ color: '#c8102e' }), 60); ribbon(HW, EDGE - 10, 0, gm, 1200); ribbon(-2600, -HW - 60, 0, gm, 1200); }
    else { ribbon(HW, 3000, 0, gm, 600); ribbon(-3000, -HW, 0, gm, 600); }
  } else {
    const wt = K.canvasTex(256, 256, (x, W2, H) => { x.fillStyle = th.water; x.fillRect(0, 0, W2, H); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = 'rgba(255,255,255,.10)'; x.beginPath(); x.arc((i + .5) * W2 / 4, (j + .5) * H / 4, 16, 0, 7); x.fill(); } x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 4; for (let i = 0; i < 5; i++) { x.beginPath(); x.moveTo(0, i * 52 + 10); x.quadraticCurveTo(64, i * 52 - 6, 128, i * 52 + 10); x.quadraticCurveTo(192, i * 52 + 26, 256, i * 52 + 10); x.stroke(); } });
    wt.wrapS = wt.wrapT = THREE.RepeatWrapping; wt.repeat.set(30, 30);
    water = new THREE.Mesh(new THREE.PlaneGeometry(12000, 12000), new THREE.MeshStandardMaterial({ map: wt, roughness: 0.15, metalness: 0.1, color: 0xffffff })); water.rotation.x = -Math.PI / 2; water.receiveShadow = true; scene.add(water);
    const st = studTex(L.theme === 'border' ? '#5a7a3a' : '#3e6a3a'); st.repeat.set(4, 1); const sand = studTex('#d8c08a'); sand.repeat.set(1, 1);
    ribbon(EDGE, EDGE + 120, 6, new THREE.MeshStandardMaterial({ map: sand }), 240); ribbon(-EDGE - 120, -EDGE, 6, new THREE.MeshStandardMaterial({ map: sand }), 240);
    ribbon(EDGE + 120, 4000, 24, new THREE.MeshStandardMaterial({ map: st }), 800); ribbon(-4000, -EDGE - 120, 24, new THREE.MeshStandardMaterial({ map: st }), 800);
    // channel buoys
  }
  const floorAt = p => isBoat ? 0 : 0; window.__HWfloor = p => 0;
  // ---- props (pooled, recycled ahead) ----
  const protos = {};
  const getProto = k => protos[k] || (protos[k] = ({
    tree: () => makeObj(g => { const t = W.tree(g, 0, 0, 1.6, pick(['#1d5a2a', '#24683a', '#17502a'])); }),
    maple: () => makeObj(g => { W.tree(g, 0, 0, 1.6, pick(['#c8102e', '#e0501a', '#b81a1a'])); }),
    tower: () => makeObj(g => { W.tower(g, 0, 0, 10, 10, 18 + Math.floor(rnd(30)), pick(['#4a8a9a', '#3a6a8a', '#7a8a9a', '#5a5a6a']), 0.4, Math.floor(rnd(50))); }),
    house: () => makeObj(g => { const b = K.brick(8, 8, 9, pick(['#f4f4f4', '#ffd23a', '#7ab8e8', '#e8a0a0'])); g.add(b); const r = K.brick(9, 9, 2, '#5a3412'); r.position.y = 28.8; g.add(r); const r2 = K.brick(6, 9, 2, '#5a3412'); r2.position.y = 35.2; g.add(r2); }),
    mtn: () => makeObj(g => { for (let i = 0; i < 5; i++) { const n = 6 - i; const b = K.brick(n * 2, n * 2, 12, i > 3 ? '#f4f4f4' : pick(['#5a5a62', '#6a6a72', '#4a5a4a'])); b.position.y = i * 38.4; g.add(b); } g.scale.setScalar(2.4); }),
    rock: () => MD.boulder(),
    kioskSide: () => MD.kiosk(pick(['GRANDE DESTRUCTION', 'VENTI VIOLENCE', 'LATTE-DA'])),
    sign: () => makeObj(g => { const post = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 80), K.plastic('#888')); post.position.y = 40; g.add(post); const t = pick(L.theme === 'seattle' ? ['SEATTLE-ISH 12 MI', 'BIKE LANE · DO NOT', 'EXIT: NOWHERE', 'RAIN AHEAD (ALWAYS)'] : ['SORRY FOR THE TOLL', 'MOOSE: 1  YOU: 0', 'TIM HORTOFF\'S 2 KM', 'PLEASE DRIVE NICE, EH']); const s = MD.label(t, 120, 30, '#1f6a3a', '#fff'); s.position.y = 90; g.add(s); }),
  })[k]());
  const props = []; const PROP_N = E.q === 'low' ? 26 : 44; let propS = -400;
  function placeProp(o) { const side = Math.random() < 0.5 ? -1 : 1; let u; if (th.cliff && side > 0) u = EDGE + 200 + rnd(900); else if (isBoat) u = side * (EDGE + 160 + rnd(700)); else u = side * (HW + 90 + rnd(800)); if (th.cliff && side < 0) u = -HW - 120 - rnd(700);
    const k = pick(th.props); if (o.obj) scene.remove(o.obj); o.obj = getProto(k).clone(); o.k = k; o.s = propS; propS += 2 * 6000 / PROP_N * rnd(0.6, 1.4) / 2;
    P(o.s, u, isBoat ? 24 : 0, o.obj.position); if (th.cliff && side > 0) o.obj.position.y = -600; if (k === 'kioskSide' || k === 'sign') o.obj.rotation.y = head(o.s) + (u > 0 ? -Math.PI / 2 : Math.PI / 2); else o.obj.rotation.y = rnd(6); scene.add(o.obj); }
  for (let i = 0; i < PROP_N; i++) { const o = {}; placeProp(o); props.push(o); }
  if (th.cliff) { // tall cliff wall on the left, abyss on the right
    const wall = []; for (let s = -1000; s < total; s += 160) { const p = P(s, -HW - 260); wall.push({ x: p.x, y: 300, z: p.z, sx: 300, sy: 700, sz: 170, color: pick(['#5a5a62', '#6a6a72', '#4a4a52']), noStud: true }); } K.instBricks(scene, wall);
  }
  // landmarks
  const finish = MD.finishBanner(th.finish, HW * 2 + 120); P(LEN, 0, isBoat ? 0 : 0, finish.position); finish.rotation.y = head(LEN); scene.add(finish);
  if (L.theme === 'border') { const b = MD.label('WELCOME TO CANADA – SORRY ABOUT THE GEESE', 520, 50, '#d11a1a', '#fff'); const g = new THREE.Group(); g.add(b); b.position.y = 120; const pole = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 120), K.plastic('#f4f4f4')); pole.position.y = 60; g.add(pole); P(2600, 0, 0, g.position); g.rotation.y = head(2600) + Math.PI; scene.add(g); }
  if (L.theme === 'seattle') { const nd = makeObj(g => { const s = new THREE.Mesh(new THREE.CylinderGeometry(6, 14, 600, 12), K.plastic('#e8e8e8')); s.position.y = 300; g.add(s); const top = new THREE.Mesh(new THREE.CylinderGeometry(80, 40, 30, 24), K.plastic('#f4f4f4')); top.position.y = 610; g.add(top); const cap = new THREE.Mesh(new THREE.ConeGeometry(30, 60, 16), K.plastic('#e0a020')); cap.position.y = 660; g.add(cap); }); P(LEN * 0.5, 1800, 0, nd.position); nd.scale.setScalar(2); scene.add(nd); }
  // ---- player vehicle ----
  const veh = new THREE.Group(); scene.add(veh);
  let body, andy, jul = null, bob = null, jake = null;
  if (isBoat) { body = MD.boat({ color: '#ff2e88', name: 'BOND VOYAGE' }); andy = MD.chars.andy({ armRot: [[1.2, 0.1], [1.2, -0.1]] }); andy.position.set(0, 12, -14); body.add(andy); }
  else { body = MD.semi(L.veh === 'semi2' ? { color: '#14141a', brand: 'FREEDOMLINER', trailerColor: '#1d2a6a', trailerInk: '#fff', trailerText: 'EAGLE EXPRESS', trailerSub: 'UNLIMITED ROCKETS • NO REFUNDS' } : { brand: 'KENWHIRL' });
    andy = MD.chars.andy({ armRot: [[1.3, 0.1], [1.3, -0.1]] }); andy.position.set(-9, 6, -2); body.add(andy);
    const wh = new THREE.Mesh(new THREE.TorusGeometry(7, 1.2, 8, 20), K.plastic('#111')); wh.position.set(-9, 31, 7); wh.rotation.x = -0.5; body.add(wh); }
  if (julia) { jul = MD.chars.julia({ armRot: [[1.5, 0], [1.3, -0.3]], legRot: [0.4, -0.4] }); jul.position.set(4, 73.2, -70); body.add(jul); const Lr = K.launcher(40, '#4f6b2e'); Lr.position.set(-7, 28, 6); Lr.rotation.y = -Math.PI / 2; jul.add(Lr);
    bob = MD.chars.bob({ angry: true }); bob.position.set(-12, 73.2, -110); body.add(bob); jake = MD.chars.jake({ angry: true }); jake.position.set(12, 73.2, -130); body.add(jake); }
  veh.add(body);
  const VLEN = isBoat ? 170 : 250, VW = isBoat ? 60 : 56;
  // eagle drone
  let eagle = null; if (up.eagle > 0) { eagle = MD.eagle(); scene.add(eagle); }
  // ---- state ----
  const S = { s: 200, u: 0, du: 0, v: 0, vmax: isBoat ? 820 : 720, hp: 100, maxHp: 100 + up.armor * 25, boost: 1, inv: 0, fireT: 0, rocketT: 0, catT: 0, mineT: 0, hornT: 0, specialT: 0, kills: 0, bonds: 0, rescues: 0, crashes: 0, t: 0, slowT: 0, stuckT: 0, done: false, bossSpawned: false, boss: null, finT: 0, rescue: null, offT: 0, yaw: 0, bossKilled: false, chatterT: 6, propagT: 10 };
  S.hp = S.maxHp;
  const enemies = []; const obst = []; const bonds = []; const mines = [];
  const enemyProto = ENEMY[th.enemy]();
  // light-bar flashers
  const flashMats = []; enemyProto.traverse(o => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.color && (o.material.color.r > .9 || o.material.color.b > .9) && o.material.color.g < .5) flashMats.push({ m: o.material, c: o.material.color.clone() }); });
  function enemyEnt(obj, s, u, hp, opt = {}) { const e = { obj, s, u, v: opt.v ?? S.v, hp, maxHp: hp, r: opt.r || 40, alive: true, pos: new THREE.Vector3(), boss: !!opt.boss, side: opt.side ?? (Math.random() < 0.5 ? -1 : 1), wantU: 0, ramT: rnd(2, 4), hitT: 0, len: opt.len || 100, wid: opt.wid || 44, yaw: 0, dropT: 3 };
    e.kill = src => { e.dead = 1.4; S.kills++; const big = e.boss; boom(e.pos.clone().add(new THREE.Vector3(0, 20, 0)), big ? 160 : 70, { burst: big ? (th.words === 'canada' ? 'EH-BOOM!!' : 'KA-BOOM!!') : true, fire: big ? 3 : 1.2, bricks: big ? 2 : 1 }); sfx(big ? 'bigboom' : 'boom'); dropBonds(e.s, e.u, big ? 12 : 2);
      if (big) { S.bossKilled = true; finisher(); setBar('boss', 0); document.getElementById('boss').style.display = 'none'; } else if (Math.random() < 0.3) radio(...pickChatter(true)); };
    CB.targets.push(e); enemies.push(e); scene.add(obj); return e; }
  function pickChatter(dying) { if (th.chatter === 'canada') return ['MOUNTIE', pick(QUIPS.canada)]; if (th.chatter === 'prop') return ['GOON', pick(['For the Generalissimo! ...ow.', 'My megaphone!', 'This was NOT in the brochure!'])]; return ['COP', pick(QUIPS.cops)]; }
  function spawnEnemy() { const behind = Math.random() < 0.65; const s = behind ? S.s - 700 - rnd(300) : S.s + 1400 + rnd(500); const e = enemyEnt(enemyProto.clone(), s, rnd(-HW * 0.7, HW * 0.7), 9 + L.id * 1.2, { v: behind ? S.v + 140 : S.v * 0.55, len: 100, wid: 46 }); if (!behind) e.ahead = true; if (Math.random() < 0.3 && behind) sfx('siren', 0.6); }
  function spawnBoss() { S.bossSpawned = true; const o = BOSS[th.boss](); const e = enemyEnt(o, S.s - 900, 0, 120 + L.id * 14, { boss: true, r: 90, v: S.v + 200, len: 200, wid: 80 }); S.boss = e; document.getElementById('boss').style.display = ''; setBar('boss', 1, th.bossName); toast('BOSS!', th.bossName, 2.6); sfx('horn'); if (L.theme === 'rocky') radio('GENERALISSIMO (MEGAPHONE)', 'YOU WILL LOVE ME! Or else!'); }
  function dropBonds(s, u, n) { for (let i = 0; i < n; i++) addBond(s + rnd(-60, 120), clamp(u + rnd(-80, 80), -HW, HW), true); }
  function addBond(s, u, pop) { const m = MD.bondMesh(); scene.add(m); bonds.push({ m, s, u, y: pop ? 80 : 30, vy: pop ? 200 : 0 }); }
  function bondLine(s0) { const u0 = rnd(-HW * 0.6, HW * 0.6), du = rnd(-3, 3); for (let i = 0; i < 6; i++) addBond(s0 + i * 70, clamp(u0 + du * i * 20, -HW * 0.8, HW * 0.8)); }
  // obstacles
  const OBP = {}; const getOb = k => OBP[k] || (OBP[k] = ({ kiosk: () => MD.kiosk(pick(['GRANDE DESTRUCTION', 'VENTI VIOLENCE'])), cones: () => makeObj(g => { for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(7, 22, 10), K.plastic('#ff6a00')); c.position.set((i - 2) * 22, 11, 0); g.add(c); } }), log: () => MD.log(), orca: () => MD.orca(), ferry: () => MD.ferry(), geese: () => MD.geese(5), canoe: () => MD.canoe(true), zamboat: () => MD.zamboat(), timbits: () => MD.timbits(), dam: () => MD.beaverDam(), moose: () => MD.moose(), pucks: () => makeObj(g => { for (let i = 0; i < 6; i++) { const p = MD.puck(); p.position.set(rnd(-50, 50), 3, rnd(-40, 40)); g.add(p); } }), rock: () => MD.boulder() })[k]());
  const OBSPEC = { kiosk: { w: 40, l: 40, dmg: 4, bonus: 1, word: 'GRANDE-SPLAT!', destroy: true }, cones: { w: 60, l: 14, dmg: 0, destroy: true, word: 'BONK!' }, log: { w: 60, l: 20, dmg: 8, destroy: true, word: 'THWACK!' }, orca: { w: 40, l: 60, dmg: 0, bonus: 3, word: 'HIGH-FIN!', friendly: true }, ferry: { w: 70, l: 170, dmg: 18, word: 'KER-RUNCH!', heavy: true }, geese: { w: 100, l: 40, dmg: 6, destroy: true, word: 'HONK-POW!', fly: 40 }, canoe: { w: 30, l: 50, dmg: 3, destroy: true, word: 'SORRY-SPLAT!', bonus: 1 }, zamboat: { w: 50, l: 80, dmg: 10, destroy: true, word: 'ICE-CAPADE!' }, timbits: { w: 60, l: 20, dmg: 3, destroy: true, word: 'TIMBIT-BOOM!', bonus: 1 }, dam: { w: 60, l: 20, dmg: 6, destroy: true, word: 'DAM-IT!' }, moose: { w: 30, l: 50, dmg: 14, word: 'SORRY, MOOSE!', heavy: true, moose: true }, pucks: { w: 70, l: 50, dmg: 5, destroy: true, word: 'PUCK-POW!' }, rock: { w: 30, l: 30, dmg: 10, destroy: true, word: 'KER-RUNCH!' } };
  function spawnObst() { const k = pick(th.obst); const sp = OBSPEC[k]; const o = { k, sp, obj: getOb(k).clone(), s: S.s + 2200 + rnd(400), u: rnd(-HW * 0.75, HW * 0.75), alive: true, t: 0 };
    if (k === 'ferry') o.u = pick([-1, 1]) * HW * 0.5; P(o.s, o.u, sp.fly || 0, o.obj.position); o.obj.rotation.y = head(o.s) + (k === 'ferry' || k === 'log' || k === 'dam' ? Math.PI / 2 * (k === 'ferry' ? 0 : 1) : rnd(-0.4, 0.4) + (k === 'moose' ? Math.PI / 2 : 0)); scene.add(o.obj); obst.push(o);
    if (sp.destroy) { o.pos = o.obj.position; o.hp = 2; o.r = 40; o.isOb = true; o.kill = () => { breakOb(o); }; CB.targets.push(o); } }
  function breakOb(o) { if (!o.obj.parent) return; o.alive = false; boom(o.obj.position.clone().add(new THREE.Vector3(0, 10, 0)), 45, { burst: o.sp.word, bricks: 0.8 }); sfx('crash'); scene.remove(o.obj); if (o.sp.bonus) dropBonds(o.s, o.u, o.sp.bonus); }
  // ---- HUD + controls ----
  hud(`<div class="hbar" id="hp"><i></i><b>RIG</b></div><div class="hbar" id="prog"><i></i><b>0%</b></div><div class="hbar" id="boss"><i></i><b></b></div><div id="bondsc">$0</div><button id="pause" class="pe">II</button><button id="resetv" class="pe">VIEW</button><div id="radio"></div><div id="stick"><i></i></div><div id="steerhint"></div><div class="ctl" id="ctlR"></div>`);
  const btns = [{ id: 'boost', label: 'BOOST', cls: 'blue', key: ['ShiftLeft', 'ArrowUp', 'KeyW'] }, { id: 'brake', label: 'BRAKE', cls: 'red', key: ['ArrowDown', 'KeyS'] }];
  if (isBoat) btns.push({ id: 'mine', label: 'MINE<br><small>∞</small>', cls: 'pink', key: ['Space', 'KeyM'], row: true });
  else if (julia) { btns.push({ id: 'rocket', label: 'ROCKETS', cls: 'pink', key: ['Space', 'KeyR'], row: true }); btns.push({ id: 'cat', label: 'CATS', cls: '', key: ['KeyC'] }); }
  else btns.push({ id: 'horn', label: 'FREEDOM<br>HORN', cls: 'pink', key: ['Space', 'KeyH'], row: true });
  controls(btns, 'DRAG HERE TO STEER');
  const cam = E.cam; cam.fov = 60; cam.updateProjectionMatrix(); const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(); let shake = 0; window.__HWshake = k => shake = Math.min(14, shake + k * 6);
  let resetView = () => { camPos.set(0, 0, 0); }; document.getElementById('resetv').onclick = () => { resetView(); };
  playTrack(L.music); setTimeout(() => toast(L.name, L.sub, 2.8), 300);
  if (L.id === 1) setTimeout(() => radio('ANDY', "Keys in the visor. God bless Washington."), 3200);
  if (L.id === 3) setTimeout(() => radio('ANDY', 'Tap MINE. Rubber ducks of liberty, away!'), 3000);
  if (L.id === 4) setTimeout(() => radio('ANDY', 'Canada! Smell that? Maple and apologies.'), 3000);
  if (L.id === 6) setTimeout(() => radio('JULIA', 'Honey, I packed snacks and rockets.'), 3000);
  if (L.id === 7) setTimeout(() => radio('JULIA', 'Cliff on the right, sweetheart. Try not to.'), 3000);
  for (let i = 0; i < 6; i++) bondLine(900 + i * 1100);
  let enemyT = 4, obstT = 3, bondT = 2;
  function finisher() { E.timeScale = 0.22; S.slowT = 1.6; sfx('bigboom'); comic(null, pick(th.words === 'canada' ? ['SORRY-SPLAT!!', 'EH-BOOM!!'] : ['KA-BLAM!!', 'KA-BOOM!!']), 1.6, { x: E.w / 2, y: E.h * 0.38, life: 1.8 }); setTimeout(() => radio(julia ? 'JULIA' : 'ANDY', pick(julia ? QUIPS.julia : QUIPS.andy)), 900); }
  // ---- rescue ----
  const rescueCtx = { scene, veh, body, andy, getPos: () => veh.position, onLift: () => { }, isBoat };
  function triggerRescue(why) { if (S.rescue || S.done) return; S.rescues++; SAVE.rescues++; S.rescue = rescueStart(rescueCtx, why); S.rescueFrom = { u: S.u, s: S.s }; for (const e of enemies) if (e.alive && !e.boss && Math.abs(e.s - S.s) < 700) { e.crashOut = true; } }
  // ---- update ----
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  function update(dt, rdt) {
    if (consume('pause')) { ctx.pause(); return; }
    S.t += dt; readSteer();
    if (S.slowT > 0) { S.slowT -= rdt; if (S.slowT <= 0 && !S.rescue) E.timeScale = 1; }
    // rescue sequence owns the vehicle
    if (S.rescue) { const r = rescueUpdate(S.rescue, rdt); const k = r.k; // 0..1
      const s0 = S.rescueFrom; S.u = lerp(s0.u, 0, r.move); S.du = 0; S.v = lerp(S.v, S.vmax * 0.5, rdt);
      P(S.s, S.u, r.lift, veh.position); S.yaw = lerp(S.yaw, head(S.s), r.move); veh.rotation.set(Math.sin(S.t * 2) * 0.08 * r.lift / 160, S.yaw, 0);
      for (const e of enemies) if (e.crashOut && e.alive) { e.crashOut = false; e.u += (e.u > S.u ? 1 : -1) * 400; setTimeout(() => e.alive && damage(e, 999, 'rescue'), 600 + rnd(800)); }
      if (r.done) { S.rescue = null; S.hp = Math.max(S.hp, S.maxHp * 0.6); S.inv = 2.5; S.stuckT = 0; S.offT = 0; E.timeScale = 1; }
      camFollow(rdt, true, r); setBar('hp', S.hp / S.maxHp); updateFx(dt); updateCombat(dt); return; }
    // driving
    let vt = S.vmax; const off = Math.abs(S.u) > HW; if (off) vt *= isBoat ? 0.55 : 0.6;
    if (I.hold.brake) vt = 90; if (I.hold.boost && S.boost > 0.05 && !I.hold.brake) { vt *= 1.45; S.boost = Math.max(0, S.boost - dt * 0.35); } else S.boost = Math.min(1, S.boost + dt * 0.12);
    S.v = lerp(S.v, vt, Math.min(1, dt * (vt > S.v ? 0.9 : 2.2)));
    const steerSp = (isBoat ? 520 : 470) * (0.55 + 0.45 * Math.min(1, S.v / S.vmax));
    S.du = lerp(S.du, I.steer * steerSp, Math.min(1, dt * (isBoat ? 3.5 : 6)));
    S.u += S.du * dt; S.s += S.v * dt;
    // auto-steer assist on easy (keeps you gently on the road when you let go)
    if (Math.abs(I.steer) < 0.05 && Math.abs(S.u) > HW * 0.8) S.u -= Math.sign(S.u) * 60 * dt;
    if (off) { S.offT += dt; if (Math.random() < dt * 8) smokePuff(P(S.s - 60, S.u, 4), 10, isBoat ? '#ffffff' : '#a08a6a', 0.8); } else S.offT = 0;
    if (Math.abs(S.u) > EDGE - VW * 0.5) triggerRescue(th.cliff && S.u > 0 ? 'cliff' : isBoat ? 'shore' : 'ditch');
    if (S.v < 120 && !I.hold.brake) { S.stuckT += dt; if (S.stuckT > 3) triggerRescue('stuck'); } else S.stuckT = 0;
    const yawT = head(S.s) + Math.atan2(S.du, Math.max(200, S.v)); S.yaw = lerp(S.yaw, yawT, Math.min(1, dt * 8));
    P(S.s, S.u, isBoat ? Math.sin(S.t * 3) * 2 : 0, veh.position); veh.rotation.set(isBoat ? -0.06 - S.v / S.vmax * 0.06 : 0, S.yaw, -S.du / steerSp * (isBoat ? 0.18 : 0.05));
    if (isBoat && Math.random() < dt * 30) smokePuff(P(S.s - 80, S.u + rnd(-20, 20), 4), 7, '#ffffff', 0.7, new THREE.Vector3(rnd(-30, 30), 30, 0));
    if (S.inv > 0) { S.inv -= dt; body.visible = Math.floor(S.inv * 10) % 2 === 0 || S.inv <= 0; } else body.visible = true;
    // spawning
    enemyT -= dt; const prog = S.s / LEN; const maxE = (E.q === 'low' ? 3 : 5) + (prog > 0.5 ? 1 : 0);
    if (enemyT <= 0 && S.s < LEN - 1500) { enemyT = lerp(4.5, 2.2, prog); if (enemies.filter(e => e.alive && !e.boss).length < maxE) spawnEnemy(); }
    obstT -= dt; if (obstT <= 0 && S.s < LEN - 1200) { obstT = rnd(1.6, 3.2) * (isBoat ? 1.1 : 1); spawnObst(); }
    bondT -= dt; if (bondT <= 0 && S.s < LEN - 1500) { bondT = rnd(3, 5); bondLine(S.s + 2400); }
    if (!S.bossSpawned && prog > 0.55) spawnBoss();
    S.chatterT -= dt; if (S.chatterT <= 0) { S.chatterT = rnd(9, 15); const al = enemies.filter(e => e.alive); if (al.length) radio(...pickChatter()); else if (Math.random() < 0.5) radio(julia ? pick(['JULIA', 'ANDY']) : 'ANDY', pick(julia && Math.random() < .5 ? QUIPS.julia : QUIPS.andy)); }
    if (L.theme === 'rocky') { S.propagT -= dt; if (S.propagT <= 0) { S.propagT = rnd(10, 16); radio('GENERALISSIMO', pick(PROPAG)); sfx('megaphone', 0.6); } }
    // enemies
    for (let i = enemies.length - 1; i >= 0; i--) { const e = enemies[i];
      if (e.dead !== undefined && !e.alive) { e.dead -= dt; e.obj.position.y += dt * 60; e.obj.rotation.x += dt * 3; e.obj.rotation.z += dt * 2; if (e.dead <= 0) { scene.remove(e.obj); enemies.splice(i, 1); const ti = CB.targets.indexOf(e); if (ti >= 0) CB.targets.splice(ti, 1); } P(e.s, e.u, e.obj.position.y, tmp); e.obj.position.x = tmp.x; e.obj.position.z = tmp.z; continue; }
      if (!e.alive) continue;
      const ds = e.s - S.s;
      if (e.boss) { // keeps near the player, alongside/ahead; drops hazards
        const wantS = S.s + 260 + Math.sin(S.t * 0.4) * 120; e.v = S.v + clamp((wantS - e.s) * 1.2, -300, 400); e.wantU = Math.sin(S.t * 0.6) * HW * 0.6;
        e.dropT -= dt; if (e.dropT <= 0 && ds > 100) { e.dropT = rnd(2.2, 3.6); spawnHazardFromBoss(e); } }
      else if (e.ahead) { e.v = S.v * 0.5; e.wantU = e.u; if (ds < -900) { e.alive = false; scene.remove(e.obj); enemies.splice(i, 1); CB.targets.splice(CB.targets.indexOf(e), 1); continue; } }
      else { // chase: rubber band, then ram
        const want = ds < -200 ? S.v + 220 : S.v + 30; e.v = lerp(e.v, want, dt * 1.5); e.ramT -= dt; e.wantU = e.ramT < 0 ? S.u : S.u + e.side * 110; if (e.ramT < -1.2) e.ramT = rnd(2, 4); if (ds > 600) e.v = S.v * 0.8; }
      e.u = lerp(e.u, clamp(e.wantU, -HW * 1.1, HW * 1.1), Math.min(1, dt * 1.6)); e.s += e.v * dt;
      P(e.s, e.u, isBoat ? Math.sin(S.t * 3 + i) * 2 : 0, e.obj.position); e.obj.rotation.y = head(e.s) + (e.wantU - e.u) * 0.002; e.pos.copy(e.obj.position);
      if (e.hitT > 0) { e.hitT -= dt; e.obj.position.y += 3; }
      // contact with player
      if (Math.abs(e.s - S.s) < (VLEN + e.len) * 0.5 && Math.abs(e.u - S.u) < (VW + e.wid) * 0.5) { const push = Math.sign(e.u - S.u) || 1; e.u += push * 60; S.u -= push * 25; if (S.inv <= 0) { hurt(e.boss ? 10 : 5); } damage(e, e.boss ? 3 : 4, 'ram'); comic(e.pos, pick(['KER-RUNCH!', 'WHAM!', 'CRUNCH!']), 0.8); sfx('crash'); }
      if (ds < -1600 && !e.boss) { e.alive = false; scene.remove(e.obj); enemies.splice(i, 1); CB.targets.splice(CB.targets.indexOf(e), 1); }
    }
    for (const f of flashMats) { const on = Math.floor(S.t * 6) % 2; f.m.color.copy(f.c).multiplyScalar(on ? 2 : 0.25); }
    // obstacles
    for (let i = obst.length - 1; i >= 0; i--) { const o = obst[i]; o.t += dt;
      if (o.k === 'orca') { o.obj.position.y = Math.max(-20, Math.sin(o.t * 2.5) * 50); o.obj.rotation.x = -Math.cos(o.t * 2.5) * 0.6; }
      if (o.k === 'geese') { o.s -= 120 * dt; P(o.s, o.u, 40 + Math.sin(o.t * 3) * 8, o.obj.position); }
      if (o.k === 'moose') { o.u += Math.sin(o.t * 0.7) * 40 * dt; P(o.s, o.u, 0, o.obj.position); }
      if (o.k === 'ferry') { o.obj.position.y = Math.sin(o.t) * 2; }
      if (o.s < S.s - 600 || !o.alive) { if (o.alive) scene.remove(o.obj); obst.splice(i, 1); const ti = CB.targets.indexOf(o); if (ti >= 0) CB.targets.splice(ti, 1); continue; }
      if (Math.abs(o.s - S.s) < (VLEN * 0.5 + o.sp.l * (o.k === 'ferry' ? 1 : 0.5)) && Math.abs(o.u - S.u) < (VW * 0.5 + o.sp.w) && (o.k !== 'orca' || o.obj.position.y > -10)) {
        if (o.sp.friendly) { if (!o.hf) { o.hf = 1; comic(o.obj.position, o.sp.word, 0.9); sfx('coin'); S.bonds += 3; SAVE.bonds += 3; radio('ANDY', 'Up top, buddy! *high-fin*'); } continue; }
        if (o.sp.destroy) { breakOb(o); const ti = CB.targets.indexOf(o); if (ti >= 0) CB.targets.splice(ti, 1); obst.splice(i, 1); if (S.inv <= 0 && o.sp.dmg) hurt(o.sp.dmg * 0.6); S.v *= 0.92; continue; }
        if (o.sp.heavy && S.inv <= 0) { hurt(o.sp.dmg); comic(o.obj.position, o.sp.word, 1); sfx('crash'); S.v *= 0.4; S.u += (S.u > o.u ? 1 : -1) * 90; S.inv = 1; if (o.sp.moose) radio('MOOSE', '...'), setTimeout(() => radio('ANDY', 'Sorry, moose. Wait, why am I apologizing?'), 1200); }
      } }
    // bonds
    const mag = 60 + up.magnet * 45;
    for (let i = bonds.length - 1; i >= 0; i--) { const b = bonds[i]; if (b.vy) { b.y += b.vy * dt; b.vy -= 500 * dt; if (b.y < 30) { b.y = 30; b.vy = 0; } }
      const d = Math.hypot(b.s - S.s, b.u - S.u); if (d < mag + 80 && up.magnet > 0) { b.s = lerp(b.s, S.s, dt * 6); b.u = lerp(b.u, S.u, dt * 6); }
      P(b.s, b.u, b.y + Math.sin(S.t * 4 + i) * 5, b.m.position); b.m.rotation.y += dt * 3;
      if (d < mag) { scene.remove(b.m); bonds.splice(i, 1); S.bonds++; SAVE.bonds++; SAVE.totalBonds++; sfx('coin', 0.6); if (Math.random() < 0.3) sparkle(b.m.position, 5, '#b8ff90'); continue; }
      if (b.s < S.s - 400) { scene.remove(b.m); bonds.splice(i, 1); } }
    // mines
    for (let i = mines.length - 1; i >= 0; i--) { const m = mines[i]; m.t += dt; m.obj.position.y = Math.sin(m.t * 4) * 2; m.obj.rotation.y += dt;
      let hit = null; for (const e of enemies) if (e.alive && Math.abs(e.s - m.s) < e.len * 0.6 + 20 && Math.abs(e.u - m.u) < e.wid * 0.6 + 20) { hit = e; break; }
      if (hit || m.t > 14) { scene.remove(m.obj); mines.splice(i, 1); if (hit) { boom(m.obj.position.clone(), 70 * CB.boomMul, { burst: pick(['QUACK-BOOM!', 'GOBBLE-BLAM!', 'KA-SPLOOSH!']) }); sfx('boom'); splash(m.obj.position, 110 * CB.boomMul, 12, 'mine'); } } }
    // weapons: auto-fire
    const rate = (julia ? 5 : 4) * (1 + up.rate * 0.22); S.fireT -= dt; const gunPos = tmp.copy(veh.position).add(new THREE.Vector3(0, isBoat ? 30 : 60, 0));
    if (S.fireT <= 0) { const t = nearest(gunPos, 1100, x => !x.isOb || Math.abs(x.u - S.u) < HW); if (t) { S.fireT = 1 / rate; const to = t.pos.clone().add(new THREE.Vector3(rnd(-8, 8), 18, rnd(-8, 8))); tracer(gunPos, to); damage(t, 1, 'gun'); sfx(L.id >= 2 ? 'mg' : 'shot', 0.5); if (Math.random() < 0.35) sparkle(to, 3); } }
    if (julia) { S.rocketT -= dt; if (S.rocketT <= 0) { const t = nearest(veh.position, 1400, x => !x.isOb); if (t) { S.rocketT = 2.2; fireRocket(jul.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 30, 0)), t, { dmg: 7, radius: 110, word: pick(['KA-BLAM!', 'EH-BOOM!', 'ZOWIE!']) }); } } }
    if (eagle) { const a = S.t * 2; const t = nearest(veh.position, 700, x => !x.isOb); eagle.position.copy(veh.position).add(new THREE.Vector3(Math.cos(a) * 120, 150 + Math.sin(a * 2) * 20, Math.sin(a) * 120)); if (t) { eagle.position.lerp(t.pos.clone().add(new THREE.Vector3(0, 60, 0)), 0.4); if (Math.random() < dt * 2 * up.eagle) { damage(t, 1.5, 'eagle'); comic(t.pos, 'PECK!', 0.6); sfx('hit', 0.5); } } eagle.lookAt(veh.position); }
    // specials
    S.hornT -= dt; S.mineT -= dt; S.specialT -= dt; S.catT -= dt;
    if (consume('horn') && S.hornT <= 0) { S.hornT = 6; sfx('horn'); comic(veh.position.clone().add(new THREE.Vector3(0, 120, 0)), 'HONNNK!', 1); for (const e of enemies) if (e.alive && Math.abs(e.s - S.s) < 500) { e.u += Math.sign(e.u - S.u || 1) * 220; damage(e, 3, 'horn'); } }
    if (consume('mine') && S.mineT <= 0) { S.mineT = 0.9; sfx('mine'); const m = { obj: MD.clone('mine', MD.mine), s: S.s - VLEN * 0.6, u: S.u, t: 0 }; P(m.s, m.u, 0, m.obj.position); scene.add(m.obj); mines.push(m); if (Math.random() < 0.25) comic(m.obj.position, pick(['QUACK!', 'PLOP!', 'GOBBLE!']), 0.6); }
    if (consume('rocket') && S.specialT <= 0) { S.specialT = 5; radio('JULIA', pick(['Make it rain, sweetheart.', "Reload? I don't know her.", 'Salvo of freedom, coming up!'])); const ts = CB.targets.filter(x => x.alive && x.pos.distanceTo(veh.position) < 1800); for (let i = 0; i < 6; i++) { const t = ts.length ? ts[i % ts.length] : null; setTimeout(() => fireRocket(jul.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 30, 0)), t && t.alive ? t : null, { dmg: 9, radius: 120 }), i * 120); } }
    if (consume('cat') && S.catT <= 0) { S.catT = 7; const t = nearest(veh.position, 1500, x => !x.isOb); if (t) { sfx('meow'); comic(veh.position.clone().add(new THREE.Vector3(0, 140, -100)), 'MRRROWW!', 0.8); const from = jake.getWorldPosition(new THREE.Vector3()); lob(from, t.pos.clone(), { dmg: 10, radius: 130, word: pick(['HAIRBALL-BOOM!', 'SORRY-SPLAT!', 'HISS-POW!']), onHit: () => sfx('hiss') }); setTimeout(() => { if (t.alive) { sfx('hiss'); comic(t.pos, 'HISS-POW!', 1); damage(t, 8, 'bob'); radio('BOB', '*shreds tires with extreme prejudice*'); } }, 500); } else toast('NO TARGETS', 'The kitties are napping', 1.2); }
    cooldown('mine', S.mineT / 0.9, S.mineT <= 0); cooldown('horn', S.hornT / 6, S.hornT <= 0); cooldown('rocket', S.specialT / 5, S.specialT <= 0); cooldown('cat', S.catT / 7, S.catT <= 0); cooldown('boost', 1 - S.boost, S.boost > 0.95);
    // cats animate on trailer
    if (bob) { bob.position.y = 73.2 + Math.abs(Math.sin(S.t * 6)) * 4; jake.rotation.y = Math.sin(S.t * 2) * 0.6; }
    // props recycle
    for (const o of props) if (o.s < S.s - 700) placeProp(o);
    if (water) { water.position.set(veh.position.x, 0, veh.position.z); water.material.map.offset.set(veh.position.x / 400, -veh.position.z / 400); }
    followSun(sun, veh.position);
    // hud
    setBar('hp', S.hp / S.maxHp); setBar('prog', S.s / LEN, Math.min(100, Math.floor(S.s / LEN * 100)) + '%'); if (S.boss && S.boss.alive) setBar('boss', S.boss.hp / S.boss.maxHp); document.getElementById('bondsc').textContent = '$' + (S.bonds * 0.1).toFixed(1) + 'M';
    if (S.hp <= 0) triggerRescue('wreck');
    // finish
    if (S.s >= LEN && !S.done) { S.done = true; if (S.boss && S.boss.alive) { damage(S.boss, 9999, 'finish'); } else { finisher(); } comic(null, 'FINISH!', 1.5, { x: E.w / 2, y: E.h * 0.3, life: 2 }); setTimeout(() => ctx.win({ kills: S.kills, bonds: S.bonds, rescues: S.rescues, time: S.t, boss: S.bossKilled }), 2300); }
    camFollow(rdt);
    updateFx(dt); updateCombat(dt);
  }
  function spawnHazardFromBoss(e) { const k = th.road ? (L.theme === 'rocky' ? 'pucks' : 'cones') : 'log'; const sp = OBSPEC[k]; const o = { k, sp, obj: getOb(k).clone(), s: e.s - 120, u: e.u, alive: true, t: 0 }; P(o.s, o.u, 0, o.obj.position); scene.add(o.obj); obst.push(o); o.pos = o.obj.position; o.hp = 2; o.r = 40; o.isOb = true; o.kill = () => breakOb(o); CB.targets.push(o); comic(o.obj.position, L.theme === 'border' ? 'SORRY-DROP!' : 'CLUNK!', 0.6); }
  function hurt(d) { const red = 1 / (1 + up.armor * 0.15); S.hp -= d * red; sfx('hurt', 0.6); shake = Math.min(14, shake + 5); }
  function camFollow(rdt, rescue, r) {
    const portrait = E.h > E.w; const dist = (isBoat ? 330 : 400) * (portrait ? 1.35 : 1), hgt = (isBoat ? 150 : 175) * (portrait ? 1.25 : 1);
    const back = tmp2.set(-Math.sin(S.yaw), 0, -Math.cos(S.yaw));
    let want = veh.position.clone().addScaledVector(back, dist); want.y = veh.position.y + hgt; let look = veh.position.clone().addScaledVector(back, -320); look.y = veh.position.y + 40;
    if (rescue && r) { // side close-up so Andy is visible in the light
      const side = new THREE.Vector3(Math.cos(S.yaw), 0, -Math.sin(S.yaw)); const cw = veh.position.clone().addScaledVector(side, -170).addScaledVector(back, -(isBoat ? 230 : 300)); cw.y = veh.position.y + (isBoat ? 70 : 95); want.lerp(cw, r.cam); look.lerp(veh.position.clone().add(new THREE.Vector3(0, isBoat ? 25 : 45, 0)).addScaledVector(back, isBoat ? 0 : -30), r.cam); }
    if (camPos.lengthSq() === 0) { camPos.copy(want); camLook.copy(look); }
    camPos.lerp(want, Math.min(1, rdt * 4)); camLook.lerp(look, Math.min(1, rdt * 6));
    cam.position.copy(camPos); if (shake > 0) { cam.position.x += rnd(-shake, shake); cam.position.y += rnd(-shake, shake); shake *= Math.pow(0.02, rdt); }
    cam.lookAt(camLook);
    const fov = (portrait ? 72 : 58) + (I.hold.boost && S.boost > 0.05 ? 6 : 0); if (Math.abs(cam.fov - fov) > 0.1) { cam.fov = lerp(cam.fov, fov, rdt * 3); cam.updateProjectionMatrix(); }
  }
  resetView = () => { camPos.set(0, 0, 0); cam.fov = 58; cam.updateProjectionMatrix(); };
  return {
    update, S,
    dispose() { window.__HWshake = null; window.__HWfloor = null; clearInput(); },
    hooks: { rescue: why => triggerRescue(why || 'test'), finish: () => { S.s = LEN - 50; S.bossSpawned = true; if (S.boss && S.boss.alive) damage(S.boss, 9999); }, warp: f => { S.s = LEN * f; }, killBoss: () => { if (!S.bossSpawned) spawnBoss(); damage(S.boss, 9999); }, info: () => ({ s: S.s, len: LEN, hp: S.hp, rescues: S.rescues, kills: S.kills, bonds: S.bonds, enemies: enemies.filter(e => e.alive).length, boss: !!(S.boss && S.boss.alive), rescueActive: !!S.rescue }), crash: () => { S.u = EDGE + 50; } }
  };
}
