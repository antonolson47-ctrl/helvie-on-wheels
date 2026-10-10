// Shared combat: tracers, homing rockets, lobbed hairballs, splash damage. Entities: {pos,hp,maxHp,r,alive,kill(src)}
import { THREE, E, rnd } from './engine.js';
import { boom, comic, smokePuff, sparkle } from './fx.js';
import { sfx } from './audio.js';
import * as MD from './models.js';
export const CB = { targets: [], tracers: [], proj: [], scene: null, onKill: null, dmgMul: 1, boomMul: 1, words: null };
let trGeo, trMat, rocketProto, hairProto;
export function initCombat(scene) {
  CB.scene = scene; CB.targets = []; CB.tracers = []; CB.proj = [];
  trGeo = new THREE.BoxGeometry(1, 1, 1); trGeo.userData.keep = true;
  trMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff2a0').multiplyScalar(3), toneMapped: false, transparent: true, opacity: .9 });
  rocketProto = MD.rocket(); hairProto = MD.hairball();
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3();
export function tracer(from, to, col) {
  const m = new THREE.Mesh(trGeo, col ? new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(2.5), toneMapped: false }) : trMat);
  const d = _a.copy(to).sub(from); const L = d.length(); m.scale.set(1.6, 1.6, Math.max(1, L)); m.position.copy(from).addScaledVector(d, 0.5); m.lookAt(to);
  CB.scene.add(m); CB.tracers.push({ m, t: 0.06 }); if (CB.tracers.length > 40) { const o = CB.tracers.shift(); CB.scene.remove(o.m); }
}
export function nearest(from, range, filter) { let best = null, bd = range * range; for (const t of CB.targets) { if (!t.alive || (filter && !filter(t))) continue; const d = t.pos.distanceToSquared(from); if (d < bd) { bd = d; best = t; } } return best; }
export function damage(t, dmg, src) { if (!t || !t.alive) return; if (t.invuln) { if (Math.random() < 0.1) sparkle(t.pos.clone().add(new THREE.Vector3(0, 30, 0)), 4, '#c0e0ff'); return; } t.hp -= dmg * CB.dmgMul; t.hitT = 0.12; if (t.onHit) t.onHit(dmg, src); if (t.hp <= 0) { t.alive = false; t.hp = 0; if (t.kill) t.kill(src); if (CB.onKill) CB.onKill(t, src); } }
export function splash(pos, radius, dmg, src, opt = {}) { for (const t of CB.targets) { if (!t.alive) continue; const d = t.pos.distanceTo(pos); if (d < radius + (t.r || 20)) damage(t, dmg * (1 - 0.5 * d / (radius + 1)), src); } if (opt.onSplash) opt.onSplash(pos, radius); }
// homing rocket
export function fireRocket(from, target, { speed = 900, dmg = 6, radius = 120, word, color, onHit } = {}) {
  const m = rocketProto.clone(); m.position.copy(from); CB.scene.add(m); sfx('rocket', 0.7);
  CB.proj.push({ kind: 'rocket', m, target, pos: m.position, v: new THREE.Vector3(rnd(-100, 100), 300, 0).add(target ? _b.copy(target.pos).sub(from).setLength(speed * 0.4) : new THREE.Vector3(0, 0, speed)), speed, dmg, radius: radius * CB.boomMul, word, life: 3.2, onHit, fallbackDir: new THREE.Vector3(0, 0, 1) });
}
export function lob(from, to, { t = 0.9, dmg = 5, radius = 110, word = 'HAIRBALL-BOOM!', model, onHit, h = 160 } = {}) {
  const m = (model || hairProto).clone(); m.position.copy(from); CB.scene.add(m);
  CB.proj.push({ kind: 'lob', m, from: from.clone(), to: to.clone(), t: 0, T: t, h, dmg, radius: radius * CB.boomMul, word, onHit });
}
export function updateCombat(dt) {
  for (let i = CB.tracers.length - 1; i >= 0; i--) { const o = CB.tracers[i]; o.t -= dt; if (o.t <= 0) { CB.scene.remove(o.m); CB.tracers.splice(i, 1); } }
  for (let i = CB.proj.length - 1; i >= 0; i--) { const p = CB.proj[i]; let hit = false;
    if (p.kind === 'rocket') { p.life -= dt; const tgt = p.target && p.target.alive ? p.target.pos : null;
      if (tgt) { const want = _a.copy(tgt).add(new THREE.Vector3(0, 18, 0)).sub(p.pos).setLength(p.speed); p.v.lerp(want, Math.min(1, dt * 5)); } else p.v.setLength(p.speed);
      p.pos.addScaledVector(p.v, dt); p.m.lookAt(_b.copy(p.pos).add(p.v));
      if (Math.random() < 0.7) smokePuff(p.pos.clone(), 5, '#e8e8e8', 0.8, new THREE.Vector3(0, 10, 0));
      if ((tgt && p.pos.distanceTo(tgt) < 34) || p.life <= 0 || p.pos.y < (window.__HWfloor ? window.__HWfloor(p.pos) : -1e9)) hit = true; }
    else if (p.kind === 'lob') { p.t += dt; const k = Math.min(1, p.t / p.T); p.m.position.lerpVectors(p.from, p.to, k); p.m.position.y += Math.sin(k * Math.PI) * p.h; p.m.rotation.x += dt * 8; if (k >= 1) hit = true; }
    if (hit) { const pos = p.m.position.clone(); CB.scene.remove(p.m); CB.proj.splice(i, 1); boom(pos, p.radius * 0.55, { burst: p.word || true }); sfx('boom', 0.8); splash(pos, p.radius, p.dmg, p.kind); if (p.onHit) p.onHit(pos); }
  }
}
export function clearCombat() { CB.tracers.forEach(o => CB.scene && CB.scene.remove(o.m)); CB.proj.forEach(p => CB.scene && CB.scene.remove(p.m)); CB.tracers = []; CB.proj = []; CB.targets = []; }
