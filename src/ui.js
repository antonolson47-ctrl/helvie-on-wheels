// DOM UI: styles, screens, HUD, touch controls, dialogue bubbles. Pointer-events lesson: #ui and children are
// pointer-events:none; only .pe / .screen subtrees take taps, so the 3D touch layer never steals menu taps.
import { E } from './engine.js';
const CSS = `
html,body{margin:0;height:100%;background:#000;overflow:hidden;overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;touch-action:none}
canvas#gl{position:fixed;inset:0;width:100vw!important;height:100vh!important;display:block}
#ui{position:fixed;inset:0;pointer-events:none;touch-action:none;font-family:Bangers,Impact,sans-serif;color:#fff;letter-spacing:1px}
#ui *{pointer-events:none;box-sizing:border-box}
#ui .pe,#ui .pe *,#ui .screen,#ui .screen *{pointer-events:auto}
#touch{position:absolute;inset:0;pointer-events:auto!important;touch-action:none}
#bursts{position:absolute;inset:0;overflow:hidden}
.burst{position:absolute;left:0;top:0;will-change:transform;filter:none}
.screen{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,rgba(40,10,60,.55),rgba(0,0,0,.85));overflow:auto;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:max(14px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(14px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}
.screen.clear{background:none}
.logo{font-family:Bangers;font-size:min(15vw,13vh);line-height:.9;color:#ffe14d;-webkit-text-stroke:3px #120a14;text-shadow:6px 6px 0 #e0103a,10px 10px 0 #120a14;transform:rotate(-4deg);text-align:center;margin:0 0 .2em}
.tag{font-family:Anton,Impact;font-size:min(4.6vw,3.6vh);color:#fff;text-shadow:3px 3px 0 #120a14;margin-bottom:1em;text-align:center}
.btns{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:900px}
button{font-family:Bangers,Impact;font-size:min(6vw,4.4vh);letter-spacing:2px;color:#120a14;background:#ffe14d;border:4px solid #120a14;border-radius:14px;padding:.35em .9em;box-shadow:5px 5px 0 #120a14;touch-action:manipulation;cursor:pointer;-webkit-tap-highlight-color:transparent}
button:active{transform:translate(3px,3px);box-shadow:2px 2px 0 #120a14}
button.red{background:#e0103a;color:#fff}button.blue{background:#7af0ff}button.pink{background:#ff5fa2;color:#fff}button.small{font-size:min(4.4vw,3.2vh);padding:.25em .7em}
button:disabled{opacity:.45}
.panel{background:#fff;color:#120a14;border:5px solid #120a14;border-radius:16px;box-shadow:8px 8px 0 #120a14;padding:14px 18px;max-width:min(94vw,860px);width:100%}
.panel h2{margin:0 0 .3em;font-size:min(8vw,6vh);color:#e0103a;-webkit-text-stroke:1px #120a14}
.lvlgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(42vw,250px),1fr));gap:10px;width:100%;max-width:1000px}
.lvl{background:#1d2a6a;color:#fff;border:4px solid #120a14;border-radius:12px;padding:10px;text-align:left;font-size:min(5vw,3.6vh);box-shadow:4px 4px 0 #120a14}
.lvl small{display:block;font-family:Arial;font-weight:bold;font-size:min(3.2vw,2.3vh);opacity:.85;letter-spacing:0}
.lvl .st{color:#ffe14d}.lvl.lock{opacity:.4}
.shop .row{display:flex;align-items:center;gap:10px;border-bottom:2px dashed #ccc;padding:8px 0}.shop .row .nm{flex:1;font-size:min(5vw,3.6vh)}.shop .row small{display:block;font-family:Arial;font-size:min(3.2vw,2.3vh);letter-spacing:0;color:#444}
.pips{color:#e0103a;font-size:min(4.4vw,3.2vh)}
#hud{position:absolute;inset:0}
.hbar{position:absolute;height:22px;border:3px solid #120a14;border-radius:10px;background:#3a1020;overflow:hidden;box-shadow:3px 3px 0 #120a14}
.hbar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(#7dff8a,#1fb84a);width:100%}
.hbar b{position:absolute;inset:0;text-align:center;font-weight:normal;font-size:16px;line-height:17px;text-shadow:1px 1px 0 #000;white-space:nowrap}
#hp{left:max(12px,env(safe-area-inset-left));top:max(10px,env(safe-area-inset-top));width:min(34vw,260px)}
#prog{left:50%;transform:translateX(-50%);top:max(10px,env(safe-area-inset-top));width:min(36vw,340px)}
#prog i{background:linear-gradient(#ffe14d,#ff8a1a)}
#boss{left:50%;transform:translateX(-50%);top:calc(max(10px,env(safe-area-inset-top)) + 32px);width:min(50vw,460px);display:none}
#boss i{background:linear-gradient(#ff6a6a,#c00)}
#bondsc{position:absolute;right:calc(max(12px,env(safe-area-inset-right)) + 58px);top:max(8px,env(safe-area-inset-top));font-size:28px;color:#a8ff60;-webkit-text-stroke:1.5px #120a14;text-shadow:2px 2px 0 #120a14}
#pause{position:absolute;right:max(10px,env(safe-area-inset-right));top:max(6px,env(safe-area-inset-top));width:46px;height:46px;padding:0;font-size:24px;border-radius:12px}
#resetv{position:absolute;right:max(10px,env(safe-area-inset-right));top:calc(max(6px,env(safe-area-inset-top)) + 54px);width:46px;height:40px;padding:0;font-size:14px;border-radius:10px;background:#7af0ff}
#toast{position:absolute;left:0;right:0;top:22%;text-align:center;font-size:min(9vw,8vh);color:#ffe14d;-webkit-text-stroke:2px #120a14;text-shadow:4px 4px 0 #e0103a,7px 7px 0 #120a14;opacity:0;transition:opacity .3s;padding:0 4vw}
#toast small{display:block;font-size:.45em;color:#fff;text-shadow:2px 2px 0 #120a14}
#radio{position:absolute;left:max(12px,env(safe-area-inset-left));top:72px;max-width:min(60vw,520px);display:flex;flex-direction:column;gap:6px}
.say{background:#fff;color:#120a14;border:3px solid #120a14;border-radius:14px;padding:6px 12px;font-size:min(4.6vw,3.6vh);box-shadow:4px 4px 0 #120a14;animation:pop .25s ease-out}
.say b{color:#e0103a;margin-right:6px}
@keyframes pop{0%{transform:scale(.4)}70%{transform:scale(1.08)}100%{transform:scale(1)}}
.ctl{position:absolute;bottom:max(14px,env(safe-area-inset-bottom));display:flex;gap:12px;align-items:flex-end}
#ctlR{right:max(14px,env(safe-area-inset-right));flex-direction:column;align-items:flex-end}
#ctlR .rowb{display:flex;gap:12px}
.cb{width:min(19vw,13vh,110px);height:min(19vw,13vh,110px);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;font-size:min(4.4vw,3vh,22px);line-height:1;padding:0;text-align:center;border:4px solid #120a14;box-shadow:4px 4px 0 #120a14;position:relative;overflow:hidden}
.cb .cd{position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.45);height:0}
.cb.on{transform:scale(.92);filter:brightness(1.3)}
.cb.ready{animation:pulse 0.8s infinite alternate}
@keyframes pulse{to{box-shadow:0 0 0 6px #fff6,4px 4px 0 #120a14}}
#stick{position:absolute;width:150px;height:150px;border-radius:50%;border:4px solid rgba(255,255,255,.5);background:rgba(0,0,0,.18);display:none}
#stick i{position:absolute;left:45px;top:45px;width:60px;height:60px;border-radius:50%;background:rgba(255,225,77,.85);border:3px solid #120a14}
#steerhint{position:absolute;left:max(18px,env(safe-area-inset-left));bottom:max(18px,env(safe-area-inset-bottom));font-size:min(4.4vw,3.2vh);opacity:.85;text-shadow:2px 2px 0 #000;background:rgba(0,0,0,.35);border:2px dashed rgba(255,255,255,.6);border-radius:16px;padding:10px 14px}
#cine{position:absolute;inset:0;display:none}
#cine .bars{position:absolute;left:0;right:0;height:9vh;background:#000}
#cine .bub{position:absolute;left:50%;bottom:calc(10vh + env(safe-area-inset-bottom));transform:translateX(-50%);width:min(92vw,820px);background:#fff;color:#120a14;border:5px solid #120a14;border-radius:22px;padding:12px 20px;font-size:min(5.6vw,4.4vh);box-shadow:7px 7px 0 #120a14;line-height:1.15}
#cine .bub b{display:inline-block;background:#e0103a;color:#fff;padding:2px 10px;border-radius:8px;border:3px solid #120a14;margin:-30px 0 4px -6px;font-size:.8em;transform:rotate(-3deg)}
#cine .bub.nar{background:#ffe14d}
#cine .skip{position:absolute;right:max(12px,env(safe-area-inset-right));top:calc(9vh + 8px);font-size:min(4.4vw,3vh)}
#cine .tapn{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:calc(10vh + env(safe-area-inset-bottom) - 6px);font-size:min(3.8vw,2.6vh);opacity:.8;transform:translateY(100%)}
#cine .ttl{position:absolute;left:0;right:0;top:12vh;text-align:center;font-size:min(10vw,9vh);color:#ffe14d;-webkit-text-stroke:2px #120a14;text-shadow:5px 5px 0 #e0103a,8px 8px 0 #120a14}
#cine .ttl small{display:block;font-family:Anton;font-size:.38em;color:#fff;-webkit-text-stroke:0;text-shadow:2px 2px 0 #000}
.card{transform:rotate(-2deg);text-align:center}
.card .big{font-size:min(10vw,8vh);color:#e0103a;-webkit-text-stroke:2px #120a14;line-height:1}
.card .apo{margin-top:10px;background:#d11a1a;color:#fff;border:3px solid #120a14;border-radius:10px;padding:6px 10px;font-size:min(4.6vw,3.4vh);transform:rotate(2deg)}
.stars{font-size:min(16vw,12vh);color:#ffe14d;-webkit-text-stroke:3px #120a14;letter-spacing:6px}
.stars .off{color:#555}
.stats{font-family:Arial;font-weight:bold;letter-spacing:0;font-size:min(3.8vw,2.8vh);text-align:left;columns:2;column-gap:20px;margin:8px 0}
.quip{font-size:min(5.6vw,4vh);margin:6px 0 12px;color:#1d2a6a}
#rotate{position:absolute;left:50%;bottom:30%;transform:translateX(-50%);background:rgba(0,0,0,.6);border-radius:12px;padding:8px 14px;font-size:min(5vw,3vh);display:none;white-space:nowrap}
#loading{position:absolute;inset:0;background:#120a14;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:min(8vw,6vh);color:#ffe14d;z-index:5}
#loading.hide{display:none}
#fade{position:absolute;inset:0;background:#000;opacity:0;transition:opacity .35s}
#holy{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 0%,rgba(255,240,180,.75),rgba(255,220,120,.25) 45%,rgba(255,220,120,0) 75%);opacity:0;transition:opacity .4s}
#shower{position:absolute;inset:0;overflow:hidden}
.bondp{position:absolute;top:-60px;width:56px;height:34px;background:#d8efbf;border:3px solid #2c6a1e;border-radius:3px;font:bold 12px Arial;color:#2c6a1e;display:flex;align-items:center;justify-content:center;animation:fall linear forwards}
@keyframes fall{to{transform:translateY(115vh) rotate(720deg)}}
`;
export const $ = s => document.querySelector(s);
export function initUI() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const ui = document.createElement('div'); ui.id = 'ui';
  ui.innerHTML = `<div id="touch"></div><div id="holy"></div><div id="bursts"></div><div id="hud" style="display:none"></div><div id="cine"></div><div id="shower"></div><div id="toast"></div><div id="rotate">Landscape is best — but portrait works too</div><div id="screen"></div><div id="fade"></div><div id="loading"><div>HELVIE ON WHEELS</div><div style="font-size:.5em;color:#fff" id="loadmsg">LOADING BRIKS…</div></div>`;
  document.body.appendChild(ui);
}
export function loading(on, msg) { const l = $('#loading'); l.classList.toggle('hide', !on); if (msg) $('#loadmsg').innerHTML = msg; }
let toastT = 0;
export function toast(t, sub = '', dur = 2.2) { const el = $('#toast'); el.innerHTML = t + (sub ? `<small>${sub}</small>` : ''); el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => el.style.opacity = 0, dur * 1000); }
export function radio(who, text, dur = 3.6) { const r = $('#radio'); if (!r) return; const d = document.createElement('div'); d.className = 'say'; d.innerHTML = `<b>${who}:</b>${text}`; r.appendChild(d); while (r.children.length > 2) r.firstChild.remove(); setTimeout(() => d.remove(), dur * 1000); }
export function fade(on) { $('#fade').style.opacity = on ? 1 : 0; return new Promise(r => setTimeout(r, 380)); }
export function screen(html, cls = '') { const s = $('#screen'); s.innerHTML = html ? `<div class="screen ${cls}" style="${cls.includes('clear')?'justify-content:space-between':''}">${html}</div>` : ''; return s.firstChild; }
export function shower(n = 40) { const sh = $('#shower'); for (let i = 0; i < n; i++) { const b = document.createElement('div'); b.className = 'bondp'; b.textContent = '$100K'; b.style.left = Math.random() * 100 + 'vw'; b.style.animationDuration = (1.6 + Math.random() * 2.2) + 's'; b.style.animationDelay = Math.random() * 1.6 + 's'; sh.appendChild(b); setTimeout(() => b.remove(), 6000); } }
export function holy(on) { $('#holy').style.opacity = on ? 1 : 0; }
export function hud(html) { const h = $('#hud'); if (html === null) { h.style.display = 'none'; h.innerHTML = ''; return; } h.innerHTML = html; h.style.display = ''; }
export function setBar(id, f, label) { const b = document.getElementById(id); if (!b) return; b.querySelector('i').style.width = Math.max(0, Math.min(1, f)) * 100 + '%'; if (label !== undefined) b.querySelector('b').textContent = label; }
export function rotateHint() { const r = $('#rotate'); const portrait = innerHeight > innerWidth; r.style.display = portrait ? 'block' : 'none'; setTimeout(() => r.style.display = 'none', 3500); }
