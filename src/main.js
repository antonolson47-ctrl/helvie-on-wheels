// HELVIE ON WHEELS — entry, menus, level flow, victory, shop, settings, test hooks.
import { THREE, E, initEngine, newScene, rnd, pick } from './engine.js';
import * as K from './brik/brik.js';
import { initUI, $, screen, loading, toast, shower, fade, hud, holy } from './ui.js';
import { initInput, I, clearInput, enableTilt } from './input.js';
import { initAudio, playTrack, sfx, setVolumes, stopMusic } from './audio.js';
import { initAntiZoom, resetPageZoom } from './antizoom.js';
import { SAVE, loadSave, save, resetSave } from './save.js';
import { LEVELS, WEAPONS, UPGRADES, QUIPS } from './data.js';
import { playCine } from './cine.js';
import { startDrive } from './drive.js';
import { startShoot } from './shoot.js';
import { startFreefall } from './freefall.js';
import { startFinale } from './finale.js';
import { clearBursts } from './fx.js';
import * as ptitle from './scenes/title.js';
const VER = window.__HW_VER || 'dev';
const G = { mode: null, level: -1, screen: 'boot', busy: false };
window.__HW = G;
function detectQuality() { const ua = navigator.userAgent; const mobile = /iPhone|iPad|iPod|Android|Mobile/.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)); if (!mobile) return 'high'; if ((navigator.hardwareConcurrency || 4) <= 4 && /Android/.test(ua)) return 'low'; return 'med'; }
async function boot() {
  loadSave(); initUI();
  try { initEngine(SAVE.settings.quality || detectQuality()); } catch (e) { loading(true, 'Your browser could not start 3D graphics.<br><br><button class="pe" onclick="location.reload()">RETRY</button>'); throw e; }
  initInput(); initAntiZoom({ onReset: () => resetView() });
  setVolumes(SAVE.settings.music, SAVE.settings.sfx);
  addEventListener('touchstart', () => initAudio(), { once: true, passive: true }); addEventListener('pointerdown', () => initAudio(), { once: true }); addEventListener('keydown', () => initAudio(), { once: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G.mode && !E.paused) pause(); });
  try { await document.fonts.load('40px Bangers'); await document.fonts.load('40px Anton'); } catch (e) { }
  await title();
  loading(false);
}
function resetView() { resetPageZoom(); const b = document.getElementById('resetv'); if (b) b.click(); }
// ---------------- title ----------------
async function titleBackdrop() {
  const scene = newScene({ bloom: 0.7, bloomTh: 0.88 }); const bank = new K.StudBank(scene); K.setBank(bank);
  try { await ptitle.build({ scene, cam: E.cam }); } finally { bank.flush(); K.setBank(null); }
  const p0 = E.cam.position.clone(); let t = 0; E.cam.aspect = E.w / E.h; if (E.w > E.h) E.cam.fov = 44; E.cam.updateProjectionMatrix();
  E.onFrame = (dt, rdt) => { t += rdt; E.cam.position.set(p0.x + Math.sin(t * 0.2) * 40, p0.y + Math.sin(t * 0.3) * 6, p0.z + Math.cos(t * 0.2) * 10); E.cam.lookAt(0, 40, 0); };
}
async function title() {
  G.screen = 'title'; endMode(); hud(null); E.timeScale = 1; E.paused = false;
  await titleBackdrop(); playTrack('title');
  const cont = SAVE.unlocked > 0 && SAVE.unlocked < LEVELS.length;
  screen(`<div class="logo" style="font-size:min(12vw,11vh)">HELVIE ON WHEELS</div><div class="tag">$12M. ONE CHUTE. ZERO SORRY.</div><div style="flex:1;min-height:18vh"></div>
  <div class="btns"><button id="t_play" class="red">${cont ? 'CONTINUE · LVL ' + SAVE.unlocked : 'PLAY STORY'}</button>${cont ? '<button id="t_new">NEW STORY</button>' : ''}<button id="t_levels" class="blue">LEVELS</button><button id="t_shop" class="pink">PAWN &amp; PEW</button><button id="t_how">HOW TO PLAY</button><button id="t_set">SETTINGS</button><button id="t_cred">CREDITS</button></div>
  <div style="margin-top:12px;font-family:Arial;font-size:12px;opacity:.7;letter-spacing:0">18+ cartoon violence · all characters & brands are parody · v${VER} · bonds: ${SAVE.bonds}</div>`, 'clear');
  on('t_play', () => runLevel(cont ? SAVE.unlocked : 0)); on('t_new', () => runLevel(0)); on('t_levels', levels); on('t_shop', () => shop(title)); on('t_how', how); on('t_set', () => settings(title)); on('t_cred', credits);
}
function on(id, fn) { const b = document.getElementById(id); if (b) b.addEventListener('click', e => { e.preventDefault(); initAudio(); sfx('tap'); fn(); }); }
function levels() { G.screen = 'levels';
  screen(`<div class="panel" style="background:#120a14;color:#fff"><h2>PICK A LEVEL</h2><div class="lvlgrid">${LEVELS.map(L => { const lock = L.id > SAVE.unlocked; const st = SAVE.stars[L.id] || 0; return `<button class="lvl ${lock ? 'lock' : ''}" id="lv_${L.id}" ${lock ? 'disabled' : ''}>${L.id}. ${L.name}<small>${L.sub}</small><span class="st">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</span></button>`; }).join('')}</div><div class="btns" style="margin-top:12px"><button id="lv_back">BACK</button></div></div>`);
  LEVELS.forEach(L => on('lv_' + L.id, () => runLevel(L.id))); on('lv_back', title); }
function how() { G.screen = 'how';
  screen(`<div class="panel"><h2>HOW TO PLAY</h2><div style="font-family:Arial;font-weight:bold;letter-spacing:0;font-size:min(3.8vw,2.7vh);line-height:1.4">
  🚚 <b>DRIVING & BOATING:</b> drag anywhere on the LEFT half to steer (or turn on TILT in Settings). The gas is automatic. Hold BRAKE / BOOST. Your guns aim and fire on their own.<br>
  💣 <b>SPECIALS:</b> MINE (boat), FREEDOM HORN (semi), ROCKETS (Julia), CATS (Bob & Jake).<br>
  🔫 <b>SHOOTOUTS:</b> drag the left side to move. Auto-aim and auto-fire are on. TAP glowing pumps and syrup barrels to blow them up.<br>
  ✨ <b>JESUS, TAKE THE WHEEL!</b> Crash, go over the edge, or get stuck, and a golden light lifts you back on course. There's no game over.<br>
  💵 Collect bonds and spend them at UNCLE SAM'S PAWN & PEW.<br>
  📱 Landscape is best. If the page ever zooms, tap VIEW or the red RESET bar.</div><div class="btns" style="margin-top:10px"><button id="h_back">GOT IT</button></div></div>`); on('h_back', title); }
function credits() { G.screen = 'credits';
  screen(`<div class="panel" style="text-align:center"><h2>CREDITS</h2><div style="font-size:min(5vw,3.6vh);line-height:1.3">STARRING ANDY HELVIE & JULIA HELVIE<br>WITH BOB (ORANGE TABBY) & JAKE (GREY KITTY)<br>AND GENERALISSIMO JOSE WIDEN OF PROPAGANDIA (FICTIONAL)<br><br>ORIGINAL SPY-SURF SCORE: PROCEDURAL WEBAUDIO<br>BUILT FROM 100% IMAGINARY BRIKS<br><small style="font-family:Arial;letter-spacing:0">All brands, agencies and people here are parody or fictional. No real toy-brick company is involved. Sorry, eh.</small></div><div class="btns" style="margin-top:10px"><button id="c_back">BACK</button></div></div>`); on('c_back', title); }
// ---------------- settings ----------------
function settings(back) { G.screen = 'settings'; const s = SAVE.settings;
  const row = (lbl, html) => `<div class="row" style="display:flex;align-items:center;gap:10px;border-bottom:2px dashed #ccc;padding:6px 0"><div style="flex:1;font-size:min(5vw,3.6vh)">${lbl}</div>${html}</div>`;
  screen(`<div class="panel shop"><h2>SETTINGS</h2>
  ${row('MUSIC ' + Math.round(s.music * 100) + '%', '<button class="small" id="s_m-">−</button><button class="small" id="s_m+">+</button>')}
  ${row('SOUND FX ' + Math.round(s.sfx * 100) + '%', '<button class="small" id="s_s-">−</button><button class="small" id="s_s+">+</button>')}
  ${row('QUALITY: ' + E.q.toUpperCase() + '<small style="display:block;font-family:Arial;font-size:12px;letter-spacing:0">Lower = smoother on older phones (reloads)</small>', ['low', 'med', 'high'].map(q => `<button class="small ${E.q === q ? 'red' : ''}" id="s_q_${q}">${q.toUpperCase()}</button>`).join(''))}
  ${row('TILT STEERING', `<button class="small ${s.tilt ? 'red' : ''}" id="s_tilt">${s.tilt ? 'ON' : 'OFF'}</button>`)}
  ${row('LEFT-HANDED (steer on right)', `<button class="small ${s.lefty ? 'red' : ''}" id="s_lefty">${s.lefty ? 'ON' : 'OFF'}</button>`)}
  ${row('READ DIALOGUE ALOUD', `<button class="small ${s.readAloud ? 'red' : ''}" id="s_read">${s.readAloud ? 'ON' : 'OFF'}</button>`)}
  ${row('RESET VIEW / ZOOM', '<button class="small blue" id="s_view">RESET</button>')}
  ${row('ERASE SAVE', '<button class="small" id="s_reset">ERASE</button>')}
  <div class="btns" style="margin-top:10px"><button id="s_done" class="red">DONE</button></div></div>`);
  const re = () => { save(); settings(back); };
  on('s_m-', () => { s.music = Math.max(0, +(s.music - 0.1).toFixed(2)); setVolumes(s.music, s.sfx); re(); }); on('s_m+', () => { s.music = Math.min(1, +(s.music + 0.1).toFixed(2)); setVolumes(s.music, s.sfx); re(); });
  on('s_s-', () => { s.sfx = Math.max(0, +(s.sfx - 0.1).toFixed(2)); setVolumes(s.music, s.sfx); re(); }); on('s_s+', () => { s.sfx = Math.min(1, +(s.sfx + 0.1).toFixed(2)); setVolumes(s.music, s.sfx); sfx('coin'); re(); });
  ['low', 'med', 'high'].forEach(q => on('s_q_' + q, () => { if (q === E.q) return; s.quality = q; save(); location.reload(); }));
  on('s_tilt', async () => { if (!s.tilt) { const ok = await enableTilt(); if (!ok) { toast('TILT NOT AVAILABLE', 'Your browser said no', 2); return; } } s.tilt = !s.tilt; re(); });
  on('s_lefty', () => { s.lefty = !s.lefty; re(); }); on('s_read', () => { s.readAloud = !s.readAloud; re(); }); on('s_view', () => { resetPageZoom(); toast('VIEW RESET', '', 1); });
  on('s_reset', () => { const b = document.getElementById('s_reset'); if (b.textContent !== 'SURE?') { b.textContent = 'SURE?'; return; } resetSave(); location.reload(); });
  on('s_done', () => back()); }
// ---------------- shop ----------------
function shop(back, nextLabel) { G.screen = 'shop';
  const lvl = SAVE.unlocked; const guns = WEAPONS.filter(w => w.lvl <= Math.max(1, lvl));
  screen(`<div class="panel shop"><h2>UNCLE SAM'S PAWN &amp; PEW</h2><div style="font-size:min(4.6vw,3.4vh);margin-bottom:6px">"WE BUY BONDS. WE SELL FREEDOM." · YOU HAVE <span style="color:#1fb84a">${SAVE.bonds} BONDS</span> ($${(SAVE.bonds * 0.1).toFixed(1)}M)</div>
  ${UPGRADES.map(u => { const lv = SAVE.up[u.id] || 0; const max = u.cost.length; const cost = u.cost[lv]; return `<div class="row"><div class="nm">${u.name} <span class="pips">${'■'.repeat(lv)}${'□'.repeat(max - lv)}</span><small>${u.desc}</small></div>${lv >= max ? '<button class="small" disabled>MAXED</button>' : `<button class="small ${SAVE.bonds >= cost ? 'red' : ''}" id="u_${u.id}" ${SAVE.bonds >= cost ? '' : 'disabled'}>${cost} BONDS</button>`}</div>`; }).join('')}
  <div style="margin-top:8px;font-size:min(4.4vw,3.2vh)">ARSENAL (UNLIMITED AMMO, ALWAYS): <span style="font-family:Arial;letter-spacing:0;font-size:.75em">${guns.map(w => w.name).join(' · ')}</span></div>
  <div class="btns" style="margin-top:10px"><button id="u_done" class="red">${nextLabel || 'BACK'}</button></div></div>`);
  UPGRADES.forEach(u => on('u_' + u.id, () => { const lv = SAVE.up[u.id] || 0; const c = u.cost[lv]; if (SAVE.bonds < c) return; SAVE.bonds -= c; SAVE.up[u.id] = lv + 1; save(); sfx('buy'); toast(u.name + ' UP!', pick(['Freedom intensifies.', 'The eagle approves.', 'Uncle Sam thanks you for your business.']), 1.4); shop(back, nextLabel); }));
  on('u_done', () => back()); }
// ---------------- weapon reveal ----------------
function reveal(w) { return new Promise(res => { G.screen = 'reveal'; sfx('horn'); screen(`<div class="panel card"><div style="font-size:min(5vw,3.6vh)">NEW AMERICAN HARDWARE!</div><div class="big">${w.name}</div><div style="font-family:Arial;font-weight:bold;letter-spacing:0;font-size:min(4vw,2.8vh);margin:8px 0">${w.desc}</div><div class="apo">🍁 ${w.canada}</div><div class="btns" style="margin-top:12px"><button id="rv_ok" class="red">HECK YES</button></div></div>`); on('rv_ok', () => { screen(''); res(); }); }); }
// ---------------- level flow ----------------
const MODES = { drive: startDrive, shoot: startShoot, freefall: startFreefall, finale: startFinale };
function endMode() { if (G.mode) { try { G.mode.dispose(); } catch (e) { } } G.mode = null; E.onFrame = null; clearBursts(); clearInput(); holy(false); window.__HWshake = null; }
async function runLevel(i, { skipCine = false } = {}) {
  if (G.busy) return; G.busy = true; endMode(); screen(''); hud(null); E.paused = false; E.timeScale = 1; G.level = i; const L = LEVELS[i];
  try {
    if (L.cine && !skipCine) { G.screen = 'cine'; await playCine(L.cine, { music: i === 0 ? 'title' : 'cine' }); }
    for (const w of WEAPONS.filter(w => w.lvl === i && !SAVE.seenWeapons[w.id])) { SAVE.seenWeapons[w.id] = 1; save(); await reveal(w); }
    G.screen = 'loading'; loading(true, 'LOADING ' + L.name + '…'); await new Promise(r => setTimeout(r, 40));
    G.mode = MODES[L.mode](L, { win: st => win(L, st), pause });
    G.screen = 'play'; G.playStart = performance.now(); loading(false);
    const pb = document.getElementById('pause'); if (pb) pb.addEventListener('click', e => { e.preventDefault(); I.press.pause = true; });
    E.onFrame = (dt, rdt) => { if (G.mode) G.mode.update(dt, rdt); };
    import('./ui.js').then(u => u.rotateHint());
  } catch (e) { console.error(e); window.__HWshowErr && __HWshowErr('Level failed to start: ' + e.message); loading(true, 'Oops, a brick fell out.<br><br><button class="pe" id="retry">RETRY</button> <button class="pe" id="retmenu">MENU</button>'); document.getElementById('retry').onclick = () => { loading(false); G.busy = false; runLevel(i, { skipCine: true }); }; document.getElementById('retmenu').onclick = () => { loading(false); G.busy = false; title(); }; }
  G.busy = false;
}
function pause() { if (!G.mode || G.screen !== 'play') return; E.paused = true; G.screen = 'pause'; clearInput();
  screen(`<div class="panel" style="text-align:center"><h2>PAUSED</h2><div class="quip">"${pick(QUIPS.andy)}"</div><div class="btns"><button id="p_res" class="red">RESUME</button><button id="p_rst">RESTART LEVEL</button><button id="p_set">SETTINGS</button><button id="p_quit" class="blue">QUIT TO TITLE</button></div></div>`);
  on('p_res', resume); on('p_rst', () => { E.paused = false; screen(''); runLevel(G.level, { skipCine: true }); }); on('p_set', () => settings(pause2)); on('p_quit', () => { E.paused = false; screen(''); title(); }); }
function pause2() { G.screen = 'play'; pause(); }
function resume() { screen(''); E.paused = false; G.screen = 'play'; clearInput(); }
function stars(st) { let s = 3; if (st.rescues >= 3) s--; if (st.rescues >= 6) s--; if (st.boss === false) s--; return Math.max(1, s); }
async function win(L, st) {
  if (G.screen !== 'play') return; G.screen = 'victory'; const s = stars(st); const bonus = 10 + L.id * 3;
  SAVE.bonds += bonus; SAVE.totalBonds += bonus; SAVE.kills += st.kills || 0; SAVE.stars[L.id] = Math.max(SAVE.stars[L.id] || 0, s); SAVE.unlocked = Math.max(SAVE.unlocked, Math.min(LEVELS.length - 1, L.id + 1)); if (L.id === LEVELS.length - 1) SAVE.finished = 1; save();
  E.timeScale = 1; sfx('fanfare'); shower(55); playTrack('title');
  const who = L.id >= 5 ? pick(['julia', 'andy', 'cats']) : 'andy'; const q = pick(QUIPS[who]); const name = who === 'julia' ? 'JULIA' : who === 'cats' ? 'BOB & JAKE' : 'ANDY';
  const stats = [['BONDS GRABBED', st.bonds || 0], ['LEVEL BONUS', bonus], [L.id >= 4 ? 'MOUNTIES EMBARRASSED' : 'COPS EMBARRASSED', st.kills || 0], ['APOLOGIES RECEIVED', L.id >= 4 ? (st.kills || 0) * 2 + 3 : 0], ['DIVINE ASSISTS', st.rescues || 0], ['TIME', Math.floor((st.time || 0) / 60) + ':' + String(Math.floor((st.time || 0) % 60)).padStart(2, '0')]];
  if (L.id >= 5) stats.push(['CATS: ' + ((st.kills || 0) + 7), 'MOUNTIES: SORRY']);
  await new Promise(r => setTimeout(r, 400));
  screen(`<div class="panel" style="text-align:center"><h2>${L.id === LEVELS.length - 1 ? 'FREEDOM!!!' : pick(['VICTORY!', 'KA-BLAM! YOU WIN!', 'NAILED IT, PAL!', 'SORRY-NOT-SORRY WIN!'])}</h2><div style="font-size:min(5vw,3.6vh)">${L.name}</div>
  <div class="stars">${[0, 1, 2].map(i => `<span class="${i < s ? '' : 'off'}">★</span>`).join('')}</div><div class="quip"><b style="color:#e0103a">${name}:</b> "${q}"</div>
  <div class="stats">${stats.map(([a, b]) => `<div>${a}: <b>${b}</b></div>`).join('')}</div>
  <div class="btns"><button id="v_next" class="red">${L.id === LEVELS.length - 1 ? 'THE ENDING' : 'CONTINUE'}</button><button id="v_shop" class="pink">PAWN &amp; PEW</button><button id="v_again">REPLAY</button><button id="v_menu" class="blue">MENU</button></div></div>`);
  const next = async () => { if (L.id === LEVELS.length - 1) { endMode(); hud(null); screen(''); G.screen = 'cine'; await playCine('ending', { music: 'finale' }); credits(); return; } runLevel(L.id + 1); };
  on('v_next', () => shop(next, 'NEXT LEVEL ▶')); on('v_shop', () => shop(() => win2(L, st), 'BACK')); on('v_again', () => runLevel(L.id, { skipCine: true })); on('v_menu', title);
}
function win2(L, st) { G.screen = 'play'; win(L, st); }
// ---------------- test hooks ----------------
Object.defineProperties(G, Object.getOwnPropertyDescriptors({
  ver: VER, E, I, get SAVE() { return SAVE; }, get S() { return G.mode && G.mode.S; },
  info: () => ({ screen: G.screen, level: G.level, fps: Math.round(E.fps), q: E.q, mode: G.mode && G.mode.hooks && G.mode.hooks.info ? G.mode.hooks.info() : null, bonds: SAVE.bonds }),
  hooks: () => G.mode && G.mode.hooks, go: (i, o) => { runLevel(i, o); return true; }, title, cine: () => window.__HWcine, press: id => { I.press[id] = true; }, hold: (id, v) => { I.hold[id] = v; }, steer: v => { I.touchSteer = v; },
  unlockAll: () => { SAVE.unlocked = LEVELS.length - 1; SAVE.bonds += 500; save(); },
}));
boot().catch(e => { console.error(e); window.__HWshowErr && __HWshowErr('Boot failed: ' + e.message); });
