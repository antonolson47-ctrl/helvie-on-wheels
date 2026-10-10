// node test/smoke.cjs <url> <device> <browser> <script...>
const { chromium, webkit, devices } = require('/workspace/kimber-horses/test/node_modules/playwright');
(async () => {
  const url = process.argv[2], dev = process.argv[3] || 'iPhone 13 landscape', br = process.argv[4] || 'chromium', steps = process.argv[5] || 'title';
  const b = br === 'webkit' ? await webkit.launch() : await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices[dev] }); const p = await ctx.newPage();
  const logs = []; p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text().slice(0, 300)); }); p.on('pageerror', e => logs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').slice(0, 300)));
  await p.goto(url, { waitUntil: 'load', timeout: 120000 });
  await p.waitForFunction(() => window.__HW && window.__HW.screen === 'title', null, { timeout: 120000 }).catch(() => logs.push('NO TITLE'));
  await p.waitForTimeout(1500); await p.screenshot({ path: '/tmp/hw/title.png' });
  for (const st of steps.split(',')) {
    if (st === 'title') continue;
    const [cmd, arg, wait] = st.split(':');
    if (cmd === 'go') { await p.evaluate(a => window.__HW.go(+a, { skipCine: true }), arg); await p.waitForFunction(() => { const r = document.getElementById('rv_ok'); if (r) r.click(); return window.__HW.screen === 'play'; }, null, { timeout: 90000, polling: 500 }).catch(() => logs.push('NOT PLAYING')); }
    if (cmd === 'cine') { await p.evaluate(a => window.__HW.go(+a), arg); await p.waitForTimeout(+wait || 4000); }
    if (cmd === 'wait') await p.waitForTimeout(+arg);
    if (cmd === 'steer') await p.evaluate(a => window.__HW.steer(+a), arg);
    if (cmd === 'hook') await p.evaluate(a => { const h = window.__HW.hooks(); h && h[a] && h[a](); }, arg);
    if (cmd === 'press') await p.evaluate(a => window.__HW.press(a), arg);
    if (cmd === 'hold') await p.evaluate(a => window.__HW.hold(a, true), arg);
    if (cmd === 'shot') await p.screenshot({ path: '/tmp/hw/' + arg + '.png' });
    if (cmd === 'info') console.log(JSON.stringify(await p.evaluate(() => window.__HW.info())));
    if (cmd === 'cnext') await p.evaluate(() => window.__HWcine && window.__HWcine.next());
  }
  console.log('final', JSON.stringify(await p.evaluate(() => window.__HW.info())));
  console.log('LOGS', logs.length, logs.slice(0, 15).join('\n'));
  await b.close();
})();
