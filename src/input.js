// Touch (per-finger identifiers) + pointer fallback + keyboard + optional tilt.
import { $ } from './ui.js';
import { SAVE } from './save.js';
export const I = { steer: 0, stickY: 0, brake: false, boost: false, hold: {}, press: {}, taps: [], keys: {}, tilt: 0, tiltOn: false, active: false, steerFinger: null, steerX0: 0, steerY0: 0, last: 0 };
let btnDefs = [];
export function initInput() {
  const T = $('#touch');
  const zoneSteer = x => SAVE.settings.lefty ? x > innerWidth * 0.45 : x < innerWidth * 0.55;
  const taps = new Map();
  const down = (id, x, y) => {
    I.last = performance.now();
    if (I.steerFinger === null && zoneSteer(x)) { I.steerFinger = id; I.steerX0 = x; I.steerY0 = y; showStick(x, y, 0, 0); return; }
    taps.set(id, { x, y, t: performance.now() });
  };
  const move = (id, x, y) => { if (id === I.steerFinger) { const R = Math.min(innerWidth, innerHeight) * 0.16; let dx = (x - I.steerX0) / R, dy = (y - I.steerY0) / R; const m = Math.hypot(dx, dy); if (m > 1) { I.steerX0 += (x - I.steerX0) * (1 - 1 / m); I.steerY0 += (y - I.steerY0) * (1 - 1 / m); dx /= m; dy /= m; } I.touchSteer = dx; I.stickY = dy; showStick(I.steerX0, I.steerY0, dx, dy); } };
  const up = (id, x, y) => { if (id === I.steerFinger) { I.steerFinger = null; I.touchSteer = 0; I.stickY = 0; hideStick(); return; } const t = taps.get(id); if (t) { taps.delete(id); if (performance.now() - t.t < 400 && Math.hypot(x - t.x, y - t.y) < 30) I.taps.push({ x, y }); } };
  T.addEventListener('touchstart', e => { e.preventDefault(); for (const t of e.changedTouches) down(t.identifier, t.clientX, t.clientY); }, { passive: false });
  T.addEventListener('touchmove', e => { e.preventDefault(); for (const t of e.changedTouches) move(t.identifier, t.clientX, t.clientY); }, { passive: false });
  const te = e => { e.preventDefault(); for (const t of e.changedTouches) up(t.identifier, t.clientX, t.clientY); };
  T.addEventListener('touchend', te, { passive: false }); T.addEventListener('touchcancel', te, { passive: false });
  // mouse / pen fallback (desktop)
  T.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') return; down('p' + e.pointerId, e.clientX, e.clientY); });
  addEventListener('pointermove', e => { if (e.pointerType === 'touch') return; move('p' + e.pointerId, e.clientX, e.clientY); });
  addEventListener('pointerup', e => { if (e.pointerType === 'touch') return; up('p' + e.pointerId, e.clientX, e.clientY); });
  addEventListener('keydown', e => { I.keys[e.code] = true; const b = btnDefs.find(b => b.key && b.key.includes(e.code)); if (b && !e.repeat) { I.press[b.id] = true; I.hold[b.id] = true; } if (e.code === 'Escape' || e.code === 'KeyP') I.press.pause = true; });
  addEventListener('keyup', e => { I.keys[e.code] = false; const b = btnDefs.find(b => b.key && b.key.includes(e.code)); if (b) I.hold[b.id] = false; });
  addEventListener('blur', () => { I.keys = {}; I.hold = {}; I.steerFinger = null; I.touchSteer = 0; hideStick(); });
}
function showStick(x, y, dx, dy) { let s = $('#stick'); if (!s) return; s.style.display = 'block'; s.style.left = (x - 75) + 'px'; s.style.top = (y - 75) + 'px'; s.firstChild.style.transform = `translate(${dx * 48}px,${dy * 48}px)`; const h = $('#steerhint'); if (h) h.style.display = 'none'; }
function hideStick() { const s = $('#stick'); if (s) s.style.display = 'none'; }
export function clearInput() { I.press = {}; I.hold = {}; I.taps.length = 0; I.steerFinger = null; I.touchSteer = 0; I.stickY = 0; hideStick(); }
// on-screen buttons: [{id,label,cls,key:[codes],hold}]
export function controls(defs, hint = 'DRAG HERE TO STEER') {
  btnDefs = defs; const R = $('#ctlR'); if (!R) return;
  R.innerHTML = ''; let row = null;
  defs.forEach((d, i) => { if (d.row || !row) { row = document.createElement('div'); row.className = 'rowb'; R.appendChild(row); }
    const b = document.createElement('button'); b.className = 'cb pe ' + (d.cls || ''); b.id = 'b_' + d.id; b.innerHTML = d.label + '<span class="cd"></span>'; row.appendChild(b);
    const on = e => { e.preventDefault(); e.stopPropagation(); I.press[d.id] = true; I.hold[d.id] = true; b.classList.add('on'); I.last = performance.now(); };
    const off = e => { e.preventDefault(); e.stopPropagation(); I.hold[d.id] = false; b.classList.remove('on'); };
    b.addEventListener('touchstart', on, { passive: false }); b.addEventListener('touchend', off, { passive: false }); b.addEventListener('touchcancel', off, { passive: false });
    b.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') on(e); }); b.addEventListener('pointerup', e => { if (e.pointerType !== 'touch') off(e); }); b.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch') off(e); });
  });
  const h = $('#steerhint'); if (h) { h.textContent = hint; h.style.display = ''; }
}
export function cooldown(id, f, ready) { const b = document.getElementById('b_' + id); if (!b) return; b.querySelector('.cd').style.height = (Math.max(0, Math.min(1, f)) * 100) + '%'; b.classList.toggle('ready', !!ready); }
export function consume(id) { const v = !!I.press[id]; I.press[id] = false; return v; }
export function readSteer() {
  let k = 0; if (I.keys.ArrowLeft || I.keys.KeyA) k -= 1; if (I.keys.ArrowRight || I.keys.KeyD) k += 1;
  let s = (I.touchSteer || 0) + k; if (I.tiltOn && SAVE.settings.tilt) s += I.tilt;
  I.steer = Math.max(-1, Math.min(1, s));
  let y = I.stickY || 0; if (I.keys.ArrowUp || I.keys.KeyW) y -= 1; if (I.keys.ArrowDown || I.keys.KeyS) y += 1; I.vy = Math.max(-1, Math.min(1, y));
  return I.steer;
}
export async function enableTilt() {
  try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') return false; } } catch (e) { return false; }
  if (!I.tiltOn) addEventListener('deviceorientation', e => { const land = Math.abs(window.orientation || (screen.orientation && screen.orientation.angle) || 0) === 90; const ang = (window.orientation ?? (screen.orientation ? screen.orientation.angle : 0)); let v = land ? (e.beta || 0) * (ang === 90 ? 1 : -1) : (e.gamma || 0); I.tilt = Math.max(-1, Math.min(1, v / 22)); });
  I.tiltOn = true; return true;
}
