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
    kind: 'normal',
  },
  {
    id: 'warning',
    iconKey: 'ic_warning',
    title: '系统安全警告',
    bodyLines: ['检测到 12 个风险项', '建议立即处理', '点此一键解决'],
    trueCloseProb: 0.5,
    kind: 'normal',
  },
  {
    id: 'cleanup',
    iconKey: 'ic_rocket',
    title: '内存已满',
    bodyLines: ['微信占用 8.7GB', '一键加速释放空间'],
    trueCloseProb: 0.7,
    kind: 'normal',
  },
  {
    id: 'game',
    iconKey: 'ic_castle',
    title: '新世界开启',
    bodyLines: ['登录即送 9999 钻', '今日开服 限免下载'],
    trueCloseProb: 0.55,
    kind: 'normal',
  },
  {
    id: 'lucky',
    iconKey: 'ic_diamond',
    title: '幸运大转盘',
    bodyLines: ['再抽一次', '100% 中奖'],
    trueCloseProb: 0.45,
    kind: 'normal',
  },
  {
    id: 'signin',
    iconKey: 'ic_calendar',
    title: '每日签到',
    bodyLines: ['今日签到得 5 元', '连续 7 天再得 88 元'],
    trueCloseProb: 0.6,
    kind: 'normal',
  },
  {
    // 双×迷惑广告：弹窗上有两个青色×，1 真 1 假，角位随机。
    // 假×不再固定在右上，颜色相同（都青），玩家只能靠“贴边/居中”特征分辨。
    id: 'doublex',
    iconKey: 'ic_warning',
    title: '紧急通知',
    bodyLines: ['您的账号存在异常', '请立即验证身份', '否则将在 5 分钟后锁定'],
    trueCloseProb: 0.5,
    kind: 'doubleX',
  },
  {
    // 全屏广告：占更大尺寸，真×只有 1 个且贴底中央外侧，极易漏看。
    id: 'fullscreen',
    iconKey: 'ic_diamond',
    title: '全屏弹窗',
    bodyLines: ['恭喜您获得', '88888 元大额红包！', '点击领取 今日有效'],
    trueCloseProb: 0.6,
    kind: 'fullscreen',
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
