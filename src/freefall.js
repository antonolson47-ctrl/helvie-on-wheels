// FREEFALL (Level 0 gameplay): steer Andy through the sky catching bearer bonds, dodge geese, pull the chute, land by the semi.
import { THREE, E, newScene, sunLight, makeObj, rnd, clamp, lerp, pick } from './engine.js';
import * as K from './brik/brik.js';
import * as W from './brik/world.js';
import * as MD from './models.js';
import { groundPlane } from './ground.js';
import { initFx, updateFx, boom, comic, sparkle, smokePuff, setWords } from './fx.js';
import { I, controls, consume, readSteer, cooldown, clearInput } from './input.js';
import { hud, setBar, toast, radio } from './ui.js';
import { sfx, playTrack } from './audio.js';
import { SAVE } from './save.js';
export function startFreefall(L, ctx) {
  const scene = newScene({ bloom: 0.6, bloomTh: 0.9 });
  K.sky(scene, ['#120a30', '#4a2a7a', '#c05a8a', '#ff9a5a', '#ffd890']); scene.fog = new THREE.Fog(0xe0a0a0, 1500, 7000);
  const sun = sunLight(scene, { dir: [-300, 400, -500], i: 2.4, color: 0xffc090, ext: 600 }); initFx(scene); setWords('boom');
  const up = SAVE.up; const FALL = 1150, DUR = 40;
  const andy = MD.chars.andy({ suit: true, armRot: [[2.6, 1.1], [2.6, 1.1]], legRot: [0.3, -0.3] }); andy.rotation.x = -1.25; andy.scale.setScalar(2.2); scene.add(andy);
  const pack = K.brick(2, 1, 4, '#3a4a2a'); pack.position.set(0, 18, -6); andy.add(pack);
  const chute = MD.chute(); chute.visible = false; chute.scale.setScalar(2); scene.add(chute);
  const ground = new THREE.Group(); scene.add(ground); groundPlane(ground, 9000, 9000, '#3e7a3a', 0, 0, 0);
  const road = groundPlane(ground, 360, 9000, '#3a3a42', 0.6, 0, 0); for (let i = 0; i < 18; i++) W.tower(ground, -1800 + (i % 6) * 220 - 600, -2600 + Math.floor(i / 6) * 260, 10, 10, 10 + Math.floor(rnd(30)), pick(['#4a8a9a', '#3a6a8a', '#7a8a9a']), 0.4, i);
  for (let i = 0; i < 40; i++) { const t = makeObj(g => W.tree(g, 0, 0, 2.2, '#1d5a2a')); t.position.set(rnd(-3000, 3000), 0, rnd(-3000, 3000)); if (Math.abs(t.position.x) < 300) t.position.x += 700; ground.add(t); }
  const semi = MD.semi({ brand: 'KENWHIRL' }); semi.position.set(260, 0, 120); semi.rotation.y = 0.3; ground.add(semi);
  ground.position.y = -9000;
  // clouds + bonds + geese, recycled
  const cloudProto = makeObj(g => { for (let k = 0; k < 7; k++) { const b = K.brick(5 + Math.floor(rnd(5)), 3 + Math.floor(rnd(4)), 3, '#ffe0ec'); b.position.set(rnd(-60, 60), rnd(-8, 8), rnd(-30, 30)); g.add(b); } });
  const clouds = []; for (let i = 0; i < 14; i++) { const c = cloudProto.clone(); c.scale.setScalar(rnd(2, 4)); c.position.set(rnd(-1400, 1400), -rnd(0, 4000), rnd(-1400, 1400)); scene.add(c); clouds.push(c); }
  const bonds = []; const geese = []; const gp = MD.geese(3);
  const S = { x: 0, z: 0, t: 0, bonds: 0, hits: 0, chute: false, chuteT: 0, landed: false, done: false, spawnT: 0.3, gooseT: 4, briefcase: 20 };
  hud(`<div class="hbar" id="prog"><i></i><b>ALTITUDE</b></div><div id="bondsc">$0</div><button id="pause" class="pe">II</button><button id="resetv" class="pe">VIEW</button><div id="radio"></div><div id="stick"><i></i></div><div id="steerhint"></div><div class="ctl" id="ctlR"></div>`);
  controls([{ id: 'chute', label: 'PULL<br>CHUTE', cls: 'red', key: ['Space'] }], 'DRAG TO STEER · CATCH THE BONDS!');
  document.getElementById('b_chute').style.visibility = 'hidden';
  playTrack('boat'); toast('FREEFALL!', 'Catch the bearer bonds before the wind does', 2.6);
  setTimeout(() => radio('ANDY', 'Well, that escalated nicely.'), 2500); setTimeout(() => radio('ANDY', 'Come to papa, little bonds!'), 9000); setTimeout(() => radio('RADIO', 'Seattle-ish PD: suspect is... skydiving? With chili?'), 18000);
  const cam = E.cam; cam.fov = 62; cam.updateProjectionMatrix(); const tmp = new THREE.Vector3();
  function spawnBondRing() { const cx = rnd(-260, 260), cz = rnd(-260, 260); const n = 5 + Math.floor(rnd(4)); for (let i = 0; i < n; i++) { const m = MD.bondMesh(); m.scale.setScalar(1.4); const a = i / n * 6.28; m.position.set(cx + Math.cos(a) * 60, -3200 - i * 70, cz + Math.sin(a) * 60); scene.add(m); bonds.push(m); } }
  function update(dt, rdt) {
    if (consume('pause')) { ctx.pause(); return; }
    S.t += dt; readSteer();
    const sp = S.chute ? 0.35 : 1; S.x = clamp(S.x + I.steer * 380 * dt, -320, 320); S.z = clamp(S.z + (I.vy || 0) * 380 * dt, -320, 320);
    andy.position.set(S.x, 0, S.z); andy.rotation.z = -I.steer * 0.4; andy.rotation.x = -1.25 + (I.vy || 0) * 0.3 + Math.sin(S.t * 3) * 0.05;
    const rise = FALL * (S.chute ? 0.12 : 1) * dt;
    for (const c of clouds) { c.position.y += rise * 1.1; if (c.position.y > 600) { c.position.set(rnd(-1400, 1400), -4000 - rnd(800), rnd(-1400, 1400)); } }
    if (!S.chute) { S.spawnT -= dt; if (S.spawnT <= 0) { S.spawnT = rnd(1.0, 1.8); spawnBondRing(); } S.gooseT -= dt; if (S.gooseT <= 0 && S.t > 6) { S.gooseT = rnd(4, 7); const g = gp.clone(); g.scale.setScalar(2); g.position.set(rnd(-250, 250), -3200, rnd(-250, 250)); g.rotation.x = -1.2; scene.add(g); geese.push(g); } }
    const mag = 75 + up.magnet * 30;
    for (let i = bonds.length - 1; i >= 0; i--) { const b = bonds[i]; b.position.y += rise; b.rotation.y += dt * 4; b.rotation.x += dt * 2;
      if (Math.abs(b.position.y) < 50 && Math.hypot(b.position.x - S.x, b.position.z - S.z) < mag) { scene.remove(b); bonds.splice(i, 1); S.bonds++; SAVE.bonds++; SAVE.totalBonds++; sfx('coin', 0.6); sparkle(b.position, 5, '#b8ff90'); if (S.bonds % 10 === 0) comic(andy.position.clone().add(new THREE.Vector3(0, 60, 0)), pick(['CHA-CHING!', 'KA-CHING!', 'BONDS!']), 0.8); continue; }
      if (b.position.y > 500) { scene.remove(b); bonds.splice(i, 1); } }
    for (let i = geese.length - 1; i >= 0; i--) { const g = geese[i]; g.position.y += rise * 0.85; g.position.x += Math.sin(S.t + i) * 40 * dt;
      if (!g.userData.hit && Math.abs(g.position.y) < 60 && Math.hypot(g.position.x - S.x, g.position.z - S.z) < 120) { g.userData.hit = 1; S.hits++; comic(andy.position, 'HONK-POW!', 1); sfx('crash', 0.7); radio('GOOSE', 'HONK.'); boom(g.position.clone(), 30, { bricks: 0.3, shake: 0.5 }); }
      if (g.position.y > 600) { scene.remove(g); geese.splice(i, 1); } }
    // timeline
    const k = Math.min(1, S.t / DUR); setBar('prog', 1 - k, S.chute ? 'CHUTE OPEN' : Math.round((1 - k) * 10000) + ' FT'); document.getElementById('bondsc').textContent = '$' + (S.bonds * 0.1).toFixed(1) + 'M';
    if (S.t > DUR - 4 && !S.chute) { const b = document.getElementById('b_chute'); if (b.style.visibility === 'hidden') { b.style.visibility = ''; toast('PULL THE CHUTE!', 'Tap the red button', 2); sfx('horn'); } cooldown('chute', 0, true); if (consume('chute') || S.t > DUR + 4) openChute(); }
    if (S.chute) { S.chuteT += dt; chute.position.set(S.x, 150, S.z); chute.rotation.y += dt * 0.3; andy.rotation.x = lerp(andy.rotation.x, 0, dt * 3); ground.position.y = lerp(-6000, -40, Math.min(1, S.chuteT / 7)); ground.position.x = -S.x * 0.2; if (S.chuteT > 7 && !S.landed) { S.landed = true; comic(null, 'STUCK THE LANDING!', 1.4, { x: E.w / 2, y: E.h * 0.33, life: 2 }); sfx('fanfare'); radio('ANDY', 'Keys in the visor. God bless Washington.'); setTimeout(() => ctx.win({ bonds: S.bonds, kills: 0, rescues: 0, time: S.t, hits: S.hits }), 2200); } }
    else ground.position.y = lerp(-9000, -6000, k);
    // camera: above & behind, looking down past Andy
    const portrait = E.h > E.w; const want = tmp.set(S.x * 0.6, (S.chute ? 260 : 330) * (portrait ? 1.25 : 1), S.z * 0.6 + (S.chute ? 420 : 240));
    cam.position.lerp(want, Math.min(1, rdt * 3)); if (S.t < 0.1) cam.position.copy(want); cam.lookAt(S.x, S.chute ? 40 : -300, S.z - (S.chute ? 60 : 80));
    if (cam.fov !== (portrait ? 74 : 62)) { cam.fov = portrait ? 74 : 62; cam.updateProjectionMatrix(); }
    sun.position.set(S.x - 300, 400, S.z - 500); sun.target.position.set(S.x, 0, S.z);
    updateFx(dt);
  }
  function openChute() { if (S.chute) return; S.chute = true; chute.visible = true; sfx('whoosh'); comic(andy.position.clone().add(new THREE.Vector3(0, 160, 0)), 'FWUMP!', 1.1); document.getElementById('b_chute').style.visibility = 'hidden'; radio('ANDY', 'Bonds. Andy Bonds.'); for (const b of bonds) scene.remove(b); bonds.length = 0; }
  return { update, S, dispose() { clearInput(); }, hooks: { finish: () => { S.t = DUR - 3.9; }, chute: openChute, info: () => ({ t: S.t, bonds: S.bonds, chute: S.chute, landed: S.landed }) } };
}
