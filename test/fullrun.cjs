// Full play-through via test hooks: node test/fullrun.cjs <url> <device> <browser> [shotdir] [levels]
const { chromium, webkit, devices } = require('/workspace/kimber-horses/test/node_modules/playwright');
const fs = require('fs');
(async () => {
  const url = process.argv[2], dev = process.argv[3] || 'iPhone 13 landscape', br = process.argv[4] || 'chromium', shots = process.argv[5] || '', only = process.argv[6] ? process.argv[6].split(',').map(Number) : null;
  if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = br === 'webkit' ? await webkit.launch() : await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices[dev] }); const p = await ctx.newPage();
  const Q = process.env.Q || 'low'; await p.addInitScript(q => { if (!localStorage.getItem('hw_test_init')) { localStorage.setItem('hw_test_init', '1'); localStorage.setItem('helvie_on_wheels_v1', JSON.stringify({ settings: { quality: q, music: 0.5, sfx: 0.8 } })); } }, Q);
  const logs = []; p.on('console', m => { if (m.type() === 'error') logs.push('error: ' + m.text().slice(0, 300)); }); p.on('pageerror', e => logs.push('PAGEERR ' + e.message));
  const R = { pass: [], fail: [] }; const ok = (c, m) => { (c ? R.pass : R.fail).push(m); console.log((c ? '  PASS ' : '  FAIL ') + m); };
  const shot = async n => { if (shots) await p.screenshot({ path: shots + '/' + n + '.png' }); };
  const ev = (f, a) => p.evaluate(f, a); const wait = ms => p.waitForTimeout(ms);
  const waitScreen = async (want, t = 90000) => p.waitForFunction(w => { const r = document.getElementById('rv_ok'); if (r) r.click(); return w.split('|').includes(window.__HW.screen); }, want, { timeout: t, polling: 300 }).then(() => true).catch(() => false);
  await p.goto(url, { waitUntil: 'load', timeout: 120000 });
  ok(await waitScreen('title', 150000), 'title screen up');
  const lv = only || [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (const i of lv) {
    console.log('LEVEL', i);
    await ev(i => window.__HW.go(i, { skipCine: true }), i);
    const playing = await waitScreen('play', 120000); ok(playing, `L${i} starts`); if (!playing) { await shot('L' + i + '_fail'); continue; }
    await wait(2500); await shot('L' + i + '_play');
    const info = await ev(() => window.__HW.info()); const mode = await ev(() => window.__HW.mode && Object.keys(window.__HW.hooks()).join(','));
    console.log('   ', JSON.stringify(info.mode), mode);
    if ([1, 3, 4, 6, 7].includes(i)) { // drive: rescue
      await ev(() => window.__HW.steer(0.4)); await wait(800); await ev(() => window.__HW.steer(0));
      await ev(() => window.__HW.hooks().rescue('test')); await wait(1200); await shot('L' + i + '_rescue');
      const r = await ev(() => window.__HW.info().mode); ok(r.rescueActive && r.rescues === 1, `L${i} rescue triggers (JESUS, TAKE THE WHEEL)`);
      await p.waitForFunction(() => !window.__HW.info().mode.rescueActive, null, { timeout: 30000 }).catch(() => { }); ok(!(await ev(() => window.__HW.info().mode.rescueActive)), `L${i} rescue completes, back on course`);
      await ev(() => window.__HW.hooks().crash()); await wait(600); ok((await ev(() => window.__HW.info().mode.rescues)) >= 2, `L${i} driving off the edge triggers rescue (no fail)`);
      await p.waitForFunction(() => !window.__HW.info().mode.rescueActive, null, { timeout: 30000 }).catch(() => { });
      if (i >= 6) { await ev(() => window.__HW.press('rocket')); await wait(1500); await shot('L' + i + '_rockets'); await ev(() => window.__HW.press('cat')); await wait(1200); await shot('L' + i + '_cats'); }
      if (i === 3 || i === 4) { await ev(() => window.__HW.press('mine')); await wait(500); }
      await ev(() => window.__HW.hooks().warp(0.6)); await wait(2500); await shot('L' + i + '_boss'); ok((await ev(() => window.__HW.info().mode.boss)), `L${i} boss spawns`);
      await ev(() => window.__HW.hooks().killBoss()); await wait(2500); await shot('L' + i + '_finisher');
      await ev(() => window.__HW.hooks().finish());
    } else if (i === 2 || i === 5) {
      const tp = await ev(() => window.__HW.hooks().tapPump()); await wait(200);
      const before = await ev(() => window.__HW.hooks().pumpsLeft());
      // real touch tap on a pump
      const pos = await ev(() => { const h = window.__HW.hooks(); const r = h.tapPump(); window.__HW.I.taps.length = 0; return r; });
      if (pos) { await p.touchscreen.tap(pos.x, pos.y); await wait(1500); }
      const after = await ev(() => window.__HW.hooks().pumpsLeft()); ok(after < before, `L${i} real tap detonates a ${i === 2 ? 'gas pump' : 'syrup barrel'} (${before}->${after})`); await shot('L' + i + '_pump');
      if (i === 5) { await ev(() => window.__HW.press('rocket')); await wait(1500); await shot('L5_julia_rockets'); await ev(() => window.__HW.press('cat')); await wait(1500); await shot('L5_kitties'); }
      await ev(() => window.__HW.hooks().hurt(9999)); await wait(800); ok((await ev(() => window.__HW.info().mode.rescues)) >= 1, `L${i} SECOND WIND instead of death`);
      await ev(() => window.__HW.hooks().finish()); await wait(2000); await shot('L' + i + '_boss');
    } else if (i === 0) {
      await ev(() => window.__HW.steer(0.5)); await wait(1500); await ev(() => window.__HW.steer(0)); await ev(() => window.__HW.hooks().finish()); await wait(1500); await shot('L0_chute_button'); await ev(() => window.__HW.press('chute')); await wait(4000); await shot('L0_chute');
    } else if (i === 8) {
      await ev(() => window.__HW.hold('climb', true)); await wait(2000); await shot('L8_climb'); await ev(() => window.__HW.hooks().skipClimb()); await wait(2500); await shot('L8_p1');
      ok((await ev(() => window.__HW.info().mode.phase)) === 'p1', 'L8 phase 1 (flag drones)');
      await ev(() => window.__HW.hooks().killDrones()); await wait(7000); await ev(() => window.__HW.hooks().killDrones()); await wait(2500); ok((await ev(() => window.__HW.info().mode.phase)) === 'p2', 'L8 phase 2 (megaphone rings)'); await shot('L8_p2');
      await ev(() => window.__HW.hooks().bossLow()); await wait(1000); ok((await ev(() => window.__HW.info().mode.phase)) === 'p3', 'L8 phase 3 (final rocket)'); await shot('L8_p3');
      await ev(() => window.__HW.press('final')); await wait(1800); await shot('L8_rocket'); await wait(2500); await shot('L8_explosion'); await wait(3000); await shot('L8_celebrate');
    }
    const won = await waitScreen('victory', 90000); ok(won, `L${i} completes -> victory screen`); await wait(1500); await shot('L' + i + '_victory');
  }
  // ending cine from final victory
  if (lv.includes(8)) { await p.click('#v_next').catch(() => { }); await wait(800); await p.click('#u_done').catch(() => { }); const c = await waitScreen('cine', 20000); ok(c, 'ending cutscene plays'); await wait(6000); await shot('ending'); for (let k = 0; k < 20 && (await ev(() => window.__HW.screen)) === 'cine'; k++) { await ev(() => window.__HWcine && window.__HWcine.next()); await wait(900); } ok((await ev(() => window.__HW.screen)) === 'credits', 'ending -> credits'); }
  ok(logs.length === 0, `0 console errors (${logs.length})`); if (logs.length) console.log(logs.slice(0, 20).join('\n'));
  console.log(`RESULT ${dev} ${br}: ${R.pass.length}/${R.pass.length + R.fail.length}`); if (R.fail.length) console.log('FAILS:', R.fail.join(' | '));
  await b.close();
})();
