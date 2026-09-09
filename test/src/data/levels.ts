/**
 * 关卡表。难度「叠加型」递进（类比：小兵 → 小兵+炮车 → 小兵+炮车+超级兵）：
 *  - 每一关要出的广告总数变多
 *  - 关卡越靠后，广告「种类」越多（解锁 doubleX / fullscreen 等更难辨别的广告）
 *  - 同屏弹窗上限 / 生成速度逐关提升
 *  - 弹窗尺寸范围逐关更极端（更大/更小都有），自然掉电也更快
 *
 * 胜利条件（玩家口径）：在倒计时结束前，把本关出现的全部广告都关掉即成功；
 * 时间到仍有未关广告 / 电量归零 → 失败。
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
    initialBattery: 20,
    naturalDrainPerSec: 1.5,
    maxPopups: 4,
    spawnMinMs: 750,
    spawnMaxMs: 1350,
    popupPoolIds: ['gift', 'warning', 'cleanup', 'lucky', 'signin'],
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
    initialBattery: 22,
    naturalDrainPerSec: 1.8,
    maxPopups: 5,
    spawnMinMs: 560,
    spawnMaxMs: 1000,
    popupPoolIds: ['gift', 'warning', 'cleanup', 'lucky', 'signin', 'game', 'doublex'],
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
    initialBattery: 25,
    naturalDrainPerSec: 2.2,
    maxPopups: 6,
    spawnMinMs: 420,
    spawnMaxMs: 760,
    popupPoolIds: [
      'gift',
      'warning',
      'cleanup',
      'lucky',
      'signin',
      'game',
      'doublex',
      'fullscreen',
    ],
    popupMinW: 280,
    popupMaxW: 620,
    popupMinH: 200,
    popupMaxH: 460,
    scoreWinBonus: 250,
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
