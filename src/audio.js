// Procedural, ORIGINAL spy-thriller music + SFX (WebAudio). Surf guitar (tremolo-picked plucks into spring-ish reverb),
// brass stabs, string pads, bass, drums. Tracks: title, semi, boat, shoot, canada, finale, cine. No real melodies copied.
export const A = { ctx: null, master: null, music: null, sfx: null, rev: null, on: true, musicVol: 0.55, sfxVol: 0.9, track: null, step: 0, nextT: 0, timer: 0 };
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
export function initAudio() {
  if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
  const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
  const ctx = new C(); A.ctx = ctx;
  A.master = ctx.createGain(); A.master.gain.value = 0.8;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; A.master.connect(comp); comp.connect(ctx.destination);
  A.music = ctx.createGain(); A.music.gain.value = A.musicVol; A.music.connect(A.master);
  A.sfx = ctx.createGain(); A.sfx.gain.value = A.sfxVol; A.sfx.connect(A.master);
  // spring-ish reverb: short noise IR with metallic drip
  const len = ctx.sampleRate * 1.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) { const t = i / ctx.sampleRate; d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3) * (1 + 0.6 * Math.sin(t * 2 * Math.PI * 9)); } }
  A.rev = ctx.createConvolver(); A.rev.buffer = ir; const rg = ctx.createGain(); rg.gain.value = 0.32; A.rev.connect(rg); rg.connect(A.master);
  A.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = A.noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  A.timer = setInterval(sched, 25);
  const unlock = () => { if (ctx.state !== 'running') ctx.resume(); };
  ['touchend', 'pointerdown', 'keydown'].forEach(e => addEventListener(e, unlock, { passive: true }));
}
export function setVolumes(m, s) { A.musicVol = m; A.sfxVol = s; if (A.music) { A.music.gain.value = m; A.sfx.gain.value = s; } }
function env(g, t, a, d, peak, sus = 0, rel = 0.1, end) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus || 0.0001), t + a + d); if (end) g.gain.exponentialRampToValueAtTime(0.0001, end + rel); }
function osc(type, f, t, dur, vol, dest, { a = 0.005, d = 0.2, sus = 0, det = 0, filt = 0, q = 1, rev = 0, glide = 0 } = {}) {
  const ctx = A.ctx, o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur); o.detune.value = det;
  let n = o; if (filt) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filt; fl.Q.value = q; o.connect(fl); n = fl; }
  n.connect(g); env(g, t, a, d, vol, sus, 0.08, t + dur); g.connect(dest); if (rev) { const rs = ctx.createGain(); rs.gain.value = rev; g.connect(rs); rs.connect(A.rev); }
  o.start(t); o.stop(t + dur + 0.2);
}
function noiseHit(t, dur, vol, dest, { hp = 0, lp = 0, bp = 0, q = 1 } = {}) {
  const ctx = A.ctx, s = ctx.createBufferSource(); s.buffer = A.noise; const g = ctx.createGain(); let n = s;
  for (const [ty, f] of [['highpass', hp], ['lowpass', lp], ['bandpass', bp]]) if (f) { const fl = ctx.createBiquadFilter(); fl.type = ty; fl.frequency.value = f; fl.Q.value = q; n.connect(fl); n = fl; }
  n.connect(g); g.connect(dest); env(g, t, 0.002, dur, vol); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
// surf guitar pluck: bright saw+square, fast decay, through reverb; tremolo = repeated plucks
function surf(n, t, dur, vol = 0.12, trem = 0) {
  const reps = trem ? Math.max(1, Math.floor(dur / trem)) : 1;
  for (let i = 0; i < reps; i++) { const tt = t + i * (trem || dur); osc('sawtooth', NOTE(n), tt, (trem || dur) * 0.95, vol * (i ? 0.75 : 1), A.music, { a: 0.003, d: 0.18, sus: vol * 0.25, filt: 2600, q: 2, rev: 0.9 }); osc('square', NOTE(n - 12), tt, (trem || dur) * 0.9, vol * 0.3, A.music, { a: 0.003, d: 0.1, filt: 1400, rev: 0.4 }); }
}
function brass(ns, t, dur, vol = 0.07) { for (const n of ns) for (const d of [-8, 7]) osc('sawtooth', NOTE(n), t, dur, vol, A.music, { a: 0.03, d: 0.15, sus: vol * 0.6, det: d, filt: 1800, q: 1.5, rev: 0.3 }); }
function strings(ns, t, dur, vol = 0.03) { for (const n of ns) for (const d of [-12, 0, 11]) osc('sawtooth', NOTE(n), t, dur, vol, A.music, { a: 0.35, d: 0.3, sus: vol * 0.9, det: d, filt: 1500, rev: 0.6 }); }
function organ(ns, t, dur, vol = 0.04) { for (const n of ns) { osc('sine', NOTE(n), t, dur, vol, A.music, { a: 0.01, d: 0.1, sus: vol }); osc('sine', NOTE(n + 12), t, dur, vol * 0.5, A.music, { a: 0.01, d: 0.1, sus: vol * 0.5 }); osc('square', NOTE(n + 19), t, dur, vol * 0.12, A.music, { a: 0.01, d: 0.1, sus: vol * 0.1, filt: 2000 }); } }
function bass(n, t, dur, vol = 0.16) { osc('triangle', NOTE(n), t, dur, vol, A.music, { a: 0.005, d: 0.2, sus: vol * 0.5 }); osc('sawtooth', NOTE(n), t, dur, vol * 0.25, A.music, { a: 0.005, d: 0.12, filt: 500 }); }
function kick(t, v = 0.5) { osc('sine', 120, t, 0.25, v, A.music, { a: 0.002, d: 0.22, glide: 40 }); }
function snare(t, v = 0.18) { noiseHit(t, 0.16, v, A.music, { hp: 1500 }); osc('triangle', 190, t, 0.08, v * 0.6, A.music, { d: 0.07 }); }
function hat(t, v = 0.05) { noiseHit(t, 0.04, v, A.music, { hp: 7000 }); }
function choir(ns, t, dur, vol = 0.05) { for (const n of ns) { const ctx = A.ctx; for (const d of [-6, 6]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = d; const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = 9; lfo.connect(lg); lg.connect(o.detune);
  const f1 = ctx.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 800; f1.Q.value = 6; const f2 = ctx.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 1150; f2.Q.value = 7; const g = ctx.createGain(); o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); env(g, t, 0.3, 0.4, vol * 3, vol * 2.4, 0.4, t + dur); g.connect(A.music); const rs = ctx.createGain(); rs.gain.value = 1; g.connect(rs); rs.connect(A.rev); o.start(t); lfo.start(t); o.stop(t + dur + 0.6); lfo.stop(t + dur + 0.6); } } }
// ---- tracks: each = {bpm, bars:[chord roots], fn(step,t,beat)} 16th-note steps
const minor = r => [r, r + 3, r + 7], maj = r => [r, r + 4, r + 7];
const TR = {
  title: { bpm: 112, prog: [[40, 'm'], [40, 'm'], [43, 'M'], [42, 'm7b5'], [40, 'm'], [45, 'm'], [47, 'M'], [47, 'M']], fn(s, t, d, ch, bar) {
    const b = s % 16; if (b % 4 === 0) kick(t, 0.32); if (b === 4 || b === 12) snare(t, 0.1); if (b % 2 === 0) hat(t, 0.03);
    if (b % 4 === 0 || b === 6 || b === 14) bass(ch[0] - 12 + (b === 6 ? 7 : 0), t, d * 1.5);
    const riff = [0, null, 3, null, 7, null, 6, 7, null, 10, null, 7, 6, null, 3, null]; if (riff[b] !== null && bar % 2 === 0) surf(ch[0] + 24 + riff[b], t, d * 1.6, 0.09);
    if (b === 0 && bar % 2 === 1) strings(ch.map(n => n + 24), t, d * 15, 0.022); if (bar % 4 === 3 && (b === 10 || b === 13)) brass(ch.map(n => n + 24), t, d * 2, 0.05);
  } },
  semi: { bpm: 150, prog: [[40, 'm'], [40, 'm'], [45, 'm'], [47, 'M'], [43, 'M'], [45, 'm'], [47, 'M'], [40, 'm']], fn(s, t, d, ch, bar) {
    const b = s % 16; if (b % 4 === 0 || b === 10) kick(t, 0.42); if (b === 4 || b === 12) snare(t); hat(t, b % 2 ? 0.02 : 0.045);
    if (b % 2 === 0) bass(ch[0] - 12 + [0, 0, 7, 0, 10, 0, 7, 5][b / 2], t, d * 1.8, 0.13);
    const r = [12, 12, 15, 12, 19, 17, 15, 12]; if (b % 2 === 0) surf(ch[0] + 12 + r[(b / 2 + bar) % 8], t, d * 2, 0.07, d / 2);
    if (b === 0 && bar % 2 === 0) brass(ch.map(n => n + 24), t, d * 3, 0.05); if (b === 7 && bar % 2 === 1) brass(ch.map(n => n + 24), t, d * 1.5, 0.05);
  } },
  boat: { bpm: 168, prog: [[45, 'm'], [45, 'm'], [41, 'M'], [43, 'M'], [45, 'm'], [40, 'M'], [41, 'M'], [40, 'M']], fn(s, t, d, ch, bar) {
    const b = s % 16; if (b % 4 === 0) kick(t, 0.4); if (b === 4 || b === 12) snare(t, 0.16); if (b % 2 === 1) hat(t, 0.04);
    if (b % 4 === 0 || b % 4 === 3) bass(ch[0] - 12 + (b % 4 === 3 ? 7 : 0), t, d * 1.2, 0.14);
    const mel = [0, 3, 7, 12, 10, 7, 3, 7, 0, 3, 7, 12, 15, 12, 10, 7]; surf(ch[0] + 24 + mel[b] - (ch[1] - ch[0] === 4 ? 0 : 0), t, d, 0.06, d / 2);
    if (b === 0) strings(ch.map(n => n + 12), t, d * 16, 0.016);
  } },
  shoot: { bpm: 128, prog: [[38, 'm'], [38, 'm'], [41, 'M'], [40, 'M'], [38, 'm'], [43, 'm'], [45, 'M'], [45, 'M']], fn(s, t, d, ch, bar) {
    const b = s % 16; if (b === 0 || b === 3 || b === 8 || b === 11) kick(t, 0.45); if (b === 4 || b === 12) snare(t, 0.2); if (b % 2 === 0) hat(t, 0.05);
    bass(ch[0] - 12 + (b % 8 === 6 ? 12 : 0), t, d * 0.9, 0.11);
    if (b === 0 || b === 6 || b === 10) brass(ch.map(n => n + 24), t, d * (b ? 1 : 2), 0.06);
    const m = [7, null, 6, null, 3, null, 0, null, 7, 8, 7, null, 3, null, null, null]; if (m[b] !== null && bar % 2) surf(ch[0] + 24 + m[b], t, d * 1.8, 0.08);
  } },
  canada: { bpm: 140, prog: [[43, 'M'], [48, 'M'], [43, 'M'], [50, 'M'], [43, 'M'], [48, 'M'], [50, 'M'], [43, 'M']], fn(s, t, d, ch, bar) {
    const b = s % 16; if (b % 4 === 0) kick(t, 0.4); if (b === 4 || b === 12) snare(t, 0.16); if (b % 2 === 0) hat(t, 0.04);
    if (b % 4 === 0) bass(ch[0] - 12, t, d * 2); if (b % 4 === 2) bass(ch[0] - 5, t, d * 2);
    if (b % 4 === 0) organ(ch.map(n => n + 24), t, d * 1.6, 0.03);
    const m = [12, null, 16, 19, null, 16, 12, null, 14, null, 17, 21, null, 19, 17, null]; if (m[b] !== null && bar % 2 === 0) brass([ch[0] + 12 + m[b]], t, d * 1.5, 0.06);
    if (m[b] !== null && bar % 2 === 1) surf(ch[0] + 24 + m[b] - 12, t, d * 1.5, 0.07, d / 2);
  } },
  finale: { bpm: 132, prog: [[40, 'm'], [36, 'M'], [43, 'M'], [38, 'M'], [40, 'm'], [36, 'M'], [38, 'M'], [47, 'M']], fn(s, t, d, ch, bar) {
    const b = s % 16; if (b % 4 === 0) kick(t, 0.5); if (b === 4 || b === 12) snare(t, 0.2); if (b === 14) snare(t, 0.1); hat(t, 0.035);
    if (b % 2 === 0) bass(ch[0] - 12 + (b === 6 || b === 14 ? 7 : 0), t, d * 1.8, 0.14);
    if (b === 0) choir(ch.map(n => n + 24), t, d * 15, 0.03); if (b === 0 || b === 10) brass(ch.map(n => n + 24), t, d * 2.5, 0.055);
    const m = [0, 7, 12, 7, 15, 12, 7, 12]; if (b % 2 === 0 && bar % 2 === 1) surf(ch[0] + 24 + m[b / 2], t, d * 2, 0.07, d / 2);
  } },
  cine: { bpm: 92, prog: [[40, 'm'], [45, 'm'], [40, 'm'], [47, 'M']], fn(s, t, d, ch, bar) {
    const b = s % 16; if (b === 0) strings(ch.map(n => n + 12), t, d * 16, 0.022); if (b === 0 || b === 10) bass(ch[0] - 12, t, d * 4, 0.12); if (b === 4 || b === 12) hat(t, 0.025);
    const m = [7, null, null, 6, null, null, 3, null, 0, null, null, null, 3, null, 6, null]; if (m[b] !== null && bar % 2 === 1) surf(ch[0] + 24 + m[b], t, d * 3, 0.06);
  } },
};
function chordOf([r, q]) { return q === 'm' ? minor(r) : q === 'm7b5' ? [r, r + 3, r + 6] : maj(r); }
export function playTrack(name) {
  if (!A.ctx) return; if (A.track === name) return; A.track = name; A.step = 0; A.nextT = A.ctx.currentTime + 0.1;
}
export function stopMusic() { A.track = null; }
function sched() {
  if (!A.ctx || !A.track || A.ctx.state !== 'running') return; const tr = TR[A.track]; if (!tr) return;
  const d = 60 / tr.bpm / 4;
  while (A.nextT < A.ctx.currentTime + 0.12) { const bar = Math.floor(A.step / 16); const ch = chordOf(tr.prog[bar % tr.prog.length]); try { tr.fn(A.step, A.nextT, d, ch, bar); } catch (e) { } A.step++; A.nextT += d; }
}
// ---- SFX ----
const now = () => A.ctx.currentTime;
export function sfx(name, v = 1) {
  if (!A.ctx || A.ctx.state !== 'running') return; const t = now(), D = A.sfx;
  switch (name) {
    case 'boom': noiseHit(t, 0.9, 0.9 * v, D, { lp: 900 }); osc('sine', 90, t, 0.6, 0.7 * v, D, { glide: 30, d: 0.5 }); noiseHit(t, 0.3, 0.3 * v, D, { hp: 2000 }); break;
    case 'bigboom': noiseHit(t, 1.8, 1.1 * v, D, { lp: 600 }); osc('sine', 70, t, 1.4, 0.9 * v, D, { glide: 24, d: 1.2 }); noiseHit(t + 0.1, 1.2, 0.4 * v, D, { lp: 2500 }); break;
    case 'shot': noiseHit(t, 0.08, 0.22 * v, D, { bp: 1800, q: 0.8 }); osc('square', 300, t, 0.05, 0.06 * v, D, { glide: 80, d: 0.05 }); break;
    case 'mg': noiseHit(t, 0.05, 0.16 * v, D, { bp: 2400, q: 1 }); break;
    case 'rocket': noiseHit(t, 0.7, 0.35 * v, D, { bp: 900, q: 0.7 }); osc('sawtooth', 300, t, 0.6, 0.06 * v, D, { glide: 900, filt: 1200, d: 0.5 }); break;
    case 'mine': osc('sine', 600, t, 0.12, 0.2 * v, D, { glide: 300 }); osc('sine', 900, t + 0.08, 0.1, 0.12 * v, D); break;
    case 'coin': osc('square', 1318, t, 0.07, 0.07 * v, D, { d: 0.06 }); osc('square', 1760, t + 0.06, 0.12, 0.07 * v, D, { d: 0.1 }); break;
    case 'crash': noiseHit(t, 0.35, 0.5 * v, D, { lp: 2500 }); osc('square', 120, t, 0.2, 0.15 * v, D, { glide: 50 }); break;
    case 'hit': osc('square', 220, t, 0.08, 0.1 * v, D, { glide: 90, d: 0.07 }); break;
    case 'hurt': osc('sawtooth', 160, t, 0.25, 0.14 * v, D, { glide: 70, filt: 900 }); break;
    case 'siren': for (let i = 0; i < 2; i++) { osc('sine', 700, t + i * 0.5, 0.25, 0.04 * v, D, { glide: 950, sus: 0.03 }); osc('sine', 950, t + i * 0.5 + 0.25, 0.25, 0.04 * v, D, { glide: 700, sus: 0.03 }); } break;
    case 'meow': osc('sawtooth', 700, t, 0.35, 0.09 * v, D, { glide: 420, filt: 2200, a: 0.03, sus: 0.05 }); osc('sine', 1200, t, 0.3, 0.04 * v, D, { glide: 600 }); break;
    case 'hiss': noiseHit(t, 0.45, 0.25 * v, D, { hp: 3500 }); break;
    case 'tap': osc('triangle', 880, t, 0.05, 0.08 * v, D, { d: 0.04 }); break;
    case 'buy': [0, 4, 7, 12].forEach((n, i) => osc('square', NOTE(72 + n), t + i * 0.06, 0.1, 0.06 * v, D, { d: 0.08 })); break;
    case 'choir': choirSting(); break;
    case 'fanfare': fanfare(); break;
    case 'horn': osc('sawtooth', 220, t, 0.5, 0.12 * v, D, { filt: 1200, sus: 0.1 }); osc('sawtooth', 277, t, 0.5, 0.1 * v, D, { filt: 1200, sus: 0.08 }); break;
    case 'splash': noiseHit(t, 0.6, 0.4 * v, D, { lp: 1500 }); break;
    case 'whoosh': noiseHit(t, 0.5, 0.25 * v, D, { bp: 600, q: 0.5 }); break;
    case 'megaphone': osc('sawtooth', 180, t, 0.8, 0.12 * v, D, { filt: 1400, q: 8, sus: 0.1 }); osc('square', 360, t, 0.8, 0.05 * v, D, { filt: 2000, q: 6, sus: 0.04 }); break;
  }
}
function choirSting() {
  const t = now(); const sv = A.music; A.music = A.sfx; // route through sfx bus
  choir([64, 68, 71, 76], t, 2.4, 0.06); osc('sine', NOTE(88), t + 0.3, 1.8, 0.05, A.sfx, { a: 0.4, sus: 0.04, rev: 1 }); for (let i = 0; i < 6; i++) osc('triangle', NOTE(84 + [0, 4, 7, 12, 16, 19][i]), t + 0.15 * i, 0.5, 0.04, A.sfx, { rev: 1, d: 0.4 });
  A.music = sv;
}
function fanfare() {
  const t = now(); const sv = A.music; A.music = A.sfx;
  const seq = [[60, 0, .18], [64, .18, .18], [67, .36, .18], [72, .54, .5], [67, 1.06, .16], [72, 1.24, .9]];
  for (const [n, o, d] of seq) brass([n, n + 4, n + 7].map(x => x + 12), t + o, d, 0.07);
  kick(t + 0.54, 0.5); snare(t + 1.24, 0.25); strings([60, 64, 67, 72].map(x => x + 12), t + 1.24, 1.6, 0.03);
  A.music = sv;
}
