/**
 * 弹窗广告内容池。
 *
 * 每一条对应「一张整图广告卡片 + 一张误点后跳转的落地页」。
 * 卡片贴图里已经把中文文案烘焙好了（标题/价签/按钮都在画面上），
 * 所以代码不再叠加任何文字，只保留玩法必需的 × 关闭按钮。
 *
 * kind 决定关闭按钮的布局（难度）：
 *  - normal     常规：假× 固定右上 + 真× 随机角（里/外随机）
 *  - doubleX    双×迷惑：两个同色 ×，一真一假，只能靠"贴边"分辨
 *  - fullscreen 全屏：尺寸拉满，真× 仅 1 个且贴底边外侧（极易漏看）
 */

import type { PopupTypeDef } from '../types';

export const POPUP_POOL: PopupTypeDef[] = [
  {
    id: 'shop',
    cardKey: 'card_shop',
    pageKey: 'page_shop',
    trueCloseProb: 0.65,
    kind: 'normal',
    title: '今日特惠 全场9.9包邮',
  },
  {
    id: 'gamead',
    cardKey: 'card_gamead',
    pageKey: 'page_gamead',
    trueCloseProb: 0.55,
    kind: 'normal',
    title: '新服今日开启 登录送648',
  },
  {
    // 双×迷惑：卡面是两条短信气泡，两个同色 × 分居对角，只能靠"贴边"辨真伪
    id: 'scam',
    cardKey: 'card_scam',
    pageKey: 'page_scam',
    trueCloseProb: 0.5,
    kind: 'doubleX',
    title: '系统通知 · 账号异常',
  },
  {
    // 最刁钻的一类：卡面本身就是"满地假按钮"，真× 极易被误点
    id: 'rogue',
    cardKey: 'card_rogue',
    pageKey: 'page_rogue',
    trueCloseProb: 0.45,
    kind: 'normal',
    title: '恭喜您中奖了！',
  },
  {
    // 全屏广告：尺寸拉满，真× 仅 1 个且贴底边外侧
    id: 'redpack',
    cardKey: 'card_redpack',
    pageKey: 'page_redpack',
    trueCloseProb: 0.6,
    kind: 'fullscreen',
    title: '恭喜获得 888 元现金红包',
  },
  {
    id: 'booster',
    cardKey: 'card_booster',
    pageKey: 'page_booster',
    trueCloseProb: 0.7,
    kind: 'normal',
    title: '手机发烫 内存不足',
  },
];

/** 从池中按允许的 id 过滤，再随机抽一条。 */
export function pickRandomPopupType(
  allowedIds: string[],
  rng: () => number = Math.random,
): PopupTypeDef {
  const pool = POPUP_POOL.filter((p) => allowedIds.includes(p.id));
  const src = pool.length ? pool : POPUP_POOL;
  return src[Math.floor(rng() * src.length)];
}
