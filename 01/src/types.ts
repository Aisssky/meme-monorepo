/**
 * 公共类型定义
 */

export interface GameConfig {
  initial_battery: number;
  round_seconds: number;
  natural_drain_per_sec: number;
  correct_close_gain: number;
  fake_close_penalty: number;
  item_charge_gain: number;
  item_time_bonus: number;
  max_popups_on_screen: number;
  popup_spawn_min_ms: number;
  popup_spawn_max_ms: number;
  // 弹窗宽高范围（在生成时随机取整，模拟真实广告尺寸不一）
  popup_min_w: number;
  popup_max_w: number;
  popup_min_h: number;
  popup_max_h: number;
  // 真×按钮的边长与贴边偏移（中心到弹窗边的距离）
  true_btn_size: number;
  true_btn_offset: number;
  item_first_appear_ms: number;
  item_interval_min_ms: number;
  item_interval_max_ms: number;
  item_lifetime_ms: number;
  neon_cyan: string;
  neon_magenta: string;
  neon_purple: string;
  bg_dark: string;
  card_bg: string;
  score_correct: number;
  score_fake_penalty: number;
  score_item: number;
  score_miss_item: number;
  score_win_bonus: number;
  image_background: string;
  icon_gift: string;
  icon_warning: string;
  icon_rocket: string;
  icon_castle: string;
  icon_diamond: string;
  icon_calendar: string;
  item_battery: string;
  item_lightning: string;
  // 音频（CDN 托管，运行时按 key 注入 loader）
  bgm_main: string;
  sfx_ad_close: string;
  sfx_success: string;
  sfx_fail: string;
  sfx_fake_close: string;
  sfx_click: string;
  audio_music_enabled: boolean;
  audio_sfx_enabled: boolean;
}

export interface PopupTypeDef {
  id: string;
  iconKey: TextureKey;
  title: string;
  bodyLines: string[];
  trueCloseProb: number; // 0-1
  /**
   * 广告布局种类：
   * - 'normal'    常规：真× ×1（角位+里外随机）+ 假× ×1（标题栏右上做陷阱）
   * - 'doubleX'   双×迷惑：两个青色 ×，其中 1 真 1 假，均角位随机。假×不再固定在右上，
   *               颜色相同（都青），玩家只能靠"贴边"特征分辨
   * - 'fullscreen'全屏广告：尺寸按关卡全屏档放大，真×只有 1 个，贴底中央外侧（易漏看）
   */
  kind: 'normal' | 'doubleX' | 'fullscreen';
}

/**
 * 关卡定义。由 MenuScene 选择，scene.start('GameScene',{ levelId }) 传入。
 * 难度叠加型递进：每关 totalAdCount 更多、广告种类更多、同屏更多更快、弹窗尺寸范围更宽。
 */
export interface LevelDef {
  id: number;
  name: string;               // 短标题，如「入门骚扰」
  title: string;              // 结算标题文案
  description: string;        // 菜单卡片副标题
  totalAdCount: number;       // 本关要出的广告总数（出完即停）
  roundSeconds: number;       // 倒计时
  initialBattery: number;     // 初始电量
  naturalDrainPerSec: number; // 自然掉电速率
  spawnMinMs: number;         // 最小生成间隔
  spawnMaxMs: number;         // 最大生成间隔
  popupPoolIds: string[];     // 本关可抽到的广告 id（来自 POPUP_POOL）
  popupMinW: number;          // 弹窗宽范围
  popupMaxW: number;
  popupMinH: number;
  popupMaxH: number;
  scoreWinBonus: number;      // 通关奖励
}

export type TextureKey =
  | 'bg'
  | 'ic_gift'
  | 'ic_warning'
  | 'ic_rocket'
  | 'ic_castle'
  | 'ic_diamond'
  | 'ic_calendar'
  | 'it_battery'
  | 'it_lightning';

// 已废弃：保留只为兼容老代码（实际请用 TextureKey）
export type PhaserTextures = TextureKey;

export interface ScoreSnapshot {
  score: number;
  correctCloses: number;
  fakeClicks: number;
  itemsCollected: number;
  itemsMissed: number;
  finalBattery: number;
  survived: boolean;
  elapsedMs: number;
}
