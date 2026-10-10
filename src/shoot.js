// SHOOTOUT mode: auto-aim auto-fire on foot; move with the stick, tap pumps/barrels, fire specials. Forgiving: SECOND WIND instead of death.
import { THREE, E, newScene, sunLight, followSun, makeObj, rnd, clamp, lerp, pick } from './engine.js';
import * as K from './brik/brik.js';
import * as W from './brik/world.js';
import * as MD from './models.js';
import { groundPlane, waterPlane } from './ground.js';
import { initFx, updateFx, boom, comic, smokePuff, sparkle, setWords, addFire } from './fx.js';
import { CB, initCombat, updateCombat, tracer, nearest, damage, fireRocket, lob, splash } from './combat.js';
import { I, controls, consume, readSteer, cooldown, clearInput } from './input.js';
import { hud, setBar, toast, radio } from './ui.js';
import { sfx, playTrack } from './audio.js';
import { SAVE } from './save.js';
import { QUIPS } from './data.js';
export function startShoot(L, ctx) {
  const van = L.theme === 'vancouver';
  const scene = newScene({ bloom: 0.6, bloomTh: 0.88 });
  K.sky(scene, van ? ['#0c1a4a', '#2a5aa8', '#7ab8e8', '#ffe0b0'] : ['#2a0a3a', '#7a2a6a', '#e06a5a', '#ffb060', '#ffe0a0']);
  scene.fog = new THREE.Fog(van ? 0x9ab8d8 : 0xd08070, 1600, 4200);
  const sun = sunLight(scene, { dir: van ? [300, 600, 300] : [-500, 300, -600], i: van ? 2.6 : 2.2, color: van ? 0xfff0d8 : 0xffb070, ext: 800 });
  initFx(scene); initCombat(scene); setWords(van ? 'canada' : 'boom');
  const up = SAVE.up; CB.dmgMul = 1 + up.dmg * 0.25; CB.boomMul = 1 + up.boom * 0.15; window.__HWfloor = () => 0;
  const XR = 300; // player x range
  const tappables = [];
  // ---- arena ----
  if (!van) {
    waterPlane(scene, '#2a5a9a', 12000, -14);
    groundPlane(scene, 900, 1700, '#8a5a2a', 0, 0, -550, { planks: true });
    const edge = []; for (let z = 300; z > -1400; z -= 40) for (const x of [-450, 450]) edge.push({ x, y: -6, z, sx: 30, sy: 14, sz: 38, color: '#6a3a1a', noStud: true }); K.instBricks(scene, edge);
    const piling = []; for (let z = 300; z > -1400; z -= 160) for (const x of [-450, 450]) piling.push({ x, y: 0, z, sx: 16, sy: 40, sz: 16, color: '#5a3412', noStud: true }); K.instBricks(scene, piling);
    // Gas 'n' Gulp station
    const st = makeObj(g => { const b = K.brick(30, 14, 14, '#f4f4f4'); g.add(b); const r = K.brick(34, 18, 2, '#c8102e'); r.position.y = 44.8; g.add(r); const s = MD.label("GAS 'N' GULP MARINE FUEL", 260, 40, '#c8102e', '#ffe14d'); s.position.set(0, 72, 72.5); g.add(s); const s2 = MD.label('ALL YOU CAN GULP', 120, 20, '#ffe14d', '#c8102e'); s2.position.set(-60, 26, 56.5); g.add(s2); });
    st.position.set(-560, 0, -900); st.rotation.y = 0.5; scene.add(st);
    // moored boats & escape boat
    for (let i = 0; i < 6; i++) { const b = MD.cutter(pick(['SEA-ATTLE', 'KNOT TODAY', 'REEL TIME', 'FISHFUL THINKING'])); b.position.set(i % 2 ? 560 : -560, -6, -200 - i * 220); b.rotation.y = i % 2 ? Math.PI : 0; scene.add(b); }
    const bv = MD.boat({ color: '#ff2e88', name: 'BOND VOYAGE' }); bv.position.set(260, -6, 260); bv.rotation.y = Math.PI / 2; scene.add(bv);
    for (let i = 0; i < 10; i++) { const c = MD.crate(pick(['#8a5a2a', '#6a4a2a', '#c8102e'])); c.position.set(rnd(-380, 380), 0, -1000 - rnd(300)); scene.add(c); }
    // pumps (tap to detonate)
    [[-200, -330], [200, -330], [-120, -560], [120, -560], [-260, -780], [260, -780], [0, -980]].forEach(([x, z]) => { const p = MD.pump(); p.scale.setScalar(2.2); p.position.set(x, 0, z); scene.add(p); addTappable(p, 'pump'); });
    // distant city + mountain
    for (let i = 0; i < 12; i++) W.tower(scene, -1800 + i * 320, -2600 - rnd(400), 10, 10, 20 + Math.floor(rnd(40)), pick(['#3a4a6a', '#4a3a5a', '#5a4a6a']), 0.6, i);
  } else {
    groundPlane(scene, 1400, 1900, '#5a5a62', 0, 0, -600);
    groundPlane(scene, 520, 1900, '#3a3a42', 0.4, 0, -600);
    const cols = ['#4a8a9a', '#5a9aaa', '#3a6a8a', '#7aaab8', '#c8d8e0'];
    for (let i = 0; i < 8; i++) { W.tower(scene, -620 - (i % 2) * 120, 100 - i * 230, 12, 10, 18 + ((i * 31) % 40), cols[i % 5], 0.3, i + 5); W.tower(scene, 620 + (i % 2) * 120, 100 - i * 230, 10, 12, 16 + ((i * 29) % 44), cols[(i + 2) % 5], 0.3, i + 11); }
    const s1 = W.sign("TIM HORTOFF'S", 200, 40, '#c8102e', '#fff'); s1.position.set(-460, 120, -300); s1.rotation.y = 0.6; scene.add(s1);
    const s2 = W.sign("SORRY WE'RE OPEN • SORRY", 220, 30, '#fff', '#c8102e', 'bold 80px Anton'); s2.position.set(470, 100, -500); s2.rotation.y = -0.6; scene.add(s2);
    const s3 = W.sign('POUTINE ✚ PHARMACY', 200, 30, '#2a5aa8', '#fff', 'bold 80px Anton'); s3.position.set(-470, 150, -900); s3.rotation.y = 0.5; scene.add(s3);
    W.terrain(scene, { x0: -350, z0: -420, w: 700, l: 40, step: 14, colors: ['#1f3a2a', '#2a4a3a', '#3a4a55'], snow: 60, hf: (x, z) => Math.max(0, 700 * Math.exp(-((x + 200) ** 2) / (2 * 900 ** 2)) + 200 + K.noise(x, z) * 140) });
    for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(new THREE.ConeGeometry(70, 180, 4), K.plastic('#f4f4f4')); s.position.set(-300 + i * 150, 90, -2300); scene.add(s); }
    for (let i = 0; i < 5; i++) { const c = MD.rcmpCar(); c.position.set(rnd(-300, 300), 0, -900 - i * 90); c.rotation.y = rnd(-0.5, 0.5) + Math.PI; scene.add(c); }
    [[-220, -320], [220, -360], [-80, -620], [140, -680], [-260, -900], [260, -940]].forEach(([x, z]) => { const b = MD.barrel(); b.scale.setScalar(1.8); b.position.set(x, 0, z); scene.add(b); addTappable(b, 'syrup'); });
    for (let i = 0; i < 8; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(30 + rnd(20), 30 + rnd(20), 1.2, 20), K.plastic('#b8600a', { rough: .05, opacity: .85 })); p.position.set(rnd(-400, 400), 1, -rnd(100, 1200)); p.scale.z = 0.6; scene.add(p); }
  }
  function addTappable(obj, kind) { const ring = new THREE.Mesh(new THREE.RingGeometry(40, 52, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe14d').multiplyScalar(1.6), transparent: true, opacity: .7, side: THREE.DoubleSide, toneMapped: false, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(obj.position.x, 2, obj.position.z); scene.add(ring); const t = { obj, kind, ring, alive: true, pos: obj.position }; tappables.push(t); }
  // ---- heroes ----
  const andy = MD.chars.andy({ armRot: [[1.5, 0.1], [1.5, -0.1]] }); scene.add(andy); const gun = K.blaster('#222', 26); K.attach(andy, 0, gun); gun.rotation.y = Math.PI / 2;
  andy.scale.setScalar(1.6);
  let julia = null, bob = null, jake = null;
  if (van) { julia = MD.chars.julia({ armRot: [[1.5, 0], [1.3, -0.3]] }); julia.scale.setScalar(1.6); const Lr = K.launcher(40, '#4f6b2e'); Lr.position.set(-7, 28, 6); Lr.rotation.y = -Math.PI / 2; julia.add(Lr); scene.add(julia);
    bob = MD.chars.bob({ angry: true, mouthOpen: true }); bob.scale.setScalar(1.6); scene.add(bob); jake = MD.chars.jake({ angry: true }); jake.scale.setScalar(1.6); scene.add(jake); }
  let eagle = null; if (up.eagle > 0) { eagle = MD.eagle(); eagle.scale.setScalar(1.5); scene.add(eagle); }
  const S = { x: 0, z: 0, hp: 100 + up.armor * 20, maxHp: 100 + up.armor * 20, fireT: 0, odT: 0, odCd: 0, nadeCd: 0, rocketCd: 0, catCd: 0, julT: 2, catAutoT: 6, wave: 0, toSpawn: 0, spawnT: 0, kills: 0, bonds: 0, rescues: 0, t: 0, done: false, boss: null, bossPhase: false, regenT: 0, slowT: 0, firstKill: false, chatterT: 5, hurtT: 0 };
  const WAVES = van ? [7, 9, 11] : [6, 8, 10];
  // ---- enemies (pooled minifigs) ----
  const mk = () => van ? MD.chars.mountie({ armRot: [[1.5, 0.1], [0.2, 0]] }) : MD.chars.cop({ armRot: [[1.5, 0.1], [0.2, 0]] });
  const pool = []; for (let i = 0; i < 9; i++) { const f = mk(); f.scale.setScalar(1.6); const bl = K.blaster(van ? '#5a3412' : '#222', 18); K.attach(f, 0, bl); bl.rotation.y = Math.PI / 2; f.visible = false; scene.add(f); pool.push({ f, used: false }); }
  const mooseP = van ? MD.moose() : null;
  const enemies = [];
  function spawn() { const slot = pool.find(p => !p.used); if (!slot) return false; slot.used = true; const f = slot.f; f.visible = true; f.rotation.set(0, 0, 0);
    const rider = van && Math.random() < 0.25; let mo = null; if (rider) { mo = mooseP.clone(); mo.scale.setScalar(1.7); scene.add(mo); }
    const e = { slot, f, mo, pos: new THREE.Vector3(rnd(-380, 380), 0, -1350 - rnd(200)), stop: new THREE.Vector3(rnd(-320, 320), 0, -rnd(380, 820)), hp: rider ? 8 : 3, maxHp: 3, r: 40, alive: true, st: 'walk', shootT: rnd(1.5, 3), t: 0 };
    e.kill = () => killEnemy(e); CB.targets.push(e); enemies.push(e); return true; }
  function killEnemy(e) { S.kills++; const p = e.pos.clone().add(new THREE.Vector3(0, 40, 0)); boom(p, 40, { burst: true, bricks: 0.7, color: van ? '#d11a1a' : '#22346e' }); sfx('boom', 0.7);
    if (van) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 1, 16), K.plastic('#7a2e06', { rough: .05, opacity: .9 })); sp.position.set(e.pos.x, 1.2, e.pos.z); sp.scale.z = 0.7; scene.add(sp); if (!S.firstKill) { S.firstKill = true; radio('NARRATOR', 'And the blood ran like maple syrup… Grade A. Dark. Robust taste.', 5); toast('THE BLOOD RAN LIKE MAPLE SYRUP', 'Grade A. Dark. Robust taste.', 3.4); } else if (Math.random() < 0.35) radio('MOUNTIE', pick(QUIPS.canada)); }
    else if (Math.random() < 0.3) radio('COP', pick(QUIPS.cops));
    e.fling = { v: new THREE.Vector3(rnd(-200, 200), rnd(380, 520), rnd(-300, -100)), w: new THREE.Vector3(rnd(-8, 8), rnd(-8, 8), rnd(-8, 8)), t: 0 };
    if (e.mo) { boom(e.mo.position.clone().add(new THREE.Vector3(0, 40, 0)), 30, { burst: 'SORRY, MOOSE!' }); const mo = e.mo; setTimeout(() => scene.remove(mo), 200); }
    S.bonds += 1; SAVE.bonds++; SAVE.totalBonds++; sfx('coin', 0.5); }
  // ---- boss ----
  function spawnBoss() { S.bossPhase = true; const obj = van ? MD.zamboni() : MD.forklift(); obj.scale.setScalar(2.2); scene.add(obj); const drv = van ? MD.chars.mountie({ armRot: [[1.2, 0], [1.2, 0]] }) : MD.chars.cop({ armRot: [[1.2, 0], [1.2, 0]] }); drv.position.set(0, van ? 27 : 18, van ? -10 : 0); obj.add(drv);
    const b = { obj, pos: obj.position, hp: 110, maxHp: 110, r: 90, alive: true, boss: true, t: 0, throwT: 3 }; obj.position.set(0, 0, -1500); obj.rotation.y = 0;
    b.kill = () => { finisher(b); }; S.boss = b; CB.targets.push(b); document.getElementById('boss').style.display = ''; setBar('boss', 1, van ? 'THE ZAMBONINATOR' : "SGT. PUDDLESWORTH'S FORKLIFT"); toast('BOSS!', van ? 'THE ZAMBONINATOR (it resurfaces you)' : 'Sgt. Dewey Puddlesworth on a forklift. Of paperwork.', 3); sfx('horn');
    radio(van ? 'ZAMBONI MOUNTIE' : 'SGT. PUDDLESWORTH', van ? "Sorry in advance, eh! I'm gonna resurface ya!" : "Helvie! I have 47 forms for you to sign!"); }
  function finisher(b) { E.timeScale = 0.2; S.slowT = 1.8; boom(b.pos.clone().add(new THREE.Vector3(0, 60, 0)), 170, { burst: van ? 'EH-BOOM!!' : 'KA-BOOM!!', fire: 5, bricks: 2.5 }); sfx('bigboom'); comic(null, van ? 'SORRY-SPLAT!!' : 'KA-BLAM!!', 1.6, { x: E.w / 2, y: E.h * 0.35, life: 2 }); setBar('boss', 0); scene.remove(b.obj);
    setTimeout(() => radio(van ? 'JULIA' : 'ANDY', pick(van ? QUIPS.julia : QUIPS.andy)), 700); S.done = true; setTimeout(() => ctx.win({ kills: S.kills, bonds: S.bonds, rescues: S.rescues, time: S.t, boss: true }), 2600); }
  // ---- HUD ----
  hud(`<div class="hbar" id="hp"><i></i><b>ANDY</b></div><div class="hbar" id="prog"><i></i><b>WAVE 1</b></div><div class="hbar" id="boss"><i></i><b></b></div><div id="bondsc">$0</div><button id="pause" class="pe">II</button><button id="resetv" class="pe">VIEW</button><div id="radio"></div><div id="stick"><i></i></div><div id="steerhint"></div><div class="ctl" id="ctlR"></div>`);
  const btns = van ? [{ id: 'rocket', label: 'ROCKETS', cls: 'pink', key: ['Space', 'KeyR'] }, { id: 'cat', label: 'CATS', key: ['KeyC'] }, { id: 'nade', label: 'FREEDOM<br>NADE', cls: 'red', key: ['KeyG'], row: true }, { id: 'od', label: 'EAGLE<br>9000', cls: 'blue', key: ['KeyE'] }]
    : [{ id: 'od', label: 'EAGLE<br>9000', cls: 'blue', key: ['Space', 'KeyE'] }, { id: 'nade', label: 'FREEDOM<br>NADE', cls: 'red', key: ['KeyG'] }];
  controls(btns, 'DRAG HERE TO MOVE · TAP GLOWING ' + (van ? 'SYRUP BARRELS' : 'PUMPS'));
  playTrack(L.music); setTimeout(() => toast(L.name, L.sub, 2.8), 200);
  setTimeout(() => toast(van ? 'TAP THE SYRUP BARRELS!' : 'TAP THE GAS PUMPS!', 'Auto-aim + auto-fire are on. Just move and tap.', 3), 3300);
  if (van) { setTimeout(() => radio('JULIA', 'Honey, I packed snacks and rockets.'), 1500); setTimeout(() => radio('BOB & JAKE', 'MRRROW. (We brought claws.)'), 5000); } else setTimeout(() => radio('ANDY', "Well, that escalated nicely."), 1500);
  const cam = E.cam; const camPos = new THREE.Vector3(); let shake = 0; window.__HWshake = k => shake = Math.min(12, shake + k * 5);
  document.getElementById('resetv').onclick = () => { camPos.set(0, 0, 0); };
  const ray = new THREE.Raycaster(); const tmp = new THREE.Vector3();
  S.wave = 0; S.toSpawn = WAVES[0]; S.spawnT = 1.5;
  function detonate(t) { if (!t.alive) return; t.alive = false; scene.remove(t.ring); const p = t.pos.clone().add(new THREE.Vector3(0, 30, 0)); scene.remove(t.obj);
    boom(p, 120 * CB.boomMul, { burst: t.kind === 'pump' ? pick(['KA-BLAM!', 'KA-BOOM!', 'GULP-BOOM!']) : pick(['SYRUP-SPLAT!', 'MAPLE-WHAM!', 'EH-BOOM!']), fire: 25, bricks: 1.6, color: t.kind === 'pump' ? '#c8102e' : '#b8600a' }); sfx('bigboom', 0.9);
    splash(p, 260 * CB.boomMul, 20, 'pump'); for (const o of tappables) if (o.alive && o.pos.distanceTo(t.pos) < 330) setTimeout(() => detonate(o), 260); }
  function update(dt, rdt) {
    if (consume('pause')) { ctx.pause(); return; }
    S.t += dt; readSteer();
    if (S.slowT > 0) { S.slowT -= rdt; if (S.slowT <= 0) E.timeScale = 1; }
    // move
    S.x = clamp(S.x + I.steer * 330 * dt, -XR, XR); S.z = clamp(S.z + (I.vy || 0) * 200 * dt, -120, 120);
    andy.position.set(S.x, 0, S.z); const tgt = nearest(andy.position, 1800, e => !e.boss || S.bossPhase);
    if (tgt) andy.rotation.y = Math.atan2(tgt.pos.x - S.x, tgt.pos.z - S.z); else andy.rotation.y = Math.PI;
    const walk = Math.abs(I.steer) + Math.abs(I.vy || 0); andy.userData.legs && andy.userData.legs.forEach((l, i) => l.rotation.x = Math.sin(S.t * 10) * 0.5 * walk * (i ? 1 : -1));
    if (julia) { julia.position.set(S.x - 70, 0, S.z + 40); if (tgt) julia.rotation.y = Math.atan2(tgt.pos.x - julia.position.x, tgt.pos.z - julia.position.z); bob.position.lerp(tmp.set(S.x + 70, 0, S.z + 30), dt * 4); jake.position.lerp(tmp.set(S.x + 120, 0, S.z + 70), dt * 3); if (tgt) { bob.lookAt(tgt.pos.x, 0, tgt.pos.z); jake.lookAt(tgt.pos.x, 0, tgt.pos.z); } }
    // fire
    S.odT -= dt; S.odCd -= dt; S.nadeCd -= dt; S.rocketCd -= dt; S.catCd -= dt;
    const rate = 6 * (1 + up.rate * 0.22) * (S.odT > 0 ? 3 : 1); S.fireT -= dt;
    if (S.fireT <= 0 && tgt) { S.fireT = 1 / rate; const from = andy.position.clone().add(new THREE.Vector3(0, 42, 0)); const to = tgt.pos.clone().add(new THREE.Vector3(rnd(-10, 10), tgt.boss ? 60 : 35, 0)); tracer(from, to, S.odT > 0 ? '#ff6a6a' : null); damage(tgt, 1, 'gun'); sfx(S.odT > 0 ? 'mg' : 'shot', 0.45); if (Math.random() < .3) sparkle(to, 3); }
    if (consume('od') && S.odCd <= 0) { S.odCd = 10; S.odT = 4; comic(andy.position.clone().add(new THREE.Vector3(0, 120, 0)), 'EAGLE SCREAMER 9000!', 1, { life: 1.4 }); radio('ANDY', 'Say hello to the Eagle Screamer 9000!'); sfx('horn'); }
    if (consume('nade') && S.nadeCd <= 0) { S.nadeCd = 4; const t2 = nearest(andy.position, 1600, e => !e.boss || S.bossPhase); const to = t2 ? t2.pos.clone() : new THREE.Vector3(S.x, 0, -500); lob(andy.position.clone().add(new THREE.Vector3(0, 50, 0)), to, { dmg: 9, radius: 170, word: pick(['FREEDOM-BOOM!', 'KA-BLAM!', 'POW!']), h: 220, model: MD.clone('nade', () => makeObj(g => { const s = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 10), K.plastic('#2a4a2a')); g.add(s); const p = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), K.plastic('#ccc')); p.position.y = 7; g.add(p); })) }); }
    if (julia) { S.julT -= dt; if (S.julT <= 0 && tgt) { S.julT = 2; fireRocket(julia.position.clone().add(new THREE.Vector3(0, 60, 0)), tgt, { dmg: 6, radius: 120, word: pick(['EH-BOOM!', 'KA-BLAM!', 'TOQUE-POW!']) }); }
      if (consume('rocket') && S.rocketCd <= 0) { S.rocketCd = 5; radio('JULIA', pick(["Reload? I don't know her.", 'Make it rain, sweetheart.', "Sorry? I'm not sorry. I'm from Ohio."])); const ts = CB.targets.filter(x => x.alive); for (let i = 0; i < 6; i++) setTimeout(() => { const t3 = ts.length ? ts[i % ts.length] : null; fireRocket(julia.position.clone().add(new THREE.Vector3(0, 60, 0)), t3 && t3.alive ? t3 : null, { dmg: 9, radius: 140 }); }, i * 110); }
      S.catAutoT -= dt; if ((consume('cat') && S.catCd <= 0) || (S.catAutoT <= 0 && tgt)) { const manual = S.catAutoT > 0; S.catAutoT = 9; if (manual) S.catCd = 6; catAttack(); } }
    if (eagle) { const a = S.t * 2.2; eagle.position.set(S.x + Math.cos(a) * 120, 170 + Math.sin(a * 2) * 20, S.z - 60 + Math.sin(a) * 80); if (tgt) { eagle.position.lerp(tgt.pos.clone().add(new THREE.Vector3(0, 80, 0)), 0.35); if (Math.random() < dt * 1.5 * up.eagle) { damage(tgt, 1.5, 'eagle'); comic(tgt.pos, 'SCREECH!', 0.6); } } eagle.lookAt(andy.position); }
    cooldown('od', S.odCd / 10, S.odCd <= 0); cooldown('nade', S.nadeCd / 4, S.nadeCd <= 0); cooldown('rocket', S.rocketCd / 5, S.rocketCd <= 0); cooldown('cat', S.catCd / 6, S.catCd <= 0);
    // taps
    while (I.taps.length) { const tp = I.taps.shift(); ray.setFromCamera(new THREE.Vector2(tp.x / E.w * 2 - 1, -(tp.y / E.h) * 2 + 1), cam); let best = null, bd = 1e9;
      for (const t of tappables) { if (!t.alive) continue; const hit = ray.intersectObject(t.obj, true)[0]; if (hit) { best = t; break; } const sp = tmp.copy(t.pos).add(new THREE.Vector3(0, 30, 0)).project(cam); const dx = (sp.x * 0.5 + 0.5) * E.w - tp.x, dy = (-sp.y * 0.5 + 0.5) * E.h - tp.y; const d = Math.hypot(dx, dy); if (d < 70 && d < bd) { bd = d; best = t; } }
      if (best) detonate(best); }
    for (const t of tappables) if (t.alive) { t.ring.material.opacity = 0.4 + Math.sin(S.t * 6) * 0.3; t.ring.scale.setScalar(1 + Math.sin(S.t * 6) * 0.08); }
    // waves
    const alive = enemies.filter(e => e.alive).length;
    if (!S.bossPhase) { S.spawnT -= dt; if (S.toSpawn > 0 && S.spawnT <= 0 && alive < 7) { if (spawn()) { S.toSpawn--; S.spawnT = rnd(0.7, 1.5); } }
      if (S.toSpawn === 0 && alive === 0) { S.wave++; if (S.wave < WAVES.length) { S.toSpawn = WAVES[S.wave]; S.spawnT = 2; toast('WAVE ' + (S.wave + 1), van ? pick(['More Mounties. Sorry in advance.', 'They brought a moose.']) : pick(['Backup has arrived (with lattes)', 'They called the K-9 unit. It is a poodle.']), 2); } else spawnBoss(); }
      setBar('prog', (S.wave + (1 - (S.toSpawn + alive) / WAVES[Math.min(S.wave, WAVES.length - 1)])) / (WAVES.length + 1), 'WAVE ' + Math.min(S.wave + 1, WAVES.length)); }
    else setBar('prog', 0.9, 'BOSS');
    S.chatterT -= dt; if (S.chatterT <= 0) { S.chatterT = rnd(8, 13); if (alive) radio(van ? 'MOUNTIE' : 'COP', pick(van ? QUIPS.canada : QUIPS.cops)); }
    for (let i = enemies.length - 1; i >= 0; i--) { const e = enemies[i]; e.t += dt;
      if (!e.alive) { const fl = e.fling; fl.t += dt; fl.v.y -= 700 * dt; e.f.position.addScaledVector(fl.v, dt); e.f.rotation.x += fl.w.x * dt; e.f.rotation.z += fl.w.z * dt; if (fl.t > 1.6 || e.f.position.y < -50) { e.f.visible = false; e.slot.used = false; enemies.splice(i, 1); const ti = CB.targets.indexOf(e); if (ti >= 0) CB.targets.splice(ti, 1); } continue; }
      if (e.st === 'walk') { const d = tmp.copy(e.stop).sub(e.pos); const L2 = d.length(); if (L2 < 10) e.st = 'shoot'; else e.pos.addScaledVector(d.normalize(), Math.min(L2, (e.mo ? 160 : 110) * dt)); }
      else { e.shootT -= dt; if (e.shootT <= 0) { e.shootT = rnd(1.8, 3.2); const from = e.pos.clone().add(new THREE.Vector3(0, e.mo ? 90 : 40, 0)); const hitP = Math.random() < 0.35; const to = andy.position.clone().add(new THREE.Vector3(hitP ? 0 : rnd(-80, 80), 40, hitP ? 0 : rnd(-60, 60))); tracer(from, to, van ? '#ff6060' : '#80c0ff'); sfx('shot', 0.25); if (hitP) hurt(3.5); } e.pos.x += Math.sin(e.t * 1.3 + i) * 20 * dt; }
      e.f.position.set(e.pos.x, e.mo ? 50 : 0, e.pos.z); e.f.lookAt(andy.position.x, e.f.position.y, andy.position.z); if (e.mo) { e.mo.position.set(e.pos.x, 0, e.pos.z); e.mo.rotation.y = e.f.rotation.y; }
      if (e.hitT > 0) { e.hitT -= dt; e.f.position.y += 3; }
      e.f.userData.legs && e.st === 'walk' && e.f.userData.legs.forEach((l, k) => l.rotation.x = Math.sin(e.t * 9) * 0.6 * (k ? 1 : -1)); }
    // boss
    const b = S.boss; if (b && b.alive) { b.t += dt; const tz = -380; if (b.pos.z < tz) b.pos.z += 120 * dt; b.pos.x = Math.sin(b.t * 0.5) * 200; b.obj.rotation.y = Math.atan2(S.x - b.pos.x, S.z - b.pos.z) * 0.3; setBar('boss', b.hp / b.maxHp);
      b.throwT -= dt; if (b.throwT <= 0 && b.pos.z > -1000) { b.throwT = rnd(2.4, 3.6); const to = andy.position.clone().add(new THREE.Vector3(rnd(-60, 60), 0, rnd(-40, 40))); const mark = new THREE.Mesh(new THREE.RingGeometry(50, 70, 24), new THREE.MeshBasicMaterial({ color: 0xff2020, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false })); mark.rotation.x = -Math.PI / 2; mark.position.set(to.x, 2, to.z); scene.add(mark);
        lob(b.pos.clone().add(new THREE.Vector3(0, 80, 0)), to, { t: 1.3, dmg: 0, radius: 90, word: van ? 'ICE-CAPADE!' : 'PAPER-CUT!', h: 260, model: MD.clone(van ? 'ice' : 'paper', () => makeObj(g => { const c = K.brick(3, 3, 3, van ? '#bfe8ff' : '#f4f4f4', van ? { opacity: .8 } : {}); g.add(c); })), onHit: p => { scene.remove(mark); if (p.distanceTo(andy.position) < 90) hurt(7); } });
        radio(van ? 'ZAMBONI MOUNTIE' : 'SGT. PUDDLESWORTH', van ? pick(['Fresh ice, comin\' through, sorry!', 'Ya need a resurfacing, bud!']) : pick(['Form 27B: RESISTING ARREST!', 'Sign here! And here! And HERE!'])); } }
    // health / second wind
    S.regenT -= dt; if (S.regenT <= 0) S.hp = Math.min(S.maxHp, S.hp + 4 * dt);
    if (S.hp <= 0 && !S.done) { S.rescues++; S.hp = S.maxHp; comic(null, 'SECOND WIND!', 1.5, { x: E.w / 2, y: E.h * 0.35, life: 1.8, pal: ['#fff3a0', '#e0a010'] }); sfx('choir'); radio('ANDY', pick(['Not today, pal. I have bonds to cash.', 'Jesus, take the wheel! ...wait, I\'m on foot. Still counts!'])); for (const e of enemies) if (e.alive && e.pos.distanceTo(andy.position) < 600) damage(e, 99, 'wind'); }
    setBar('hp', S.hp / S.maxHp); document.getElementById('bondsc').textContent = '$' + (S.bonds * 0.1).toFixed(1) + 'M';
    // camera
    const portrait = E.h > E.w; const want = tmp.set(S.x * 0.7, portrait ? 300 : 210, S.z + (portrait ? 470 : 330));
    if (camPos.lengthSq() === 0) camPos.copy(want); camPos.lerp(want, Math.min(1, rdt * 4)); cam.position.copy(camPos); if (shake > 0) { cam.position.x += rnd(-shake, shake); cam.position.y += rnd(-shake, shake); shake *= Math.pow(0.02, rdt); }
    cam.lookAt(S.x * 0.35, 30, S.z - 480); const fov = portrait ? 70 : 55; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    followSun(sun, new THREE.Vector3(S.x, 0, -400));
    updateFx(dt); updateCombat(dt);
  }
  function catAttack() { const t = nearest(andy.position, 2000, e => !e.boss || S.bossPhase); if (!t) return; sfx('meow'); comic(bob.position.clone().add(new THREE.Vector3(0, 60, 0)), 'MRRROWW!', 0.7);
    // Bob pounces (arc), Jake lobs a hairball at the target's friends
    const from = bob.position.clone(); const to = t.pos.clone(); let k = 0; const iv = setInterval(() => { k += 0.08; bob.position.lerpVectors(from, to, Math.min(1, k)); bob.position.y = Math.sin(Math.min(1, k) * Math.PI) * 160; if (k >= 1) { clearInterval(iv); sfx('hiss'); comic(t.pos, 'HISS-POW!', 1); damage(t, 12, 'bob'); radio('BOB', pick(['*pounces directly onto Mountie face*', '*scratches 47 times per second*'])); } }, 30);
    lob(jake.position.clone().add(new THREE.Vector3(0, 30, 0)), t.pos.clone().add(new THREE.Vector3(rnd(-60, 60), 0, rnd(-60, 60))), { dmg: 10, radius: 160, word: pick(['HAIRBALL-BOOM!', 'SORRY-SPLAT!']), onHit: () => radio('JAKE', '*hurk* ...HAIRBALL OUT!') }); }
  function hurt(d) { S.hp -= d / (1 + up.armor * 0.15); S.regenT = 3; sfx('hurt', 0.5); shake = Math.min(12, shake + 3); }
  return { update, S, dispose() { window.__HWshake = null; clearInput(); },
    hooks: { finish: () => { for (const e of enemies) if (e.alive) damage(e, 999); S.wave = WAVES.length; S.toSpawn = 0; if (!S.boss) spawnBoss(); setTimeout(() => S.boss && damage(S.boss, 9999), 300); }, killBoss: () => { if (!S.boss) spawnBoss(); damage(S.boss, 9999); }, tapPump: () => { const t = tappables.find(t => t.alive); if (t) { const sp = t.pos.clone().add(new THREE.Vector3(0, 30, 0)).project(cam); I.taps.push({ x: (sp.x * 0.5 + 0.5) * E.w, y: (-sp.y * 0.5 + 0.5) * E.h }); return { x: (sp.x * 0.5 + 0.5) * E.w, y: (-sp.y * 0.5 + 0.5) * E.h }; } }, pumpsLeft: () => tappables.filter(t => t.alive).length, info: () => ({ wave: S.wave, hp: S.hp, kills: S.kills, enemies: enemies.filter(e => e.alive).length, boss: !!(S.boss && S.boss.alive), rescues: S.rescues }), hurt: d => { S.hp -= d; } } };
}
