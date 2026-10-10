// FINALE: Mustache Mountain. Climb (hold CLIMB, dodge pucks), then 3-phase boss vs PROPAGANDIA ONE, then the celebration.
import { THREE, E, newScene, sunLight, followSun, makeObj, rnd, clamp, lerp, pick } from './engine.js';
import * as K from './brik/brik.js';
import * as W from './brik/world.js';
import * as MD from './models.js';
import { groundPlane } from './ground.js';
import { initFx, updateFx, boom, comic, sparkle, smokePuff, setWords, addFire } from './fx.js';
import { CB, initCombat, updateCombat, tracer, nearest, damage, fireRocket, lob } from './combat.js';
import { I, controls, consume, readSteer, cooldown, clearInput } from './input.js';
import { hud, setBar, toast, radio, shower, fade } from './ui.js';
import { sfx, playTrack } from './audio.js';
import { SAVE } from './save.js';
import { QUIPS } from './data.js';
export function flagFor(scene) { // a US-style flag that we place at a hand's WORLD position each frame (always upright, never twisted)
  const g = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 120, 10), K.plastic('#d8dce4', { metal: .8, rough: .2 })); pole.position.y = 40; g.add(pole);
  const tex = K.canvasTex(380, 200, (x, w, h) => { for (let i = 0; i < 13; i++) { x.fillStyle = i % 2 ? '#fff' : '#c8102e'; x.fillRect(0, i * h / 13, w, h / 13); } x.fillStyle = '#1a2a6a'; x.fillRect(0, 0, w * 0.42, h * 7 / 13); x.fillStyle = '#fff'; for (let i = 0; i < 5; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.arc(14 + i * 30, 12 + j * 24, 4, 0, 7); x.fill(); } });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(64, 38, 12, 2), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: .7 })); cloth.position.set(33, 80, 0); g.add(cloth); g.userData.cloth = cloth;
  const ball = new THREE.Mesh(new THREE.SphereGeometry(3, 10, 8), K.plastic('#e8b22a', { metal: 1, rough: .2 })); ball.position.y = 101; g.add(ball); scene.add(g); return g;
}
export function waveFlag(f, t) { const p = f.userData.cloth.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, Math.sin(x * 0.12 + t * 6) * (x + 32) * 0.12); } p.needsUpdate = true; f.userData.cloth.geometry.computeVertexNormals(); }
const _w = new THREE.Vector3();
export function holdFlag(f, fig, side = 0) { fig.userData.arms[side].hand.getWorldPosition(_w); f.position.copy(_w).add(new THREE.Vector3(0, -40 * fig.scale.y / 1.6, 0)); f.scale.setScalar(fig.scale.y / 1.6); }
export function startFinale(L, ctx) {
  const scene = newScene({ bloom: 0.7, bloomTh: 0.86 });
  K.sky(scene, ['#12082e', '#4a1a6a', '#c03a6a', '#ff8a3a', '#ffd070']); scene.fog = new THREE.Fog(0xc07090, 1800, 7000);
  const sun = sunLight(scene, { dir: [-400, 300, -500], color: 0xffa060, i: 2.6, ext: 700 });
  initFx(scene); initCombat(scene); setWords('boom'); const up = SAVE.up; CB.dmgMul = 1 + up.dmg * 0.25; CB.boomMul = 1 + up.boom * 0.15; window.__HWfloor = () => S.floor;
  // distant range + clouds
  W.terrain(scene, { x0: -500, z0: -420, w: 1000, l: 60, step: 14, y0: -1300, colors: ['#2a2a4a', '#3a3a5a', '#5a4a6a'], snow: 50, hf: (x, z) => Math.max(0, 600 + 400 * Math.sin(x * 0.002) * Math.cos(z * 0.003) + K.noise(x, z) * 200) });
  const cloudProto = makeObj(g => { for (let k = 0; k < 7; k++) { const b = K.brick(5 + Math.floor(rnd(5)), 3 + Math.floor(rnd(4)), 3, '#ffd8e8'); b.position.set(rnd(-60, 60), rnd(-8, 8), rnd(-30, 30)); g.add(b); } });
  for (let i = 0; i < 16; i++) { const c = cloudProto.clone(); c.scale.setScalar(rnd(2, 4)); c.position.set(-2400 + i * 320, -500 - rnd(500), -1200 - rnd(1600)); scene.add(c); }
  // climb staircase: 60 steps up the face (z negative, y up)
  const steps = []; const NST = 60; for (let i = 0; i < NST; i++) { const y = i * 24, z = -i * 40; steps.push({ x: 0, y: y - 12, z, sx: 360, sy: 24, sz: 40, color: pick(['#5a5a62', '#6a6a72', '#7a7a82']), noStud: true }); for (const sx of [-1, 1]) steps.push({ x: sx * (230 + rnd(40)), y: y + rnd(30), z, sx: 120, sy: 80 + rnd(60), sz: 40, color: pick(['#4a4a52', '#5a5a62']), noStud: true }); if (i > NST - 12) for (const sx of [-1, 1]) steps.push({ x: sx * 120, y: y + 14, z, sx: 60, sy: 4, sz: 40, color: '#f4f4f4', noStud: true }); }
  K.instBricks(scene, steps);
  const TOPY = NST * 24, TOPZ = -NST * 40;
  // summit plate
  const summit = groundPlane(scene, 900, 700, '#7a7a82', TOPY, 0, TOPZ - 300); const snow = groundPlane(scene, 700, 500, '#f4f4f4', TOPY + 0.5, 0, TOPZ - 320);
  const sign = MD.label('MUSTACHE MOUNTAIN · ELEV. RIDICULOUS', 260, 30, '#6a1ba8', '#f2c21a'); sign.position.set(-260, TOPY + 60, TOPZ - 120); sign.rotation.y = 0.4; scene.add(sign);
  // heroes
  const andy = MD.chars.andy({ armRot: [[1.5, 0.1], [1.5, -0.1]] }); andy.scale.setScalar(1.6); scene.add(andy); const gun = K.blaster('#222', 26); K.attach(andy, 0, gun); gun.rotation.y = Math.PI / 2;
  const jul = MD.chars.julia({ armRot: [[1.5, 0], [1.3, -0.3]] }); jul.scale.setScalar(1.6); const Lr = K.launcher(40, '#4f6b2e'); Lr.position.set(-7, 28, 6); Lr.rotation.y = -Math.PI / 2; jul.add(Lr); scene.add(jul);
  const bob = MD.chars.bob({ angry: true }); bob.scale.setScalar(1.6); scene.add(bob); const jake = MD.chars.jake({ angry: true }); jake.scale.setScalar(1.6); scene.add(jake);
  // heli + general
  const heli = makeObj(() => W.heli(), { merge: false }); heli.scale.setScalar(1.6); scene.add(heli);
  const blades = []; heli.traverse(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width === 150) blades.push(o); });
  const gen = MD.chars.general({ armRot: [[0.6, 0.3], [2.4, -0.4]] }); gen.position.set(0, -10, 20); gen.scale.setScalar(0.9); heli.add(gen);
  const shield = new THREE.Mesh(new THREE.SphereGeometry(190, 24, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#b060ff').multiplyScalar(1.4), transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); scene.add(shield);
  const S = { phase: 'climb', prog: 0, lane: 0, x: 0, t: 0, floor: 0, hp: 100 + up.armor * 20, maxHp: 100 + up.armor * 20, puckT: 2, pucks: [], drones: [], rings: [], fireT: 0, julT: 1.5, ringT: 3, bossHp: 300, kills: 0, bonds: 0, rescues: 0, done: false, finalReady: false, finalT: 0, catT: 5, nadeCd: 0, regenT: 0, ang: 0 };
  const boss = { pos: heli.position, hp: 300, maxHp: 300, r: 140, alive: true, boss: true, invuln: true, kill: () => { } }; boss.onHit = () => { if (S.phase === 'p2' && boss.hp <= boss.maxHp * 0.34) startP3(); };
  hud(`<div class="hbar" id="hp"><i></i><b>HELVIES</b></div><div class="hbar" id="prog"><i></i><b>CLIMB</b></div><div class="hbar" id="boss"><i></i><b></b></div><div id="bondsc">$0</div><button id="pause" class="pe">II</button><button id="resetv" class="pe">VIEW</button><div id="radio"></div><div id="stick"><i></i></div><div id="steerhint"></div><div class="ctl" id="ctlR"></div>`);
  controls([{ id: 'climb', label: 'HOLD<br>CLIMB', cls: 'blue', key: ['ArrowUp', 'KeyW', 'Space'] }], 'DRAG LEFT/RIGHT TO DODGE PUCKS');
  playTrack('finale'); toast('MUSTACHE MOUNTAIN', 'Climb! Dodge the puck avalanche!', 2.8);
  setTimeout(() => radio('GENERALISSIMO', 'You will never reach the top! The top is MINE! Like everything!'), 2500); sfx('megaphone');
  const puckProto = MD.puck(); const droneProto = MD.drone();
  const cam = E.cam; const camPos = new THREE.Vector3(); let shake = 0; window.__HWshake = k => shake = Math.min(12, shake + k * 5);
  document.getElementById('resetv').onclick = () => camPos.set(0, 0, 0);
  const tmp = new THREE.Vector3();
  const flag = flagFor(scene); flag.visible = false;
  function stepPos(p) { const i = p * (NST - 1); return { y: i * 24, z: -i * 40 }; }
  function toBoss() { S.phase = 'p1'; S.floor = TOPY; controls([{ id: 'nade', label: 'FREEDOM<br>NADE', cls: 'red', key: ['KeyG'] }, { id: 'cat', label: 'CATS', key: ['KeyC'] }, { id: 'final', label: 'FINAL<br>ROCKET', cls: 'pink', key: ['Space', 'KeyF'], row: true }], 'DRAG TO MOVE · DODGE THE SONIC RINGS');
    document.getElementById('b_final').style.visibility = 'hidden'; document.getElementById('boss').style.display = ''; setBar('boss', 1, 'PROPAGANDIA ONE · FLAG FORCE FIELD');
    toast('PHASE 1', 'Shoot down the flag drones!', 2.4); radio('GENERALISSIMO', 'Every flag is MY flag! Drones, salute them TO DEATH!'); sfx('megaphone'); playTrack('finale');
    for (let i = 0; i < 9; i++) setTimeout(() => spawnDrone(), i * 700); S.x = 0; }
  function spawnDrone() { const d = droneProto.clone(); d.scale.setScalar(2); S.dsp = (S.dsp || 0) + 1; const e = { obj: d, pos: d.position, hp: 4, maxHp: 4, r: 40, alive: true, t: rnd(6), home: new THREE.Vector3(rnd(-320, 320), TOPY + 140 + rnd(120), TOPZ - 380 - rnd(200)), shootT: rnd(2, 4) }; d.position.copy(heli.position); scene.add(d);
    e.kill = () => { S.kills++; boom(d.position.clone(), 50, { burst: pick(['KA-BLAM!', 'POW!', 'ZOWIE!', 'FLAG-SPLAT!']) }); sfx('boom', 0.7); scene.remove(d); }; CB.targets.push(e); S.drones.push(e); }
  function startP2() { S.phase = 'p2'; boss.invuln = false; shield.visible = false; toast('PHASE 2', 'Shield down! Dodge the megaphone rings!', 2.6); comic(null, 'FORCE-FIELD-POP!', 1.2, { x: E.w / 2, y: E.h * 0.3 }); radio('GENERALISSIMO', 'YOU WILL LOVE ME! LOUDER! LOVE ME LOUDER!'); sfx('megaphone'); setBar('boss', boss.hp / boss.maxHp, 'PROPAGANDIA ONE'); }
  function startP3() { if (S.phase !== 'p2') return; S.phase = 'p3'; boss.invuln = true; S.finalReady = true; S.finalT = 0; const b = document.getElementById('b_final'); b.style.visibility = ''; cooldown('final', 0, true); toast('PHASE 3', 'Tap FINAL ROCKET!', 3); radio('JULIA', 'Honey? I saved the big one.'); setTimeout(() => radio('GENERALISSIMO', 'Nooo! Not my second-best mustache!'), 1500); }
  function finalRocket() { if (!S.finalReady || S.phase !== 'p3') return; S.finalReady = false; S.phase = 'final'; document.getElementById('b_final').style.visibility = 'hidden'; E.timeScale = 0.25; radio('JULIA', 'Make it rain, sweetheart.'); sfx('rocket'); S.rk = { m: MD.rocket(), t: 0 }; S.rk.m.scale.setScalar(3); S.rk.m.position.copy(jul.position).add(new THREE.Vector3(0, 70, 0)); S.rk.from = S.rk.m.position.clone(); scene.add(S.rk.m); }
  function heliDown() { boss.alive = false; S.phase = 'celebrate'; S.celT = 0; E.timeScale = 0.2; S.slowT = 2.2; const p = heli.position.clone(); scene.remove(S.rk.m);
    boom(p, 220, { burst: 'KA-BOOM!!', fire: 6, bricks: 3, color: '#e8b22a' }); setTimeout(() => boom(p.clone().add(new THREE.Vector3(80, 40, 0)), 150, { burst: 'ZOWIE!!', color: '#e8b22a' }), 250); sfx('bigboom'); sfx('bigboom', 0.6);
    comic(null, 'FREEDOM!!!', 1.8, { x: E.w / 2, y: E.h * 0.32, life: 3 }); setBar('boss', 0, 'PROPAGANDIA ONE: DOWN');
    // general flies, mustache drifts
    heli.remove(gen); gen.position.copy(p); gen.scale.setScalar(1.6); scene.add(gen); S.genV = new THREE.Vector3(-260, 420, 160);
    const m = new THREE.Mesh(new THREE.TorusGeometry(14, 3.4, 8, 20, Math.PI), K.plastic('#1a0e08', { rough: .6 })); m.position.copy(p).add(new THREE.Vector3(0, 40, 0)); scene.add(m); S.mus = m;
    heli.visible = false; for (const d of S.drones) if (d.alive) damage(d, 99);
    radio('GENERALISSIMO', 'MY MONOCLE!! MY MUSTACHE!! MY... EVERYTHING!!', 4); setTimeout(() => { radio('ANDY', 'Nobody out-guns a Helvie, pal.'); shower(70); sfx('fanfare'); }, 1400); setTimeout(() => radio('JULIA', "Sorry? I'm not sorry. I'm from Ohio."), 3200); setTimeout(() => radio('BOB & JAKE', '*bat the falling mustache like a toy*'), 4800);
    flag.visible = true; andy.remove(gun); }
  function update(dt, rdt) {
    if (consume('pause')) { ctx.pause(); return; }
    S.t += dt; readSteer(); if (S.slowT > 0) { S.slowT -= rdt; if (S.slowT <= 0) E.timeScale = 1; }
    blades.forEach((b, i) => b.rotation.y += dt * 30);
    if (S.phase === 'climb') {
      const sp = I.hold.climb ? 0.045 : 0.012; S.prog = Math.min(1, S.prog + sp * dt); S.x = clamp(S.x + I.steer * 300 * dt, -140, 140);
      const sp0 = stepPos(S.prog); andy.position.set(S.x, sp0.y, sp0.z); andy.rotation.y = Math.PI; const bob1 = Math.abs(Math.sin(S.t * (I.hold.climb ? 12 : 5))) * 6; andy.position.y += bob1;
      const sj = stepPos(Math.max(0, S.prog - 0.03)); jul.position.set(S.x + 80, sj.y + bob1, sj.z); jul.rotation.y = Math.PI; const sc = stepPos(Math.max(0, S.prog - 0.05)); bob.position.set(S.x - 70, sc.y, sc.z); bob.rotation.y = Math.PI; jake.position.set(S.x + 150, sc.y, sc.z + 20); jake.rotation.y = Math.PI;
      andy.userData.arms.forEach((a, i) => a.sh.rotation.x = -2.2 - Math.sin(S.t * 10 + i * 3) * 0.6 * (I.hold.climb ? 1 : 0.3));
      S.puckT -= dt; if (S.puckT <= 0 && S.prog < 0.95) { S.puckT = rnd(1.0, 1.8); const p = puckProto.clone(); p.scale.setScalar(2.4); const lx = pick([-110, 0, 110]); const st = stepPos(Math.min(1, S.prog + 0.18)); p.position.set(lx, st.y + 30, st.z); scene.add(p); S.pucks.push({ p, lx, prog: S.prog + 0.18 }); }
      for (let i = S.pucks.length - 1; i >= 0; i--) { const q = S.pucks[i]; q.prog -= 0.09 * dt; const st = stepPos(Math.max(0, q.prog)); q.p.position.set(q.lx, st.y + 22 + Math.abs(Math.sin(S.t * 10 + i)) * 20, st.z); q.p.rotation.x += dt * 10;
        if (!q.hit && Math.abs(q.prog - S.prog) < 0.012 && Math.abs(q.lx - S.x) < 70) { q.hit = 1; comic(andy.position, 'PUCK-POW!', 0.9); sfx('crash', 0.6); S.prog = Math.max(0, S.prog - 0.02); radio(pick(['ANDY', 'JULIA']), pick(['Ow! Canadian hail!', 'Who throws a puck at a retiree?!'])); }
        if (q.prog < S.prog - 0.15) { scene.remove(q.p); S.pucks.splice(i, 1); } }
      setBar('prog', S.prog, 'CLIMB ' + Math.round(S.prog * 100) + '%'); setBar('hp', 1);
      heli.position.set(Math.sin(S.t * 0.5) * 400, TOPY + 300, TOPZ - 700); heli.rotation.y = Math.PI + Math.sin(S.t * 0.5) * 0.3; shield.position.copy(heli.position);
      if (S.prog >= 1) { S.pucks.forEach(q => scene.remove(q.p)); S.pucks = []; toBoss(); }
      const want = tmp.set(S.x * 0.5, andy.position.y + 160, andy.position.z + 330); if (camPos.lengthSq() === 0) camPos.copy(want); camPos.lerp(want, Math.min(1, rdt * 3)); cam.position.copy(camPos); cam.lookAt(S.x * 0.3, andy.position.y + 80, andy.position.z - 300);
    } else {
      // summit combat / celebration
      if (S.phase !== 'celebrate' && S.phase !== 'final') S.x = clamp(S.x + I.steer * 330 * dt, -220, 220);
      andy.position.set(S.x, TOPY, TOPZ - 120); jul.position.set(S.x + 90, TOPY, TOPZ - 100); bob.position.lerp(tmp.set(S.x - 80, TOPY, TOPZ - 90), dt * 4); jake.position.lerp(tmp.set(S.x + 170, TOPY, TOPZ - 70), dt * 3);
      S.ang += dt * 0.35; if (boss.alive) { heli.position.set(Math.sin(S.ang) * 480, TOPY + 260 + Math.sin(S.t * 1.3) * 40, TOPZ - 820 + Math.cos(S.ang) * 120); heli.rotation.set(0.1, Math.atan2(andy.position.x - heli.position.x, andy.position.z - heli.position.z), -Math.cos(S.ang) * 0.2); shield.position.copy(heli.position); }
      const tg = nearest(andy.position, 2500, e => e !== boss || !boss.invuln) || (boss.alive ? boss : null);
      [andy, jul].forEach(f => { if (tg) f.rotation.y = Math.atan2(tg.pos.x - f.position.x, tg.pos.z - f.position.z); });
      if (S.phase === 'p1' || S.phase === 'p2' || S.phase === 'p3') {
        S.fireT -= dt; if (S.fireT <= 0 && tg) { S.fireT = 1 / (6 * (1 + up.rate * 0.22)); const from = andy.position.clone().add(new THREE.Vector3(0, 45, 0)); tracer(from, tg.pos.clone().add(new THREE.Vector3(rnd(-10, 10), 10, 0))); damage(tg, 1, 'gun'); sfx('mg', 0.4); }
        S.julT -= dt; if (S.julT <= 0 && tg) { S.julT = 1.8; fireRocket(jul.position.clone().add(new THREE.Vector3(0, 70, 0)), tg, { dmg: S.phase === 'p2' ? 9 : 6, radius: 120, word: pick(['KA-BLAM!', 'ZOWIE!', 'WHAM!']) }); }
        S.nadeCd -= dt; S.catT -= dt; if (consume('nade') && S.nadeCd <= 0 && tg) { S.nadeCd = 3; lob(andy.position.clone().add(new THREE.Vector3(0, 60, 0)), tg.pos.clone(), { dmg: 10, radius: 160, word: 'FREEDOM-BOOM!', h: 260 }); }
        if ((consume('cat') && S.catT <= 0) && tg) { S.catT = 5; sfx('meow'); lob(jake.position.clone().add(new THREE.Vector3(0, 30, 0)), tg.pos.clone(), { dmg: 10, radius: 150, word: 'HAIRBALL-BOOM!', onHit: () => sfx('hiss') }); comic(bob.position, 'HISS-POW!', 0.8); }
        cooldown('nade', S.nadeCd / 3, S.nadeCd <= 0); cooldown('cat', S.catT / 5, S.catT <= 0);
      }
      // drones
      for (let i = S.drones.length - 1; i >= 0; i--) { const d = S.drones[i]; if (!d.alive) { S.drones.splice(i, 1); CB.targets.splice(CB.targets.indexOf(d), 1); continue; } d.t += dt; d.obj.position.lerp(tmp.copy(d.home).add(new THREE.Vector3(Math.sin(d.t) * 60, Math.sin(d.t * 2) * 20, 0)), dt * 1.5); d.obj.lookAt(andy.position); d.shootT -= dt; if (d.shootT <= 0) { d.shootT = rnd(2.5, 4); const hit = Math.random() < 0.3; tracer(d.obj.position.clone(), andy.position.clone().add(new THREE.Vector3(hit ? 0 : rnd(-80, 80), 40, 0)), '#c080ff'); if (hit) hurt(3); } }
      if (S.phase === 'p1') { setBar('prog', 1 - S.drones.length / 9, 'DRONES'); if (S.drones.length === 0 && (S.dsp || 0) >= 9) startP2(); }
      if (S.phase === 'p2') { setBar('boss', boss.hp / boss.maxHp); setBar('prog', 1 - boss.hp / boss.maxHp, 'PHASE 2'); S.ringT -= dt; if (S.ringT <= 0) { S.ringT = 2.3; const tx = clamp(S.x + rnd(-40, 40), -220, 220); const r = new THREE.Mesh(new THREE.TorusGeometry(50, 8, 8, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff60ff').multiplyScalar(1.8), toneMapped: false, transparent: true, opacity: .8 })); r.position.copy(heli.position); scene.add(r);
          const mk = new THREE.Mesh(new THREE.RingGeometry(55, 75, 24), new THREE.MeshBasicMaterial({ color: 0xff40ff, transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false })); mk.rotation.x = -Math.PI / 2; mk.position.set(tx, TOPY + 2, TOPZ - 120); scene.add(mk); S.rings.push({ r, mk, from: heli.position.clone(), to: new THREE.Vector3(tx, TOPY + 50, TOPZ - 120), t: 0 }); sfx('megaphone', 0.7); if (Math.random() < .4) radio('GENERALISSIMO', pick(['YOU WILL LOVE ME!', 'Bow to the flag!', 'This blast approved by ME!'])); } }
      for (let i = S.rings.length - 1; i >= 0; i--) { const q = S.rings[i]; q.t += dt / 1.6; q.r.position.lerpVectors(q.from, q.to, Math.min(1, q.t)); q.r.lookAt(andy.position); q.r.scale.setScalar(1 + q.t); if (q.t >= 1) { scene.remove(q.r); scene.remove(q.mk); S.rings.splice(i, 1); if (Math.abs(S.x - q.to.x) < 75) { hurt(9); comic(andy.position, 'WAH-WAH-WAAAH!', 0.9); } else comic(q.to, pick(['WHIFF!', 'MISSED, PAL!']), 0.6); } }
      if (S.phase === 'p3') { S.finalT += rdt; if (S.finalT > 9) finalRocket(); setBar('prog', 1, 'FINAL ROCKET!'); }
      if (S.phase === 'final' && S.rk) { S.rk.t += dt / 0.9; const k = Math.min(1, S.rk.t); S.rk.m.position.lerpVectors(S.rk.from, heli.position, k); S.rk.m.position.y += Math.sin(k * Math.PI) * 120; S.rk.m.lookAt(heli.position); smokePuff(S.rk.m.position.clone(), 10, '#eeeeee', 1.5); if (k >= 1) heliDown(); }
      if (S.phase === 'celebrate') { S.celT += rdt; if (S.genV) { S.genV.y -= 300 * dt; gen.position.addScaledVector(S.genV, dt); gen.rotation.x += dt * 4; gen.rotation.z += dt * 3; }
        if (S.mus) { S.mus.position.y -= 40 * dt; S.mus.position.x += Math.sin(S.celT * 2) * 60 * dt; S.mus.rotation.z = Math.sin(S.celT * 2) * 0.6; }
        if (Math.random() < rdt * 2.5 && S.celT > 1.5) { const p = new THREE.Vector3(rnd(-700, 700), TOPY + 400 + rnd(300), TOPZ - 700 - rnd(400)); for (let i = 0; i < 26; i++) sparkle(p, rnd(5, 9), pick(['#ff4060', '#ffffff', '#4080ff', '#ffe14d']), new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).setLength(rnd(150, 260)), 1.6); sfx('boom', 0.25); if (Math.random() < .4) comic(p, pick(['POW!', 'ZOWIE!', 'KA-BLAM!', 'EH-BOOM!', 'WHAM!']), 0.7); }
        andy.userData.arms[0].sh.rotation.x = -2.9; andy.userData.arms[1].sh.rotation.x = -2.6 - Math.sin(S.celT * 6) * 0.3; jul.userData.arms[1].sh.rotation.x = -2.8 + Math.sin(S.celT * 6) * 0.3; holdFlag(flag, andy, 0); waveFlag(flag, S.celT);
        bob.position.y = TOPY + Math.abs(Math.sin(S.celT * 5)) * 30; jake.position.y = TOPY + Math.abs(Math.sin(S.celT * 5 + 1.5)) * 30;
        if (S.celT > 6.5 && !S.done) { S.done = true; ctx.win({ kills: S.kills, bonds: S.bonds + 20, rescues: S.rescues, time: S.t, boss: true, finale: true }); } }
      if (consume('final')) finalRocket();
      S.regenT -= dt; if (S.regenT <= 0) S.hp = Math.min(S.maxHp, S.hp + 5 * dt);
      if (S.hp <= 0) { S.hp = S.maxHp; S.rescues++; comic(null, 'SECOND WIND!', 1.4, { x: E.w / 2, y: E.h * 0.35, pal: ['#fff3a0', '#e0a010'] }); sfx('choir'); radio('ANDY', 'Jesus, take the wheel! ...of this mountain!'); }
      setBar('hp', S.hp / S.maxHp);
      const portrait = E.h > E.w; let want = tmp.set(S.x * 0.6, TOPY + (portrait ? 230 : 170), TOPZ - 120 + (portrait ? 480 : 360)); let look = new THREE.Vector3(S.x * 0.3 + heli.position.x * 0.25, TOPY + 150, TOPZ - 600);
      if (S.phase === 'final' && S.rk) { want = S.rk.m.position.clone().add(new THREE.Vector3(-120, 60, 180)); look = S.rk.m.position.clone(); }
      if (S.phase === 'celebrate') { const a = S.celT * 0.25; want = new THREE.Vector3(S.x + Math.sin(a) * 260, TOPY + 110, TOPZ - 120 + Math.cos(a) * 300); look = andy.position.clone().add(new THREE.Vector3(40, 90, 0)); }
      if (camPos.lengthSq() === 0) camPos.copy(want); camPos.lerp(want, Math.min(1, rdt * 3)); cam.position.copy(camPos); cam.lookAt(look);
    }
    if (shake > 0) { cam.position.x += rnd(-shake, shake); cam.position.y += rnd(-shake, shake); shake *= Math.pow(0.02, rdt); }
    const fov = E.h > E.w ? 72 : 56; if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    followSun(sun, andy.position); updateFx(dt); updateCombat(dt);
  }
  function hurt(d) { S.hp -= d / (1 + up.armor * 0.15); S.regenT = 3; sfx('hurt', .5); shake = Math.min(12, shake + 3); }
  CB.targets.push(boss);
  return { update, S, dispose() { window.__HWshake = null; window.__HWfloor = null; clearInput(); },
    hooks: { finish: () => { if (S.phase === 'climb') { S.prog = 1; } }, skipClimb: () => { S.prog = 1; }, killDrones: () => { S.drones.forEach(d => damage(d, 99)); }, bossLow: () => { boss.invuln = false; if (S.phase === 'p1') { S.drones.forEach(d => damage(d, 99)); startP2(); } boss.hp = boss.maxHp * 0.3; startP3(); }, final: () => finalRocket(), info: () => ({ phase: S.phase, prog: S.prog, bossHp: boss.hp, drones: S.drones.length, hp: S.hp }) } };
}
