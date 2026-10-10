// Brick-built 3D cutscenes with comic speech bubbles. Reuses the approved panel scenes as sets.
import { THREE, E, newScene, makeObj, rnd, pick } from './engine.js';
import * as K from './brik/brik.js';
import * as W from './brik/world.js';
import * as MD from './models.js';
import { groundPlane, waterPlane } from './ground.js';
import { $ } from './ui.js';
import { sfx, playTrack } from './audio.js';
import { SAVE } from './save.js';
import * as p1 from './scenes/p1.js'; import * as p2 from './scenes/p2.js'; import * as p3 from './scenes/p3.js'; import * as p4 from './scenes/p4.js'; import * as p5 from './scenes/p5.js'; import * as p6 from './scenes/p6.js'; import * as p7 from './scenes/p7.js'; import * as ptitle from './scenes/title.js';
const PANELS = { p1, p2, p3, p4, p5, p6, p7, title: ptitle };
const C = MD.chars;
const CUSTOM = {
  cabin(scene, cam) { K.sky(scene, ['#1a1430', '#2a2440']); scene.add(new THREE.HemisphereLight(0xfff0e0, 0x403040, 1.4)); const d = new THREE.DirectionalLight(0xfff0d8, 1.6); d.position.set(100, 300, 200); scene.add(d);
    groundPlane(scene, 300, 1600, '#7a1a2a', 0, 0, -400); const wall = []; for (let z = 300; z > -1100; z -= 40) for (const x of [-150, 150]) wall.push({ x, y: 100, z, sx: 16, sy: 200, sz: 40, color: '#e8e4dc', noStud: true }); K.instBricks(scene, wall);
    const ceil = new THREE.Mesh(new THREE.BoxGeometry(300, 6, 1600), K.plastic('#f4f0e8')); ceil.position.set(0, 200, -400); scene.add(ceil);
    for (let z = 200; z > -1000; z -= 90) for (const x of [-95, 95]) { const s = makeObj(g => { const b = K.brick(8, 6, 4, '#1d2a6a'); g.add(b); const bk = K.brick(8, 2, 12, '#1d2a6a'); bk.position.set(0, 0, -20); g.add(bk); }); s.position.set(x, 0, z); scene.add(s); const w = new THREE.Mesh(new THREE.BoxGeometry(2, 30, 22), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc890').multiplyScalar(1.3) })); w.position.set(x > 0 ? 141 : -141, 120, z); scene.add(w); }
    const a = C.andy({ suit: true, armRot: [[1.2, 0.1], [0.6, -0.1]] }); a.position.set(-95, 20, 110); a.rotation.y = Math.PI * 0.85; scene.add(a);
    const fa = K.minifig({ skin: '#f2c09a', torso: '#c8102e', legs: '#1a1a24', shoes: '#111', face: K.genericFace('scared'), hat: K.copHat('#c8102e'), faceHair: '#5a3412' }); fa.position.set(0, 0, 40); fa.rotation.y = -0.4; scene.add(fa);
    const chili = makeObj(g => { const b = K.brick(2, 2, 3, '#c8102e', { opacity: .9 }); g.add(b); const lid = K.brick(2, 2, 1, '#2a5aa8'); lid.position.y = 9.6; g.add(lid); const t = MD.label('CHILI (BOMB)', 20, 6, '#fff', '#c8102e', 'bold 70px Anton'); t.position.set(0, 5, 8.2); g.add(t); }); chili.position.set(-70, 46, 130); scene.add(chili);
    const bc = K.brick(4, 1, 3, '#3a2418'); bc.position.set(-120, 34, 120); scene.add(bc); K.bankStuds(bc);
    const note = MD.label('I HAVE A BOMB. ALSO, PRETZELS PLEASE.', 40, 12, '#fffbe0', '#111', 'bold 60px Arial'); note.position.set(-28, 44, 70); note.rotation.y = -0.5; scene.add(note);
    cam.position.set(30, 70, 300); cam.lookAt(-50, 40, 60); cam.fov = 50; return {};
  },
  jetdoor(scene, cam) { return p1.build({ scene, cam }); },
  border(scene, cam) { K.sky(scene, ['#1a1a4a', '#4a5ab8', '#b8a8e8', '#ffd0b0']); scene.fog = new THREE.Fog(0xb8b0d8, 900, 4000); W.lights(scene, { dir: [300, 400, 300], sun: 0xfff0d8, si: 2.4, ext: 400, hi: 0.8, target: [0, 0, 0] });
    waterPlane(scene, '#2a6aa8', 8000, 0); const b = MD.label('WELCOME TO CANADA – SORRY ABOUT THE GEESE', 360, 40, '#d11a1a', '#fff'); b.position.set(0, 130, -200); scene.add(b); const pole = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 130), K.plastic('#f4f4f4')); pole.position.set(0, 60, -205); scene.add(pole);
    const buoy = new THREE.Mesh(new THREE.CylinderGeometry(30, 36, 30, 16), K.plastic('#d11a1a')); buoy.position.set(0, 10, -205); scene.add(buoy);
    const bt = MD.boat({ color: '#ff2e88', name: 'BOND VOYAGE' }); bt.position.set(-60, 0, 40); bt.rotation.y = -0.6; scene.add(bt); const a = C.andy({ armRot: [[2.9, 0.3], [1.2, -0.1]] }); a.position.set(0, 12, -14); bt.add(a);
    for (let i = 0; i < 3; i++) { const g = MD.geese(5); g.position.set(-200 + i * 220, 160 + i * 30, -400 - i * 100); scene.add(g); }
    W.terrain(scene, { x0: -400, z0: -320, w: 800, l: 40, step: 14, colors: ['#1f3a2a', '#2a4a3a', '#3a4a55'], snow: 60, hf: (x, z) => Math.max(0, 500 + K.noise(x, z) * 150) });
    for (let i = 0; i < 14; i++) { const t = makeObj(g => W.tree(g, 0, 0, 2.2, pick(['#c8102e', '#e0501a', '#1d5a2a']))); t.position.set(-900 + i * 140, 0, -700 - rnd(200)); scene.add(t); }
    cam.position.set(120, 90, 340); cam.lookAt(-20, 70, -100); cam.fov = 50; return {}; },
  taunt(scene, cam) { K.sky(scene, ['#12082e', '#4a1a6a', '#c03a6a', '#ff8a3a', '#ffd070']); W.lights(scene, { dir: [-300, 200, 200], sun: 0xffa060, si: 2.4, ext: 300, hi: 0.8, target: [0, 0, 0] });
    W.terrain(scene, { x0: -60, z0: -90, w: 120, l: 60, step: 6, y0: -900, colors: ['#4a4a52', '#5a5a62', '#6a6a72'], snow: 40, hf: (x, z) => Math.max(0, 700 - Math.hypot(x, z + 300) * 0.9 + K.noise(x, z) * 60) });
    const h = makeObj(() => W.heli(), { merge: false }); h.position.set(0, 120, 0); h.rotation.y = 0.5; h.scale.setScalar(1.3); scene.add(h); const g = C.general({ armRot: [[2.8, 0.4], [1.4, -0.3]] }); g.position.set(0, -10, 28); h.add(g);
    const mg = new THREE.Mesh(new THREE.ConeGeometry(8, 22, 16, 1, true), K.plastic('#f2c21a', { metal: .8, rough: .3, side: THREE.DoubleSide })); mg.rotation.x = -Math.PI / 2; mg.position.set(-10, 34, 44); h.add(mg);
    cam.position.set(60, 150, 260); cam.lookAt(0, 110, 0); cam.fov = 50; return {}; },
  beach(scene, cam) { K.sky(scene, ['#1a4a9a', '#4a9ae0', '#9ad8ff', '#ffe8c0']); W.lights(scene, { dir: [300, 500, 300], sun: 0xfff0d8, si: 2.8, ext: 400, hi: 0.9, target: [0, 0, 0] });
    waterPlane(scene, '#1fb0c8', 8000, -2); groundPlane(scene, 1200, 500, '#f0d890', 0, 0, 150);
    for (const [x, z] of [[-260, 40], [280, 0], [-420, 220]]) { const p = makeObj(g => { for (let i = 0; i < 8; i++) { const b = K.brick(1, 1, 3, '#7a4a1a'); b.position.set(i * 1.5, i * 9.6, 0); g.add(b); } for (let i = 0; i < 5; i++) { const l = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 12), K.plastic('#2a8a3a')); l.position.set(12, 80, 0); l.rotation.y = i * 1.25; l.rotation.z = -0.3; g.add(l); } }); p.position.set(x, 0, z); p.scale.setScalar(1.5); scene.add(p); }
    const bar = makeObj(g => { const b = K.brick(14, 5, 8, '#c8a050'); g.add(b); const r = K.brick(16, 7, 1, '#2a8a3a'); r.position.y = 60; g.add(r); const s = MD.label('THE MUSTACHE BAR · NON-EXTRADITION SPECIALS', 140, 16, '#ffe14d', '#c8102e'); s.position.set(0, 40, 20.5); g.add(s); }); bar.position.set(150, 0, -60); scene.add(bar);
    const mus = new THREE.Mesh(new THREE.TorusGeometry(20, 5, 8, 20, Math.PI), K.plastic('#1a0e08')); mus.position.set(150, 82, -38); mus.rotation.z = Math.PI; scene.add(mus);
    const a = C.andy({ armRot: [[1.0, 0.2], [0.3, 0]] }); a.position.set(-40, 0, 140); a.rotation.y = 0.2; scene.add(a); const j = C.julia({ armRot: [[1.0, -0.2], [0.3, 0]] }); j.position.set(30, 0, 140); j.rotation.y = -0.2; scene.add(j);
    const b = C.bob({}); b.position.set(-100, 0, 180); scene.add(b); const jk = C.jake({}); jk.position.set(100, 0, 190); jk.rotation.y = -0.6; scene.add(jk);
    cam.position.set(0, 70, 380); cam.lookAt(20, 50, 80); cam.fov = 50; return {}; },
};
export const CINES = {
  intro: [{ set: 'cabin', title: 'HELVIE ON WHEELS', sub: 'Flight 305-ish · Somewhere over Seattle-ish', lines: [['NARRATOR', 'Seattle-ish, the Pacific Northwest. A man in a skinny tie and a ST. GERMAIN cap boards a flight. His name: Andy Helvie. His carry-on: suspicious.'], ['ANDY', "Ma'am, I'm gonna need you to read this note. Out loud, if you could. My eyes aren't what they used to be."], ['FLIGHT ATTENDANT', '"I have a bomb. Also, pretzels please." ...Sir, is that a bomb?'], ['ANDY', "It's my wife's chili. Same blast radius. Now, I'll take twelve million in bearer bonds and the pretzels."], ['FLIGHT ATTENDANT', 'We only have the honey-mustard ones.'], ['ANDY', "I'm retired, not an animal. Honey-mustard is fine."], ['NARRATOR', 'Twenty minutes later: one briefcase, $12 million in bearer bonds, one parachute, and a rear stairway that really should have been locked.'], ['ANDY', 'Keep the change, Uncle Sam.', 'qte']] }],
  semi1: [{ set: 'p2', title: 'LEVEL 1: HAUL ASS-ETS', sub: 'Steal a semi. Outrun the Seattle-ish PD. Reach the marina.', lines: [['NARRATOR', 'Andy lands in a field next to a Kenwhirl semi. Keys in the visor. Because of course they are.'], ['SGT. PUDDLESWORTH', "This is Sergeant Dewey Puddlesworth! Pull over! I've got the paperwork already filled out!"], ['ANDY', "Sorry, Sergeant. I've got 18 wheels and a dream."], ['NARRATOR', 'TIP: drag on the left side to steer. The gun fires itself. Freedom is automatic.']] }],
  marina: [{ set: 'p3', title: "LEVEL 2: GAS 'N' BLAST", sub: "The Gas 'n' Gulp Marine Fuel dock. Heavily armed. Very flammable.", lines: [['NARRATOR', "The marina. A speedboat called the BOND VOYAGE waits at the end of the dock. Between Andy and the boat: forty cops and the Gas 'n' Gulp."], ['COP', 'Freeze! Or at least... slow down a bit!'], ['ANDY', "Fellas, that's a lot of gasoline you're standing next to."], ['NARRATOR', 'TIP: tap the glowing gas pumps. You know what to do.']] }],
  boat1: [{ set: 'p3', cam: 'boat', title: 'LEVEL 3: SALISH SLALOM', sub: 'Speedboat + unlimited Liberty Mines', lines: [['NARRATOR', 'The BOND VOYAGE roars out of the burning marina, trailing smoke, sirens, and one very confused pelican.'], ['COAST REGARD', 'This is the Coast Regard! We regard you as under arrest!'], ['ANDY', "Regard THIS. It's a rubber duck. It explodes."], ['NARRATOR', "TIP: MINE drops Liberty Mines behind you. Don't hit the orcas. Actually, do: they high-five you."]] }],
  border: [{ set: 'border', title: 'LEVEL 4: BORDER WATERS, EH', sub: 'Welcome to Canada. Sorry about the geese.', lines: [['NARRATOR', 'The border. Marked by a single, apologetic buoy.'], ['ANDY', 'Canada! Smell that? Maple and apologies.'], ['RCMP RADIO', "Attention speedboat! Please stop! If it's not too much trouble! Sorry!"], ['NARRATOR', 'The Canadian navy responds with canoes, a Zamboni-boat, and a hovercraft named THE APOLOGY.']] }],
  vancouver: [{ set: 'p4', title: 'LEVEL 5: SORRY, NOT SORRY', sub: 'Downtown Vancouver. Julia arrives.', lines: [['NARRATOR', "Downtown Vancouver, outside a Tim Hortoff's. A pink minivan screeches to a halt."], ['JULIA', 'Honey, I packed snacks and rockets. Unlimited rockets.'], ['ANDY', 'Julia! How did you get here so fast?'], ['JULIA', 'I drove like you do. Badly, with conviction.']] }, { set: 'p6', lines: [['JULIA', "And I brought the boys. Bob, Jake: Mounties. Go."], ['BOB', 'MRRROW. (Translation: "Their hats look like scratching posts.")'], ['JAKE', '*hurk* ...*hurk* (A hairball is loading.)'], ['MOUNTIE', "Oh geez. Sorry! Nice kitty, eh? NICE KITTY?!"], ['NARRATOR', 'TIP: CATS sends Bob pouncing and Jake hairballing. ROCKETS is Julia. Tap the syrup barrels.']] }],
  hiway: [{ set: 'p4', cam: 'close', title: 'LEVEL 6: TRANS-CANADA HI-WAY', sub: 'Andy drives. Julia rockets. The kitties ride the trailer.', lines: [['NARRATOR', 'A black FREEDOMLINER semi. A trailer full of rockets. A wife on the roof. Two cats with no fear and no remorse.'], ['JULIA', 'Make it rain, sweetheart.'], ['ANDY', 'It is raining. It\'s Canada.'], ['MOUNTIE RADIO', 'All units: suspects heading east on the Trans-Canada! Also they have cats! Sorry!']] }],
  rocky: [{ set: 'taunt', title: 'LEVEL 7: ROCKY ROAD', sub: 'Mountain switchbacks. Propagandia shows up.', lines: [['NARRATOR', 'High in the Rockies, a gold helicopter appears, flying a purple-and-gold flag with a megaphone on it. It is the flag of PROPAGANDIA.'], ['GENERALISSIMO JOSE WIDEN', 'HELVIE! Those bonds came from MY offshore account! Every bond is MY bond! Every flag is MY flag!'], ['ANDY', "Who's this clown?"], ['JULIA', 'Generalissimo Jose Widen. He put his flag on my cereal once.'], ['GENERALISSIMO JOSE WIDEN', 'It was MY cereal! Goons! Megaphone jeeps! GET THEM!']] }],
  mountain: [{ set: 'taunt', cam: 'far', title: 'FINALE: MUSTACHE MOUNTAIN', sub: 'Climb. Then blow up PROPAGANDIA ONE.', lines: [['NARRATOR', 'The road ends at Mustache Mountain, named for the Generalissimo, who named it after his mustache, which has its own medal.'], ['GENERALISSIMO JOSE WIDEN', 'Climb, little Americans! At the top waits PROPAGANDIA ONE, my 24-karat helicopter!'], ['JULIA', "Honey? I saved the big rocket."], ['ANDY', "Let's go get our freedom. Bob, Jake: heel. ...Or don't. You're cats."]] }],
  ending: [{ set: 'p5', title: 'FREEDOM!', sub: 'PROPAGANDIA ONE: down. The Helvies: free.', lines: [['NARRATOR', 'And so the Generalissimo flew off into the sunset. Not in a helicopter. Just generally.'], ['GENERALISSIMO JOSE WIDEN', 'MY MONOCLE!! This is NOT my flag!!'], ['ANDY', 'Nobody out-guns a Helvie, pal.']] }, { set: 'beach', title: 'EPILOGUE', sub: 'A non-extradition paradise', lines: [['NARRATOR', 'Six months later. A beach. The Generalissimo\'s mustache is mounted over the bar.'], ['JULIA', 'Another piña colada, sweetheart? I put a tiny rocket in it.'], ['ANDY', "I'm retired. This is my hobby."], ['NARRATOR', 'Back in Seattle-ish, Sgt. Dewey Puddlesworth mails a postcard: "Still filing." In Vancouver, every Mountie writes an apology letter. Bob and Jake knock all of them off the table.'], ['NARRATOR', 'THE END. ...Sorry it\'s over, eh.']] }],
};
let cur = null;
async function buildSet(set, camKey) {
  const scene = newScene({ bloom: 0.6, bloomTh: 0.88 }); const cam = E.cam;
  const bank = new K.StudBank(scene); K.setBank(bank);
  try { if (CUSTOM[set]) await CUSTOM[set](scene, cam); else await PANELS[set].build({ scene, cam }); } finally { bank.flush(); K.setBank(null); }
  scene.traverse(o => { if (o.isLight && o.castShadow && E.q === 'low') o.castShadow = false; });
  if (camKey === 'boat') { cam.position.set(-60, 50, 320); cam.lookAt(0, 40, 0); }
  if (camKey === 'close') { cam.position.multiplyScalar(0.85); }
  if (camKey === 'far') { cam.position.add(new THREE.Vector3(0, 40, 160)); cam.lookAt(0, 110, 0); }
  // portrait panels → landscape: widen view a touch so the set still frames
  const asp = E.w / E.h; cam.aspect = asp; if (asp > 1) cam.fov = Math.max(34, (cam.fov || 50) * 0.9); cam.updateProjectionMatrix();
  return { scene, cam, p0: cam.position.clone(), q0: cam.quaternion.clone(), dir: new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion) };
}
// play a cutscene; resolves when done. opts.onQte for the JUMP button
export function playCine(key, opts = {}) {
  return new Promise(async resolve => {
    const shots = CINES[key]; const el = $('#cine'); el.style.display = 'block';
    el.innerHTML = `<div class="bars" style="top:0"></div><div class="bars" style="bottom:0"></div><div class="ttl" id="cttl"></div><div class="bub" id="cbub" style="display:none"></div><div class="tapn" id="ctap">TAP ▶</div><button class="skip pe small" id="cskip">SKIP ▶▶</button>`;
    const tapLayer = document.createElement('div'); tapLayer.className = 'pe'; tapLayer.style.cssText = 'position:absolute;inset:0;background:transparent'; el.prepend(tapLayer);
    playTrack(opts.music || 'cine');
    let shot = 0, line = -1, set = null, lineT = 0, minT = 0, done = false, waitingQte = false, t = 0, building = false;
    const bub = $('#cbub'), ttl = $('#cttl');
    const finish = () => { if (done) return; done = true; E.onFrame = null; el.style.display = 'none'; el.innerHTML = ''; window.speechSynthesis && speechSynthesis.cancel(); resolve(); };
    $('#cskip').onclick = e => { e.stopPropagation(); if (waitingQte) return; finish(); };
    const say = (who, text) => { bub.style.display = ''; bub.className = 'bub' + (who === 'NARRATOR' ? ' nar' : ''); bub.innerHTML = (who === 'NARRATOR' ? '' : `<b>${who}</b><br>`) + text; bub.style.animation = 'none'; void bub.offsetWidth; bub.style.animation = 'pop .25s ease-out'; sfx('tap', 0.4);
      if (SAVE.settings.readAloud && window.speechSynthesis) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text.replace(/\*[^*]*\*/g, '')); u.rate = 1.05; u.pitch = who.includes('JULIA') ? 1.3 : who.includes('GENERAL') ? 0.7 : who === 'BOB' || who === 'JAKE' ? 1.6 : 1; speechSynthesis.speak(u); } catch (e) { } } };
    const next = async () => {
      if (done || building || waitingQte) return;
      const sh = shots[shot]; line++;
      if (line >= sh.lines.length) { shot++; line = -1; if (shot >= shots.length) return finish(); return loadShot(); }
      const [who, text, special] = sh.lines[line]; say(who, text); lineT = 0; minT = 0.6; set.lineDur = Math.max(4.5, 2.2 + text.length * 0.055);
      if (special === 'qte') { waitingQte = true; $('#ctap').style.display = 'none'; const b = document.createElement('button'); b.className = 'red pe'; b.id = 'qte'; b.textContent = 'TAP TO JUMP!'; b.style.cssText = 'position:absolute;left:50%;top:42%;transform:translate(-50%,-50%) rotate(-4deg);font-size:min(10vw,8vh);animation:pulse .5s infinite alternate'; el.appendChild(b);
        const go = e => { e.preventDefault(); e.stopPropagation(); b.remove(); sfx('whoosh'); waitingQte = false; finish(); }; b.addEventListener('click', go); b.addEventListener('touchend', go, { passive: false }); }
    };
    const loadShot = async () => { building = true; bub.style.display = 'none'; const sh = shots[shot];
      if (sh.title) { ttl.innerHTML = sh.title + (sh.sub ? `<small>${sh.sub}</small>` : ''); ttl.style.opacity = 1; } else ttl.style.opacity = 0;
      await new Promise(r => setTimeout(r, 30)); set = await buildSet(sh.set, sh.cam); t = 0; building = false; setTimeout(() => { if (!done) next(); }, sh.title ? 1300 : 300); if (sh.title) setTimeout(() => ttl.style.opacity = 0, 2600); };
    tapLayer.addEventListener('click', () => { if (minT <= 0 && !building) next(); });
    E.onFrame = (dt, rdt) => { if (!set) return; t += rdt; lineT += rdt; minT -= rdt; const k = Math.min(1, t / 16); set.cam.position.copy(set.p0).addScaledVector(set.dir, 26 * k * 4).add(new THREE.Vector3(Math.sin(t * 0.25) * 14, Math.sin(t * 0.18) * 6, 0)); set.cam.quaternion.copy(set.q0); if (lineT > (set.lineDur || 5) && !waitingQte && line >= 0) next(); };
    window.__HWcine = { next: () => { if (waitingQte) { const b = $('#qte'); b && b.click(); } else { minT = 0; next(); } }, skip: () => { if (waitingQte) { const b = $('#qte'); b && b.click(); } else finish(); }, state: () => ({ shot, line, waitingQte, building }) };
    await loadShot();
  });
}
