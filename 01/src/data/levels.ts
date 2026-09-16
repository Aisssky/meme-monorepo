/**
 * 关卡表。难度「叠加型」递进（类比：小兵 → 小兵+炮车 → 小兵+炮车+超级兵）：
 *  - 每一关要出的广告总数变多
 *  - 关卡越靠后，广告「种类」越多（解锁 doubleX / fullscreen 等更难辨别的广告）
 *  - 同屏弹窗上限 / 生成速度逐关提升
 *  - 弹窗尺寸范围逐关更极端（更大/更小都有）
 *
 * 生命制（玩家口径）：把本关出现的全部广告都关掉即通关；
 * 误点会被扣心，生命扣光 → 失败。roundSeconds 只用于结算速度奖励，不是失败线。
 */
import type { LevelDef } from '../types';

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: '入门骚扰',
    title: '清场成功',
    description: '10 条广告 · 识破普通弹窗的假×陷阱',
    totalAdCount: 10,
    roundSeconds: 30,
    initialLives: 3,
    spawnMinMs: 750,
    spawnMaxMs: 1350,
    // 仅常规广告（normal），先熟悉"假×固定右上"的经典陷阱
    popupPoolIds: ['shop', 'gamead', 'rogue', 'booster'],
    popupMinW: 320,
    popupMaxW: 460,
    popupMinH: 220,
    popupMaxH: 320,
    scoreWinBonus: 50,
  },
  {
    id: 2,
    name: '推送狂潮',
    title: '狂潮平息',
    description: '16 条广告 · 新增「双×迷惑」，真假难辨',
    totalAdCount: 16,
    roundSeconds: 36,
    initialLives: 3,
    spawnMinMs: 560,
    spawnMaxMs: 1000,
    // 新增 scam（双×迷惑）
    popupPoolIds: ['shop', 'gamead', 'rogue', 'booster', 'scam'],
    popupMinW: 300,
    popupMaxW: 520,
    popupMinH: 200,
    popupMaxH: 360,
    scoreWinBonus: 120,
  },
  {
    id: 3,
    name: '信息爆炸',
    title: '世界清静了',
    description: '24 条广告 · 全屏弹窗 + 双×连环轰炸',
    totalAdCount: 24,
    roundSeconds: 42,
    initialLives: 3,
    spawnMinMs: 420,
    spawnMaxMs: 760,
    // 新增 redpack（全屏广告）
    popupPoolIds: ['shop', 'gamead', 'rogue', 'booster', 'scam', 'redpack'],
    popupMinW: 280,
    popupMaxW: 620,
    popupMinH: 200,
    popupMaxH: 460,
    scoreWinBonus: 250,
  },
  {
    id: 4,
    name: '连环轰炸',
    title: '轰炸停止',
    description: '32 条广告 · 双×迷惑变多，见缝就钻',
    totalAdCount: 32,
    roundSeconds: 52,
    initialLives: 3,
    spawnMinMs: 360,
    spawnMaxMs: 640,
    // scam 重复两次 → 双×迷惑占比更高
    popupPoolIds: [
      'shop', 'gamead', 'rogue', 'booster',
      'scam', 'scam',
    ],
    popupMinW: 250,
    popupMaxW: 620,
    popupMinH: 200,
    popupMaxH: 480,
    scoreWinBonus: 320,
  },
  {
    id: 5,
    name: '毒丸套餐',
    title: '毒丸清除',
    description: '36 条广告 · 首现全屏弹窗，真×藏底',
    totalAdCount: 36,
    roundSeconds: 58,
    initialLives: 3,
    spawnMinMs: 330,
    spawnMaxMs: 580,
    popupPoolIds: [
      'shop', 'gamead', 'rogue', 'booster',
      'scam', 'scam', 'scam', 'redpack',
    ],
    popupMinW: 235,
    popupMaxW: 630,
    popupMinH: 195,
    popupMaxH: 500,
    scoreWinBonus: 400,
  },
  {
    id: 6,
    name: '双×迷宫',
    title: '迷宫破解',
    description: '40 条广告 · 双×成群，真假更难分',
    totalAdCount: 40,
    roundSeconds: 62,
    initialLives: 3,
    spawnMinMs: 305,
    spawnMaxMs: 540,
    popupPoolIds: [
      'shop', 'gamead', 'rogue', 'booster',
      'scam', 'scam', 'scam', 'scam', 'redpack', 'redpack',
    ],
    popupMinW: 220,
    popupMaxW: 640,
    popupMinH: 190,
    popupMaxH: 520,
    scoreWinBonus: 500,
  },
  {
    id: 7,
    name: '全屏海啸',
    title: '海啸退去',
    description: '42 条广告 · 全屏广告猛增，遮天蔽日',
    totalAdCount: 42,
    roundSeconds: 66,
    initialLives: 3,
    spawnMinMs: 285,
    spawnMaxMs: 500,
    popupPoolIds: [
      'shop', 'rogue', 'booster',
      'scam', 'scam', 'scam', 'redpack', 'redpack', 'redpack', 'redpack',
    ],
    popupMinW: 205,
    popupMaxW: 650,
    popupMinH: 185,
    popupMaxH: 540,
    scoreWinBonus: 600,
  },
  {
    id: 8,
    name: '末日垃圾',
    title: '末日清扫',
    description: '45 条广告 · 又小又刁，弹窗满天飞',
    totalAdCount: 45,
    roundSeconds: 70,
    initialLives: 3,
    spawnMinMs: 275,
    spawnMaxMs: 470,
    popupPoolIds: [
      'shop', 'rogue', 'booster',
      'scam', 'scam', 'scam', 'scam', 'redpack', 'redpack', 'redpack', 'redpack', 'redpack',
    ],
    popupMinW: 190,
    popupMaxW: 660,
    popupMinH: 180,
    popupMaxH: 560,
    scoreWinBonus: 720,
  },
  {
    id: 9,
    name: '地狱弹幕',
    title: '弹幕终结',
    description: '46 条广告 · 密集轰炸，眼花缭乱',
    totalAdCount: 46,
    roundSeconds: 74,
    initialLives: 3,
    spawnMinMs: 265,
    spawnMaxMs: 445,
    popupPoolIds: [
      'shop', 'booster',
      'scam', 'scam', 'scam', 'scam', 'scam',
      'redpack', 'redpack', 'redpack', 'redpack', 'redpack',
    ],
    popupMinW: 180,
    popupMaxW: 670,
    popupMinH: 175,
    popupMaxH: 580,
    scoreWinBonus: 850,
  },
  {
    id: 10,
    name: '深渊决战',
    title: '清场大师',
    description: '48 条广告 · 终极试炼，手机能否幸存？',
    totalAdCount: 48,
    roundSeconds: 78,
    initialLives: 3,
    spawnMinMs: 250,
    spawnMaxMs: 420,
    popupPoolIds: [
      'shop', 'rogue',
      'scam', 'scam', 'scam', 'scam', 'scam', 'scam',
      'redpack', 'redpack', 'redpack', 'redpack', 'redpack', 'redpack',
    ],
    popupMinW: 170,
    popupMaxW: 680,
    popupMinH: 170,
    popupMaxH: 600,
    scoreWinBonus: 1000,
  },
];

export const MAX_LEVEL = LEVELS[LEVELS.length - 1].id;

export function getLevel(id: number): LevelDef {
  return LEVELS.find((l) => l.id === id) ?? LEVELS[0];
}

/** 已解锁的最高关（localStorage 持久化，默认 1）。 */
export function getUnlockedLevel(): number {
  try {
    const v = Number(localStorage.getItem('ads_unlocked_level'));
    if (!Number.isNaN(v) && v >= 1 && v <= MAX_LEVEL) return v;
  } catch {
    /* ignore */
  }
  return 1;
}

export function unlockLevel(id: number) {
  const cur = getUnlockedLevel();
  if (id > cur) {
    try {
      localStorage.setItem('ads_unlocked_level', String(Math.min(id, MAX_LEVEL)));
    } catch {
      /* ignore */
    }
  }
}
