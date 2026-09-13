const WebSocket = require('ws');
const fs = require('fs');
const WS_URL = process.argv[2] || 'ws://127.0.0.1:9333/devtools/page/71D7224BC053F146FAF776FA56EC13EE';
const ws = new WebSocket(WS_URL);
let id = 0, send;
const pending = new Map();

ws.on('open', () => {
  send = o => ws.send(JSON.stringify(o));
  ws.on('message', raw => {
    const m = JSON.parse(raw);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const ev = expr => new Promise(r => { const mid = ++id; pending.set(mid, r); send({ id: mid, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true, awaitPromise: true } }); });
  const cmd = (method, params) => new Promise(r => { const mid = ++id; pending.set(mid, r); send({ id: mid, method, params }); });
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const val = r => (r && r.result ? r.result.value : undefined);

  (async () => {
    await cmd('Emulation.setDeviceMetricsOverride', { width: 412, height: 915, deviceScaleFactor: 2, mobile: true });
    await ev('localStorage.removeItem("my_fastfood_demo_v4")');
    await ev('location.reload()'); await wait(3500);
    await ev('document.querySelector(\'.scene[data-s=title]\').click()'); await wait(600);

    for (const idx of [2, 4, 5]) {   // 披萨 / 寿司 / 火锅（出餐台位置差异最大）
      await ev(`(function(){ state.money=9000; state.shops[${idx}].unlocked=true; bootShop(${idx}); state.currentShop=${idx}; showScene("shop"); })()`);
      await wait(1400);
      const info = await ev(`(function(){
        const vh = window.innerHeight;
        const R = s => { const e=document.querySelector(s); return e? e.getBoundingClientRect():null; };
        const pr=R('#prep-surface'), tr=R('#trays'), cb=R('#customers');
        const custs=[...document.querySelectorAll('.customer')];
        const lowestCust = custs.length? Math.max(...custs.map(c=>c.getBoundingClientRect().bottom)) : 0;
        return {
          name: document.getElementById('shop-name').textContent,
          prepTopPct: +(pr.top/vh*100).toFixed(1),
          trayTopPct: +(tr.top/vh*100).toFixed(1),
          custBottomPct: +(cb.bottom/vh*100).toFixed(1),
          lowestCustomerPct: +(lowestCust/vh*100).toFixed(1),
          occludesCustomer: pr.top < lowestCust,
          gapPx: Math.round(tr.top - pr.top)
        };
      })()`);
      console.log(JSON.stringify(val(info), null, 0));
      const mid = ++id; const ss = new Promise(r => pending.set(mid, r));
      send({ id: mid, method: 'Page.captureScreenshot', params: { format: 'png' } });
      const data = await ss;
      if (data && data.data) fs.writeFileSync(`D:/shengqu/03/_cap_layer_${idx}.png`, Buffer.from(data.data, 'base64'));
    }
    console.log('截图完成');
    process.exit(0);
  })().catch(e => { console.log('ERR', e); process.exit(1); });
});
setTimeout(() => process.exit(1), 60000);
