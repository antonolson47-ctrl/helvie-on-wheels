const { chromium, devices } = require('/workspace/kimber-horses/test/node_modules/playwright');
(async () => { const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ ...devices['iPhone 13 landscape'] })).newPage(); const Q = process.env.Q; if (Q) await p.addInitScript(q => { localStorage.setItem('helvie_on_wheels_v1', JSON.stringify({ settings: { quality: q } })); }, Q); const logs = []; p.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 300))); p.on('pageerror', e => logs.push('PAGEERR ' + e.message));
  await p.goto(process.argv[2]); await p.waitForFunction(() => window.__HW && window.__HW.screen === 'title', null, { timeout: 120000 });
  await p.evaluate(l => { window.__HW.SAVE.seenWeapons = { shotgun: 1, eagle9000: 1, mines: 1, samer: 1, bazooka: 1, cats: 1, rocketpod: 1, fireworks: 1 }; window.__HW.go(l, { skipCine: true }); }, +process.argv[3]);
  await p.waitForFunction(() => window.__HW.screen === 'play', null, { timeout: 60000 }).catch(e => { console.log('NOPLAY', logs.join('\n')); });
  await p.evaluate(new Function(process.argv[4] || ''));
  for (let i = 0; i < (+process.argv[5] || 6); i++) { await p.waitForTimeout(1000); console.log(JSON.stringify(await p.evaluate(new Function('return ' + (process.argv[6] || 'window.__HW.info()'))))); }
  console.log(logs.slice(0, 20).join('\n')); await b.close(); })();
