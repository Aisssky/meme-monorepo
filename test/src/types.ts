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
}

export interface PopupTypeDef {
  id: string;
  iconKey: TextureKey;
  title: string;
  bodyLines: string[];
  trueCloseProb: number; // 0-1
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
