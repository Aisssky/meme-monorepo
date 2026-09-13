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

    // 进汉堡店（index 0）
    await ev('(function(){ state.money=2000; state.currentShop=0; showScene("shop"); })()');
    await wait(1200);

    // 1) 层级检查
    const layers = await ev(`(function(){
      const out = {};
      const q = s => document.querySelector(s);
      const zi = el => el ? getComputedStyle(el).zIndex : 'none';
      out.bgLayer   = zi(q('.layer-bg'));
      out.custLayer = zi(q('.layer-cust'));
      out.prepLayer = zi(q('.layer-prep'));
      out.uiLayer   = zi(q('.layer-ui'));
      // 层内实际堆叠顺序（DOM 顺序）
      out.domOrder = Array.from(q('.scene[data-s=shop]').children).map(e=>e.className.split(' ')[1]||e.className);
      // 台面顶边位置
      const ps = q('#prep-surface'); const pr = ps.getBoundingClientRect();
      const tr = q('#trays').getBoundingClientRect();
      const cb = q('#customers').getBoundingClientRect();
      out.prepTopPct = Math.round(pr.top / window.innerHeight * 100);
      out.trayTopPct = Math.round(tr.top / window.innerHeight * 100);
      out.custBottomPct = Math.round(cb.bottom / window.innerHeight * 100);
      out.prepCoversTray = pr.top <= tr.top;
      return out;
    })()`);
    console.log('== 层级 z-index ==');
    console.log(JSON.stringify(val(layers), null, 2));

    // 2) 等顾客出现后做真实拖放测试
    await wait(3500);
    const custN = await ev('document.querySelectorAll(".customer").length');
    console.log('顾客数量:', val(custN));

    const hit = await ev(`(function(){
      const c = document.querySelector('.customer');
      if(!c) return {err:'no customer'};
      const r = c.getBoundingClientRect();
      const x = Math.round(r.left + r.width/2), y = Math.round(r.top + r.height*0.6);
      const el = document.elementFromPoint(x,y);
      const owner = el ? (el.closest('.customer') ? 'customer' : (el.className||el.tagName)) : 'null';
      return {x,y, hitElement: owner, ok: !!(el && el.closest('.customer'))};
    })()`);
    console.log('顾客命中检测:', JSON.stringify(val(hit)));

    // 3) 真实拖拽：托盘 -> 顾客
    const moneyBefore = val(await ev('state.money'));
    const drag = await ev(`(function(){
      const slot = document.querySelector('.tray-slot.filled');
      const c = document.querySelector('.customer');
      if(!slot || !c) return {err:'missing', slot:!!slot, cust:!!c};
      const s = slot.getBoundingClientRect(), r = c.getBoundingClientRect();
      return {sx:Math.round(s.left+s.width/2), sy:Math.round(s.top+s.height/2),
              cx:Math.round(r.left+r.width/2), cy:Math.round(r.top+r.height*0.6),
              wants: c.dataset.id};
    })()`);
    const d = val(drag);
    console.log('拖拽坐标:', JSON.stringify(d));
    if (d && !d.err) {
      await cmd('Input.dispatchMouseEvent', { type: 'mousePressed', x: d.sx, y: d.sy, button: 'left', clickCount: 1 });
      await wait(80);
      await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: (d.sx + d.cx) / 2, y: (d.sy + d.cy) / 2, button: 'left' });
      await wait(80);
      await cmd('Input.dispatchMouseEvent', { type: 'mouseMoved', x: d.cx, y: d.cy, button: 'left' });
      await wait(120);
      await cmd('Input.dispatchMouseEvent', { type: 'mouseReleased', x: d.cx, y: d.cy, button: 'left', clickCount: 1 });
      await wait(500);
      const moneyAfter = val(await ev('state.money'));
      console.log('拖拽交付: money ' + moneyBefore + ' -> ' + moneyAfter + (moneyAfter > moneyBefore ? '  ✅ 成功' : '  ❌ 失败'));
    }

    // 4) 截图
    const mid = ++id; const ss = new Promise(r => pending.set(mid, r));
    send({ id: mid, method: 'Page.captureScreenshot', params: { format: 'png' } });
    const data = await ss;
    if (data && data.data) { fs.writeFileSync('D:/shengqu/03/_cap_layers.png', Buffer.from(data.data, 'base64')); console.log('截图已存: _cap_layers.png'); }
    process.exit(0);
  })().catch(e => { console.log('ERR', e); process.exit(1); });
});
setTimeout(() => process.exit(1), 40000);
