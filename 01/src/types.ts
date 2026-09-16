/**
 * 公共类型定义
 */

export interface GameConfig {
  /** 初始生命（颗心）。生命为整数资源，归零即失败 —— 这是本作唯一的失败条件。 */
  initial_lives: number;
  /** 生命上限（同时也是 UI 上最多显示几颗心） */
  max_lives: number;
  /**
   * 本关参考时长（秒）。**不再作为失败条件**，仅用于结算评分：
   * 用时越短，速度奖励越高。
   */
  round_seconds: number;
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
  /** 拾取爱心道具回复的生命数（不超过 max_lives） */
  item_life_gain: number;
  /** 生命已满时拾取爱心道具，折算成的分数 */
  item_score_when_full: number;
  neon_cyan: string;
  neon_magenta: string;
  neon_purple: string;
  bg_dark: string;
  card_bg: string;
  score_correct: number;
  score_fake_penalty: number;
  /** 误点假×扣几颗心（与 landing_body_life_penalty 对应） */
  fake_close_life_penalty: number;
  score_item: number;
  score_miss_item: number;
  score_win_bonus: number;
  /** 每比参考时长快 1 秒获得的分数（速度奖励） */
  score_time_bonus_per_sec: number;
  // 误点 → 跳转广告落地页（新增玩法）
  landing_enabled: boolean;             // 总开关
  landing_hold_ms: number;              // 落地页自动关闭时长
  landing_min_hold_ms: number;          // 最短停留（之后可点击提前返回）
  landing_body_enabled: boolean;       // 点广告本体（非按钮区）是否也跳转
  landing_body_life_penalty: number;   // 点本体时扣几颗心
  image_background: string;
  // 弹窗卡片（整张带文案的广告图，2304x1728）
  card_shop: string;
  card_gamead: string;
  card_scam: string;
  card_rogue: string;
  card_redpack: string;
  card_booster: string;
  // 广告落地页（误点后全屏展示，1440x2560）
  page_shop: string;
  page_gamead: string;
  page_scam: string;
  page_rogue: string;
  page_redpack: string;
  page_booster: string;
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
  /** 弹窗卡片贴图 key（整张带中文文案的广告图，代码不再叠加文字） */
  cardKey: TextureKey;
  /** 误点后跳转的落地页贴图 key */
  pageKey: TextureKey;
  trueCloseProb: number; // 0-1
  /**
   * 广告布局种类：
   * - 'normal'    常规：真× ×1（角位+里外随机）+ 假× ×1（标题栏右上做陷阱）
   * - 'doubleX'   双×迷惑：两个青色 ×，其中 1 真 1 假，均角位随机。假×不再固定在右上，
   *               颜色相同（都青），玩家只能靠"贴边"特征分辨
   * - 'fullscreen'全屏广告：尺寸按关卡全屏档放大，真×只有 1 个，贴底中央外侧（易漏看）
   */
  kind: 'normal' | 'doubleX' | 'fullscreen';
  /** @deprecated 文案已烘焙进卡片贴图，不再渲染；仅留作调试/无障碍说明 */
  title?: string;
  /** @deprecated 同上 */
  bodyLines?: string[];
}

/**
 * 关卡定义。由 MenuScene 选择，scene.start('GameScene',{ levelId }) 传入。
 * 难度叠加型递进：每关 totalAdCount 更多、广告种类更多、同屏更多更快、弹窗尺寸范围更宽。
 *
 * 胜负（生命制）：把本关全部广告正确关掉即通关；生命（心）被扣光即失败。
 * roundSeconds 只用于结算评分，不再是失败线。
 */
export interface LevelDef {
  id: number;
  name: string;               // 短标题，如「入门骚扰」
  title: string;              // 结算标题文案
  description: string;        // 菜单卡片副标题
  totalAdCount: number;       // 本关要出的广告总数（出完即停）
  roundSeconds: number;       // 参考时长（秒），用于结算速度奖励
  initialLives: number;       // 初始生命（颗心）
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
  | 'card_shop'
  | 'card_gamead'
  | 'card_scam'
  | 'card_rogue'
  | 'card_redpack'
  | 'card_booster'
  | 'page_shop'
  | 'page_gamead'
  | 'page_scam'
  | 'page_rogue'
  | 'page_redpack'
  | 'page_booster'
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
  /** 结算时剩余的生命数（颗心） */
  finalLives: number;
  survived: boolean;
  elapsedMs: number;
  /** 本局被广告带走（误点跳转落地页）的次数 */
  landingsShown?: number;
}
