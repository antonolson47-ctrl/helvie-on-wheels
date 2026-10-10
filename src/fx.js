// Brick destruction particles (instanced: 4 draw calls total) + flash light + comic bursts (DOM)
import { THREE, E, rnd, pick, toScreen } from './engine.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as K from './brik/brik.js';
const N = { deb: 260, stud: 220, fire: 140, smoke: 110 };
let P = null;
const DEB_COLS = ['#c8102e', '#ffd23a', '#f4f4f4', '#1b2a5a', '#5a3412', '#888888', '#ff8a1a', '#2a6a3a'];
export function initFx(scene) {
  const mk = (geo, mat, n) => { const im = new THREE.InstancedMesh(geo, mat, n); im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.count = 0; im.setColorAt(0, new THREE.Color()); scene.add(im); return { im, list: [], n }; };
  const debGeo = new RoundedBoxGeometry(8, 9.6, 8, 1, 0.8); debGeo.userData.keep = true;
  const studG = new THREE.CylinderGeometry(2.4, 2.4, 1.8, 10); studG.userData.keep = true;
  const fireG = new THREE.IcosahedronGeometry(1, 1); fireG.userData.keep = true;
  P = {
    deb: mk(debGeo, new THREE.MeshStandardMaterial({ roughness: 0.35 }), N.deb),
    stud: mk(studG, new THREE.MeshStandardMaterial({ roughness: 0.3 }), N.stud),
    fire: mk(fireG, new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, opacity: 0.92, depthWrite: false, blending: THREE.AdditiveBlending }), N.fire),
    smoke: mk(fireG, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: 0.55, depthWrite: false }), N.smoke),
  };
  P.deb.im.castShadow = true; flashT = 0; fires.length = 0; bursts.forEach(b => b.el.remove()); bursts.length = 0;
}
const fires = []; // persistent fires {pos,life,size}
let flashT = 0;
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _c = new THREE.Color();
function add(pool, o) { if (pool.list.length >= pool.n) pool.list.shift(); pool.list.push(o); }
export function boom(pos, size = 60, { bricks = 1, burst = null, color = null, fire = 0, shake = 1 } = {}) {
  if (!P) return;
  const nb = Math.round((10 + size * 0.35) * bricks), ns = Math.round(nb * 0.8);
  for (let i = 0; i < nb; i++) { const a = rnd(6.28), up = rnd(0.4, 1.2), sp = size * rnd(2, 5.5); add(P.deb, { p: pos.clone().add(new THREE.Vector3(rnd(-1, 1) * size * 0.3, rnd(size * 0.3), rnd(-1, 1) * size * 0.3)), v: new THREE.Vector3(Math.cos(a) * sp, up * sp * 1.2, Math.sin(a) * sp), r: new THREE.Vector3(rnd(6), rnd(6), rnd(6)), w: new THREE.Vector3(rnd(-9, 9), rnd(-9, 9), rnd(-9, 9)), s: rnd(0.5, 1.3) * (0.6 + size / 120), c: color && Math.random() < 0.5 ? color : pick(DEB_COLS), life: rnd(1.6, 2.8), t: 0 }); }
  for (let i = 0; i < ns; i++) { const a = rnd(6.28), sp = size * rnd(2, 6); add(P.stud, { p: pos.clone().add(new THREE.Vector3(0, size * 0.3, 0)), v: new THREE.Vector3(Math.cos(a) * sp, rnd(0.5, 1.4) * sp, Math.sin(a) * sp), r: new THREE.Vector3(rnd(6), rnd(6), 0), w: new THREE.Vector3(rnd(-12, 12), rnd(-12, 12), 0), s: 1.3, c: color && Math.random() < 0.5 ? color : pick(DEB_COLS), life: rnd(1.4, 2.4), t: 0 }); }
  const cols = ['#fff6c8', '#ffd23a', '#ff8a1a', '#ff4d0d'];
  for (let i = 0; i < 14; i++) { const a = rnd(6.28), d = rnd(size * 0.5); add(P.fire, { p: pos.clone().add(new THREE.Vector3(Math.cos(a) * d, rnd(size * 0.5), Math.sin(a) * d)), v: new THREE.Vector3(Math.cos(a) * size * 0.8, rnd(size * 0.5, size * 1.5), Math.sin(a) * size * 0.8), s0: size * rnd(0.25, 0.5), c: cols[Math.min(3, i % 4)], life: rnd(0.5, 0.9), t: 0, k: i < 5 ? 3 : 2 }); }
  for (let i = 0; i < 8; i++) add(P.smoke, { p: pos.clone().add(new THREE.Vector3(rnd(-1, 1) * size * 0.4, size * 0.4, rnd(-1, 1) * size * 0.4)), v: new THREE.Vector3(rnd(-20, 20), rnd(40, 90), rnd(-20, 20)), s0: size * rnd(0.3, 0.5), c: Math.random() < 0.5 ? '#3a3440' : '#6a6470', life: rnd(1.8, 3), t: 0 });
  E.flash.position.copy(pos).y += size * 0.6; E.flash.intensity = Math.min(9e5, size * size * 140); E.flash.distance = size * 9; flashT = 0.35;
  if (fire) fires.push({ p: pos.clone(), life: fire, size: size * 0.6, acc: 0 });
  if (burst) comic(pos, burst === true ? undefined : burst, size > 90 ? 1.35 : 1);
  if (shake && window.__HWshake) window.__HWshake(Math.min(1.5, size / 70) * shake);
}
export function smokePuff(pos, s = 10, col = '#dddddd', life = 1.2, v) { if (!P) return; add(P.smoke, { p: pos.clone(), v: v || new THREE.Vector3(rnd(-10, 10), rnd(20, 40), rnd(-10, 10)), s0: s, c: col, life, t: 0 }); }
export function sparkle(pos, s = 4, col = '#fff2a0', v, life = 0.8) { if (!P) return; add(P.fire, { p: pos.clone(), v: v || new THREE.Vector3(rnd(-30, 30), rnd(-30, 30), rnd(-30, 30)), s0: s, c: col, life, t: 0, k: 2.5 }); }
export function addFire(pos, size = 30, life = 20) { fires.push({ p: pos.clone(), life, size, acc: 0 }); }
export function updateFx(dt) {
  if (!P) return;
  if (flashT > 0) { flashT -= dt; E.flash.intensity *= Math.pow(0.002, dt); if (flashT <= 0) E.flash.intensity = 0; }
  for (let i = fires.length - 1; i >= 0; i--) { const f = fires[i]; f.life -= dt; f.acc += dt; if (f.life <= 0) { fires.splice(i, 1); continue; }
    while (f.acc > 0.07) { f.acc -= 0.07; add(P.fire, { p: f.p.clone().add(new THREE.Vector3(rnd(-1, 1) * f.size * 0.6, 0, rnd(-1, 1) * f.size * 0.6)), v: new THREE.Vector3(rnd(-8, 8), rnd(f.size * 1.5, f.size * 3), rnd(-8, 8)), s0: f.size * rnd(0.3, 0.55), c: pick(['#ffd23a', '#ff8a1a', '#ff4d0d', '#fff0a0']), life: rnd(0.5, 0.9), t: 0, k: 2.2 });
      if (Math.random() < 0.35) add(P.smoke, { p: f.p.clone().add(new THREE.Vector3(0, f.size * 1.6, 0)), v: new THREE.Vector3(rnd(-10, 10), rnd(50, 90), rnd(-10, 10)), s0: f.size * 0.5, c: '#2e2a33', life: 2.2, t: 0 }); } }
  const g = 520;
  for (const key of ['deb', 'stud']) { const pool = P[key], im = pool.im; let n = 0;
    for (let i = pool.list.length - 1; i >= 0; i--) { const o = pool.list[i]; o.t += dt; if (o.t > o.life) { pool.list.splice(i, 1); continue; } }
    for (const o of pool.list) { o.v.y -= g * dt; o.p.addScaledVector(o.v, dt); const fl = (o.floor ?? (window.__HWfloor ? window.__HWfloor(o.p) : 0));
      if (o.p.y < fl) { o.p.y = fl; o.v.y *= -0.35; o.v.x *= 0.6; o.v.z *= 0.6; o.w.multiplyScalar(0.6); }
      o.r.addScaledVector(o.w, dt); _e.set(o.r.x, o.r.y, o.r.z); _q.setFromEuler(_e); const sc = o.s * Math.min(1, (o.life - o.t) * 2); _s.set(sc, sc, sc); _m.compose(o.p, _q, _s); im.setMatrixAt(n, _m); im.setColorAt(n, _c.set(o.c)); n++; }
    im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  for (const key of ['fire', 'smoke']) { const pool = P[key], im = pool.im; let n = 0;
    for (let i = pool.list.length - 1; i >= 0; i--) { const o = pool.list[i]; o.t += dt; if (o.t > o.life) pool.list.splice(i, 1); }
    for (const o of pool.list) { const k = o.t / o.life; o.v.multiplyScalar(Math.pow(key === 'fire' ? 0.08 : 0.4, dt)); o.p.addScaledVector(o.v, dt);
      const sc = key === 'fire' ? o.s0 * (0.6 + k * 0.9) * (1 - k * k) : o.s0 * (0.7 + k * 1.6); _q.identity(); _s.set(sc, sc, sc); _m.compose(o.p, _q, _s); im.setMatrixAt(n, _m);
      if (key === 'fire') _c.set(o.c).multiplyScalar((o.k || 2) * (1 - k * 0.7)); else _c.set(o.c).multiplyScalar(1 - k * 0.3);
      im.setColorAt(n, _c); n++; }
    im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
  updateBursts(dt);
}
// ---------- comic bursts ----------
const WORDS = { boom: ['KA-BLAM!', 'KA-BOOM!', 'WHAM!', 'POW!', 'ZOWIE!', 'KER-RUNCH!', 'BLAMMO!', 'KA-POW!', 'SPLATT!', 'THWACK!'], canada: ['EH-BOOM!', 'SORRY-SPLAT!', 'TOQUE-POW!', 'POUTINE-POP!', 'KA-NADA!', 'MAPLE-WHAM!', 'HOSER-BLAM!', 'LOONIE-BOOM!'], cat: ['HISS-POW!', 'MEOW-WHAM!', 'CLAW-BLAM!', 'PURR-POW!', 'HAIRBALL-BOOM!'], holy: ['HALLELU-WHOOSH!', 'HOLY-MOLY!', 'AMEN-BAM!'] };
export let wordSet = 'boom';
export function setWords(s) { wordSet = s; }
const PAL = [['#ffe14d', '#e0103a'], ['#7af0ff', '#c2185b'], ['#ff5fa2', '#ffe14d'], ['#a8ff60', '#1a2a8a'], ['#ffffff', '#e0103a'], ['#ffb02e', '#3a0a6a']];
const bursts = [];
function burstSVG(t, c1, c2) {
  let p = ''; const n = 12, r = 100;
  for (let i = 0; i < n * 2; i++) { const a = i / (n * 2) * Math.PI * 2, rr = i % 2 ? r * .68 : r * (1 + .16 * Math.sin(i * 5)); p += `${(Math.cos(a) * rr * 1.45).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)} `; }
  const fs = Math.min(64, 520 / Math.max(5, t.length));
  return `<svg viewBox="-160 -120 320 240" width="100%" height="100%"><polygon points="${p}" fill="#120a14" transform="translate(7 7)" opacity=".45"/><polygon points="${p}" fill="${c1}" stroke="#120a14" stroke-width="7" stroke-linejoin="round"/><text y="${fs * .36}" text-anchor="middle" font-family="Bangers" letter-spacing="2" font-size="${fs}" fill="${c2}" stroke="#120a14" stroke-width="6" paint-order="stroke">${t}</text></svg>`;
}
export function comic(pos, text, scale = 1, opt = {}) {
  const layer = document.getElementById('bursts'); if (!layer) return;
  if (bursts.length > 6) { const o = bursts.shift(); o.el.remove(); }
  const t = text || pick(WORDS[wordSet] || WORDS.boom); const [c1, c2] = opt.pal || pick(PAL);
  const el = document.createElement('div'); el.className = 'burst'; el.innerHTML = burstSVG(t, c1, c2);
  const sz = Math.min(E.w, E.h) * 0.36 * scale; el.style.width = sz + 'px'; el.style.height = sz * 0.75 + 'px';
  layer.appendChild(el);
  const b = { el, pos: pos ? pos.clone() : null, sx: opt.x, sy: opt.y, t: 0, life: opt.life || 1.0, rot: rnd(-14, 14), sz }; bursts.push(b); placeBurst(b);
  return b;
}
function placeBurst(b) {
  let x = b.sx ?? E.w / 2, y = b.sy ?? E.h * 0.35;
  if (b.pos) { const s = toScreen(b.pos); if (!s.vis) { b.el.style.display = 'none'; return; } x = s.x; y = s.y - b.sz * 0.25; }
  x = Math.max(b.sz * 0.4, Math.min(E.w - b.sz * 0.4, x)); y = Math.max(b.sz * 0.3, Math.min(E.h - b.sz * 0.3, y));
  const k = b.t / b.life; const pop = k < 0.15 ? 0.3 + k / 0.15 * 0.9 : k < 0.25 ? 1.2 - (k - 0.15) * 2 : 1; const fade = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
  b.el.style.transform = `translate(${x - b.sz / 2}px,${y - b.sz * 0.375}px) rotate(${b.rot}deg) scale(${pop})`; b.el.style.opacity = fade; b.el.style.display = '';
}
function updateBursts(dt) { for (let i = bursts.length - 1; i >= 0; i--) { const b = bursts[i]; b.t += E.rdt || dt; if (b.t > b.life) { b.el.remove(); bursts.splice(i, 1); continue; } placeBurst(b); } }
export function clearBursts() { bursts.forEach(b => b.el.remove()); bursts.length = 0; }
