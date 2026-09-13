// 差异化店铺版冒烟测试（无头 Chrome CDP）
const WS_URL = process.argv[2];
if (!WS_URL) { console.log('need WS url'); process.exit(1); }
const WebSocket = require('ws');

let id = 0;
const pending = new Map();
let consoleErrs = [], exceptions = [];
let ctxId = null;
let send;

function ev(expr) {
  return new Promise((res) => {
    const mid = ++id;
    pending.set(mid, res);
    const params = { expression: expr, returnByValue: true, awaitPromise: true };
    if (ctxId) params.contextId = ctxId;
    send({ id: mid, method: 'Runtime.evaluate', params });
  });
}
const wait = (ms) => new Promise(r => setTimeout(r, ms));

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (extra !== undefined ? '  -> ' + extra : '')); }
}

(async () => {
  await new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    ws.on('open', () => {
      send = (o) => ws.send(JSON.stringify(o));
      ws.on('message', (raw) => {
        const m = JSON.parse(raw);
        if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result && m.result.result ? m.result.result.value : undefined); pending.delete(m.id); }
        if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrs.push(JSON.stringify(m.params.args));
        if (m.method === 'Runtime.exceptionThrown') exceptions.push(JSON.stringify(m.params.exceptionDetails));
        if (m.method === 'Runtime.executionContextCreated') {
          const c = m.params.context;
          if (c.auxData && c.auxData.isDefault && c.auxData.frameId) ctxId = c.id;
        }
      });
      resolve();
    });
  });

  await new Promise(r => { const mid = ++id; pending.set(mid, r); send({ id: mid, method: 'Runtime.enable' }); });
  send({ id: ++id, method: 'Page.enable' });

  const fileUrl = 'file:///D:/shengqu/03/index.html';
  await new Promise(r => { const mid = ++id; pending.set(mid, r); send({ id: mid, method: 'Page.navigate', params: { url: fileUrl } }); });
  await wait(4000);

  console.log('=== 1. 静态配置 ===');
  const cfg = await ev(`(function(){
    return {
      shops: SHOP_SPECIALTIES.length,
      foods: Object.keys(DISH),
      names: SHOP_SPECIALTIES.map(s=>s.name),
      foodIds: SHOP_SPECIALTIES.map(s=>s.food),
      prices: SHOP_SPECIALTIES.map(s=>s.price),
    };
  })()`);
  check('10 家店铺配置', cfg.shops === 10, cfg.shops);
  check('10 种食物素材', cfg.foods.length === 10, cfg.foods.join(','));
  check('店铺与食物一一对应', new Set(cfg.foodIds).size === 10, cfg.foodIds.join(','));
  console.log('       店名: ' + cfg.names.join(' / '));
  console.log('       售价: ' + cfg.prices.join(' / '));

  console.log('=== 2. 图片资源可加载 ===');
  const imgTest = await ev(`(function(){
    return new Promise(res=>{
      const urls = SHOP_SPECIALTIES.map(s=>s.bg).concat(['assets/scene_mall.png','assets/scene_title.png'])
        .concat(FACADE.filter(f=>f.img).map(f=>f.img))
        .concat(SHOP_SPECIALTIES.map(s=>DISH[s.food].img));
      let done=0, bad=[];
      urls.forEach(u=>{
        const im=new Image();
        im.onload=()=>{ if(++done===urls.length) res({total:urls.length,bad}); };
        im.onerror=()=>{ bad.push(u); if(++done===urls.length) res({total:urls.length,bad}); };
        im.src=u;
      });
    });
  })()`);
  check('全部图片可加载(无404)', imgTest && imgTest.bad.length === 0, imgTest && imgTest.bad.join(','));

  console.log('=== 3. 进入游戏 → 商场 ===');
  await ev(`localStorage.removeItem('my_fastfood_demo_v4')`);
  await ev(`location.reload()`);
  await wait(3500);
  await ev(`document.querySelector('.scene[data-s="title"]').click()`);
  await wait(600);
  const mall = await ev(`(function(){
    return { scene: document.querySelector('.scene:not(.hidden)').dataset.s,
             slots: document.querySelectorAll('#shop-grid .shop-slot').length,
             on: document.querySelectorAll('#shop-grid .shop-slot.on').length,
             off: document.querySelectorAll('#shop-grid .shop-slot.off').length };
  })()`);
  check('进入商场', mall.scene === 'mall', mall.scene);
  check('商场 10 个槽位', mall.slots === 10, mall.slots);
  check('干净开局 1 解锁 / 9 锁定', mall.on === 1 && mall.off === 9, JSON.stringify(mall));

  console.log('=== 4. 进店：汉堡店（1F-左）===');
  await ev(`(function(){ state.currentShop=0; showScene('shop'); return 1; })()`);
  await wait(600);
  const s0 = await ev(`(function(){
    return {
      shopName: document.getElementById('shop-name').textContent,
      bg: document.querySelector('.scene[data-s="shop"] .bg-shop').style.backgroundImage,
      trays: document.querySelectorAll('#trays .tray').length,
      slots: document.querySelectorAll('#trays .tray-slot').length,
      label: document.querySelector('#trays .tray-label').textContent,
      devHint: document.getElementById('dev-hint').textContent,
      stockLen: state.shops[0].stock.length,
      custWants: state.shops[0].customers.map(c=>c.wants),
    };
  })()`);
  check('店内显示店铺名', /美味汉堡/.test(s0.shopName), s0.shopName);
  check('背景=快餐后厨', /scene_shop_bare/.test(s0.bg), s0.bg);
  check('单托盘 4 格', s0.trays === 1 && s0.slots === 4, JSON.stringify({t:s0.trays,s:s0.slots}));
  check('托盘标签=汉堡', /汉堡/.test(s0.label), s0.label);
  check('顾客只点汉堡', s0.custWants.length > 0 && s0.custWants.every(w=>w === 'burger'), s0.custWants.join(','));
  console.log('       库存预热: ' + s0.stockLen + ' 份');

  console.log('=== 5. 进店：寿司店（解锁第 5 槽）===');
  await ev(`(function(){ state.shops[4].unlocked = true; bootShop(4); state.currentShop = 4; showScene('shop'); return 1; })()`);
  await wait(900);
  const s4 = await ev(`(function(){
    return {
      shopName: document.getElementById('shop-name').textContent,
      bg: document.querySelector('.scene[data-s="shop"] .bg-shop').style.backgroundImage,
      label: document.querySelector('#trays .tray-label').textContent,
      trayImg: document.querySelector('#trays .tray-slot.filled img') ? document.querySelector('#trays .tray-slot.filled img').src : '',
      devHint: document.getElementById('dev-hint').textContent,
      custWants: state.shops[4].customers.map(c=>c.wants),
      trayTop: document.getElementById('trays').style.top,
      custTop: document.getElementById('customers').style.top,
    };
  })()`);
  check('店铺名=元气寿司', /元气寿司/.test(s4.shopName), s4.shopName);
  check('背景=寿司后厨', /shop_bg_sushi/.test(s4.bg), s4.bg);
  check('托盘标签=寿司', /寿司/.test(s4.label), s4.label);
  check('托盘里是寿司素材', /food_sushi/.test(s4.trayImg), s4.trayImg);
  check('顾客只点寿司', s4.custWants.length > 0 && s4.custWants.every(w=>w === 'sushi'), s4.custWants.join(','));
  const expTray = await ev('SHOP_SPECIALTIES[4].trayTop');
  const expCust = await ev('SHOP_SPECIALTIES[4].custTop');
  check('出餐台/顾客区坐标按店铺设置', s4.trayTop === expTray + '%' && s4.custTop === expCust + '%', s4.trayTop + ' / ' + s4.custTop + ' (期望 ' + expTray + '% / ' + expCust + '%)');
  console.log('       设备锚点: ' + s4.devHint);

  console.log('=== 6. 交付赚钱 ===');
  const before = await ev('state.money');
  const ok6 = await ev(`(function(){
    const sh = state.shops[4];
    const cu = sh.customers[0];
    if(!cu) return {ok:false, why:'no customer'};
    if(sh.stock.length===0) sh.stock.push({id:'x', type:'sushi'});
    state.currentShop = 4; showScene('shop');
    serveInShop(cu.wants, sh.stock.length-1, cu.id, false);
    return {ok:true, money:state.money, got: state.money - ${before}};
  })()`);
  check('交付寿司赚钱(+22)', ok6.ok && ok6.got === 22, JSON.stringify(ok6));

  console.log('=== 7. 雇员工 + 后台值守 ===');
  await ev(`(function(){ state.money=500; state.currentShop=0; showScene('shop'); return 1; })()`);
  await wait(400);
  await ev(`(function(){ updateHireBtn(); document.getElementById('hire').click(); return 1; })()`);
  await wait(300);
  const emp = await ev(`(function(){ return {emp: state.shops[0].employees, hasTimer: !!state.shops[0].timers.emp}; })()`);
  check('雇员工成功 + 启动定时器', emp.emp === 1 && emp.hasTimer === true, JSON.stringify(emp));

  await ev(`(function(){ showScene('mall'); return 1; })()`);
  await wait(300);
  const m1 = await ev('state.money');
  await wait(6500);
  const m2 = await ev('state.money');
  check('返回商场后员工仍在后台赚钱', m2 > m1, m1 + ' -> ' + m2 + ' (+' + (m2 - m1) + ')');
  console.log('       6.5s 后台收入: +' + (m2 - m1));

  console.log('=== 8. 解锁新店铺 ===');
  const unlock = await ev(`(function(){
    state.money = 9999; renderMall();
    const before = state.money;
    const off = document.querySelectorAll('#shop-grid .shop-slot.off');
    if(!off.length) return {ok:false, why:'no locked slot'};
    off[0].click();
    return {ok:true, got: before - state.money, on: document.querySelectorAll('#shop-grid .shop-slot.on').length};
  })()`);
  check('解锁店铺扣金币 + 槽位+1', unlock.ok && unlock.got === 30 && unlock.on >= 2, JSON.stringify(unlock));

  console.log('=== 9. 控制台 ===');
  check('无 console.error', consoleErrs.length === 0, consoleErrs.join(' | '));
  check('无未捕获异常', exceptions.length === 0, exceptions.join(' | '));

  console.log('\n========================');
  console.log('  结果: ' + pass + ' passed, ' + fail + ' failed');
  console.log('========================');
  process.exit(fail > 0 ? 1 : 0);
})();
