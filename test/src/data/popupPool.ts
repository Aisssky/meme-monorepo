/**
 * 弹窗广告内容池。
 * 每种类型对应一张生成图标 + 一段中文文案 + 一个真×率。
 * 戏仿「老人查东西→手机一直弹窗」的网络梗。
 */

import type { PopupTypeDef } from '../types';

export const POPUP_POOL: PopupTypeDef[] = [
  {
    id: 'gift',
    iconKey: 'ic_gift',
    title: '限时福利',
    bodyLines: ['恭喜！', '您获得神秘大礼包', '点击领取'],
    trueCloseProb: 0.65,
  },
  {
    id: 'warning',
    iconKey: 'ic_warning',
    title: '系统安全警告',
    bodyLines: ['检测到 12 个风险项', '建议立即处理', '点此一键解决'],
    trueCloseProb: 0.5,
  },
  {
    id: 'cleanup',
    iconKey: 'ic_rocket',
    title: '内存已满',
    bodyLines: ['微信占用 8.7GB', '一键加速释放空间'],
    trueCloseProb: 0.7,
  },
  {
    id: 'game',
    iconKey: 'ic_castle',
    title: '新世界开启',
    bodyLines: ['登录即送 9999 钻', '今日开服 限免下载'],
    trueCloseProb: 0.55,
  },
  {
    id: 'lucky',
    iconKey: 'ic_diamond',
    title: '幸运大转盘',
    bodyLines: ['再抽一次', '100% 中奖'],
    trueCloseProb: 0.45,
  },
  {
    id: 'signin',
    iconKey: 'ic_calendar',
    title: '每日签到',
    bodyLines: ['今日签到得 5 元', '连续 7 天再得 88 元'],
    trueCloseProb: 0.6,
  },
];

/** 从池中随机抽一条。 */
export function pickRandomPopupType(rng: () => number = Math.random): PopupTypeDef {
  return POPUP_POOL[Math.floor(rng() * POPUP_POOL.length)];
}
