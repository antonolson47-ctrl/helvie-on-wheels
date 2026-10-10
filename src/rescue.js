// "JESUS, TAKE THE WHEEL!" rescue: golden beam, choir sting, slow-mo comic burst, vehicle lifted & set back on course.
// Affectionate, never mocking: no figure is shown, only warm light.
import { THREE, E, rnd, pick } from './engine.js';
import * as MD from './models.js';
import { comic, sparkle } from './fx.js';
import { sfx } from './audio.js';
import { radio, holy, toast } from './ui.js';
import { SAVE } from './save.js';
const T = 3.8;
const LINES = { first: 'JESUS, TAKE THE WHEEL!', again: 'JESUS, TAKE THE WHEEL! ...again, sorry!', third: 'Sorry to bother You again. JESUS, TAKE THE WHEEL!' };
export function rescueStart(ctx, why) {
  const n = (ctx.count = (ctx.count || 0) + 1);
  const beam = MD.beam(); const nt = MD.notes(7); ctx.scene.add(beam); ctx.scene.add(nt);
  E.timeScale = 0.3; holy(true); sfx('choir'); sfx('whoosh', 0.6);
  radio('ANDY', n === 1 ? LINES.first : n === 3 ? LINES.third : LINES.again, 3.2);
  if (n === 2 && Math.random() < 0.7) setTimeout(() => radio('JULIA', 'Amen, and step on it!'), 1200);
  setTimeout(() => comic(null, pick(['HALLELU-WHOOSH!', 'HOLY-MOLY!', 'AMEN-BAM!']), 1.5, { x: E.w / 2, y: E.h * 0.3, life: 2.2, pal: ['#fff3a0', '#e0a010'] }), 250);
  if (!SAVE.seenRescue) { SAVE.seenRescue = 1; setTimeout(() => toast('DIVINE ASSIST!', 'No game over here — the light puts you back on the road', 3), 600); }
  const arms = ctx.andy && ctx.andy.userData.arms; const armSave = arms ? arms.map(a => a.sh.rotation.clone()) : null;
  return { t: 0, ctx, beam, nt, why, arms, armSave };
}
export function rescueUpdate(r, rdt) {
  const now = performance.now(); rdt = Math.min(0.25, r.last ? (now - r.last) / 1000 : rdt); r.last = now; r.t += rdt; const k = Math.min(1, r.t / T); const p = r.ctx.getPos();
  // lift curve: up fast, hover, set down
  const lift = k < 0.3 ? (k / 0.3) * 160 : k < 0.75 ? 160 + Math.sin((k - 0.3) * 20) * 6 : 160 * (1 - (k - 0.75) / 0.25);
  const move = k < 0.3 ? 0 : Math.min(1, (k - 0.3) / 0.4);
  r.beam.position.set(p.x, 0, p.z); r.beam.children.forEach((m, i) => { if (m.material) m.material.opacity = (i < 2 ? 0.1 : 0.25) * Math.min(1, k * 6) * (k > 0.85 ? (1 - k) / 0.15 : 1); }); r.beam.userData.ring.rotation.z += rdt;
  r.nt.position.set(p.x, p.y + 120, p.z); r.nt.children.forEach((q, i) => { const a = r.t * 1.6 + i * 0.9; q.position.set(Math.cos(a) * 150, Math.sin(r.t * 3 + i) * 30 + i * 6, Math.sin(a) * 150); q.lookAt(E.cam.position); q.visible = k < 0.92; });
  if (Math.random() < 0.6) sparkle(new THREE.Vector3(p.x + rnd(-120, 120), p.y + rnd(0, 260), p.z + rnd(-120, 120)), rnd(2, 5), '#fff2a0', new THREE.Vector3(0, -60, 0), 1.2);
  // warm fill light on the cab so Andy reads clearly inside the glow
  E.flash.color.set(0xffe6b0); E.flash.position.set(p.x, p.y + 90, p.z); E.flash.intensity = 2.2e5 * (k < 0.9 ? 1 : (1 - k) * 10); E.flash.distance = 700;
  if (r.arms) r.arms.forEach((a, i) => { a.sh.rotation.x = -2.9 + Math.sin(r.t * 6 + i) * 0.15; });
  const cam = k < 0.12 ? k / 0.12 : k > 0.82 ? Math.max(0, (1 - k) / 0.18) : 1;
  const done = k >= 1;
  if (done) { r.ctx.scene.remove(r.beam); r.ctx.scene.remove(r.nt); holy(false); E.flash.intensity = 0; E.flash.color.set(0xff8a2a); if (r.arms) r.arms.forEach((a, i) => a.sh.rotation.copy(r.armSave[i])); setTimeout(() => radio('ANDY', pick(['Much obliged. *tips cap to the sky*', 'Thank You kindly!', 'Back on the road, praise be!'])), 300); }
  return { k, lift, move, cam, done };
}
