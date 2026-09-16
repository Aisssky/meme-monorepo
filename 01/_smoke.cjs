/**
 * CDP 冒烟测试：验证「卡片贴图 + 误点跳转落地页」新版是否可运行。
 * 用完即删（临时诊断脚本，不进仓库）。
 */
const http = require('http');
const fs = require('fs');

const HOST = '127.0.0.1';
const PORT = 9222;
const TARGET_URL = 'http://127.0.0.1:4173/';
const OUT = 'D:/shengqu/01/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function getJson(path) {
  return new Promise((res, rej) => {
    const req = http.request({ host: HOST, port: PORT, path, method: 'GET' }, (r) => {
      let b = '';
      r.on('data', (c) => (b += c));
      r.on('end', () => {
        try {
          res(JSON.parse(b));
        } catch (e) {
          rej(e);
        }
      });
    });
    req.on('error', rej);
    req.end();
  });
}

(async () => {
  const targets = await getJson('/json');
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  if (!page) throw new Error('no page target');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const consoleMsgs = [];
  const exceptions = [];
  const netIssues = [];

  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      if (m.error) reject(m.error);
      else resolve(m.result);
      return;
    }
    if (m.method === 'Runtime.consoleAPICalled') {
      const txt = (m.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ');
      consoleMsgs.push(`${m.params.type}: ${txt}`);
    } else if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      exceptions.push(`${d.text} | ${(d.exception && d.exception.description) || ''}`);
    } else if (m.method === 'Network.responseReceived') {
      const r = m.params.response;
      if (r.status >= 400) netIssues.push(`${r.status} ${r.url}`);
    } else if (m.method === 'Network.loadingFailed') {
      netIssues.push(`FAILED ${m.params.errorText}`);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.enable');
  await send('Log.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 720,
    height: 1280,
    deviceScaleFactor: 1,
    mobile: true,
  });

  const ev = (expr) =>
    send('Runtime.evaluate', {
      expression: `try { ${expr} } catch(e) { 'ERR:'+e.message }`,
      returnByValue: true,
    }).then((r) => r.result.value);

  const shot = async (name) => {
    const s = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(OUT + name, Buffer.from(s.data, 'base64'));
    console.log('   shot ->', name);
  };

  await send('Page.navigate', { url: TARGET_URL + '?t=' + Date.now() });

  // preload：15 张图 + 6 段音频
  await sleep(14000);
  await ev(`localStorage.removeItem('ads_unlocked_level'); 'cleared'`);
  console.log('[1] scenes =', await ev(`window.__game ? __game.scene.getScenes(false).map(s=>s.scene.key+':'+(s.scene.isActive()?'A':'I')).join(',') : 'NO_GAME'`));
  await shot('_smoke_1_title.png');

  // 标题页 → 选关页（走 ScenePlugin.start，前一个场景会被正常 stop）
  console.log('[2] title->menu =', await ev(`const s=__game.scene.getScene('TitleScene'); s.scene.start('MenuScene'); 'ok'`));
  await sleep(1600);
  console.log('[2] scenes =', await ev(`__game.scene.getScenes(false).map(s=>s.scene.key+':'+(s.scene.isActive()?'A':'I')).join(',')`));
  await shot('_smoke_2_menu.png');

  // 选关页 → 第 3 关（含 scam 双× / redpack 全屏）
  console.log('[3] menu->game =', await ev(`const s=__game.scene.getScene('MenuScene'); s.scene.start('GameScene', { levelId: 3 }); 'ok'`));
  await sleep(6000);
  console.log('[3] card textures =', await ev(`['card_shop','card_gamead','card_scam','card_rogue','card_redpack','card_booster','page_shop','page_booster'].map(k=>k+':'+__game.textures.exists(k)).join(' ')`));
  console.log('[4] popups =', await ev(`const s=__game.scene.getScene('GameScene'); 'n='+s.popups.length+' keys='+s.popups.map(p=>p.type.id+':'+p.type.kind).join(',')+' spawned='+s.adsSpawned`));
  await shot('_smoke_3_game.png');

  // 误点「最上层」广告本体 → 应跳转该广告的落地页
  const landingRes = await ev(
    `const s=__game.scene.getScene('GameScene'); const p=s.popups[s.popups.length-1]; const before=s.battery; s.dispatchTap(p.container.x, p.container.y); JSON.stringify({id:p.type.id,page:p.type.pageKey,landing:s.landingActive,batBefore:+before.toFixed(2),batAfter:+s.battery.toFixed(2),shown:s.landingsShown})`,
  );
  console.log('[5] body tap ->', landingRes);
  await sleep(700);
  await shot('_smoke_4_landing.png');

  // 等自动关闭（landing_hold_ms=2000）
  await sleep(2600);
  console.log('[6] after hold, ', await ev(`const s=__game.scene.getScene('GameScene'); 'landingActive='+s.landingActive`));

  // 真实关闭：点「最上层」广告的真×（走像素掩码命中）
  const trueRes = await ev(
    `const s=__game.scene.getScene('GameScene'); const p=s.popups[s.popups.length-1]; const z=p.hitZones.find(z=>z.kind==='true'); const sc=p.container.scaleX; const cb=s.correctCloses; const lb=s.landingActive; s.dispatchTap(p.container.x + z.cx*sc, p.container.y + z.cy*sc); JSON.stringify({id:p.type.id,kind:p.type.kind,correctBefore:cb,correctAfter:s.correctCloses,landingTriggered:s.landingActive})`,
  );
  console.log('[7] true-x tap ->', trueRes);
  await sleep(400);

  // 真实关闭：点「最上层」广告的假× → 应扣电 + 跳转落地页
  const fakeRes = await ev(
    `const s=__game.scene.getScene('GameScene'); const arr=s.popups.filter(p=>p.type.kind!=='fullscreen'); const p=arr[arr.length-1]; const z=p.hitZones.find(z=>z.kind==='fake'); if(!z) 'NO_FAKE_ZONE'; else { const sc=p.container.scaleX; const bb=s.battery; s.dispatchTap(p.container.x + z.cx*sc, p.container.y + z.cy*sc); JSON.stringify({id:p.type.id,kind:p.type.kind,batBefore:+bb.toFixed(2),batAfter:+s.battery.toFixed(2),landing:s.landingActive}) }`,
  );
  console.log('[8] fake-x tap ->', fakeRes);
  await sleep(900);
  await shot('_smoke_5_fake_landing.png');

  await sleep(2600);
  console.log('[9] final =', await ev(`const s=__game.scene.getScene('GameScene'); 'landing='+s.landingActive+' correct='+s.correctCloses+' fake='+s.fakeClicks+' battery='+s.battery.toFixed(1)+' shown='+s.landingsShown`));
  await shot('_smoke_6_after.png');

  console.log('\n=== console (last 15) ===');
  console.log(consoleMsgs.slice(-15).join('\n') || '(none)');
  console.log('\n=== exceptions ===');
  console.log(exceptions.join('\n') || '(none)');
  console.log('\n=== network issues ===');
  const uniq = [...new Set(netIssues)];
  console.log(uniq.slice(0, 20).join('\n') || '(none)');

  ws.close();
  process.exit(0);
})().catch((e) => {
  console.error('SMOKE ERROR', e);
  process.exit(1);
});
