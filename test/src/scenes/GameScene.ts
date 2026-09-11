import Phaser from 'phaser';
import type { GameConfig, LevelDef, PopupTypeDef, ScoreSnapshot } from '../types';
import { pickRandomPopupType } from '../data/popupPool';
import { getLevel, unlockLevel } from '../data/levels';

/**
 * 根据角位 + 里/外贴边，计算真关闭按钮中心相对弹窗的坐标。
 *  - corner: tl/tr/br/bl 之一
 *  - inner: true=按钮中心在弹窗边内 false=在弹窗边外
 *  - offset: 按钮中心距弹窗边的距离（沿弹窗边方向 + 垂直弹窗边方向都使用此值，
 *            让按钮完整地贴在角的里侧或外侧）
 */
function computeTrueButtonPos(
  w: number,
  h: number,
  corner: 'tl' | 'tr' | 'br' | 'bl',
  inner: boolean,
  offset: number,
): { trueCx: number; trueCy: number } {
  // 角位坐标（基于弹窗中心 0,0）
  const cornerX = corner === 'tl' || corner === 'bl' ? -w / 2 : w / 2;
  const cornerY = corner === 'tl' || corner === 'tr' ? -h / 2 : h / 2;
  // 里侧：按钮中心向弹窗中心方向缩进 offset；外侧：向弹窗外延伸 offset
  const sign = inner ? 1 : -1;
  return {
    trueCx: cornerX + sign * offset,
    trueCy: cornerY + sign * offset,
  };
}

/** 圆角矩形绘制（用 Graphics 模拟圆角） */
function drawRoundedRect(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: number,
  alpha = 1,
) {
  g.fillStyle(fill, alpha);
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.arc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  g.lineTo(x + w, y + h - r);
  g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  g.lineTo(x + r, y + h);
  g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  g.lineTo(x, y + r);
  g.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
  g.closePath();
  g.fillPath();
}

function drawRoundedRectStroke(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: number,
  lineWidth: number,
) {
  g.lineStyle(lineWidth, stroke, 1);
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.arc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  g.lineTo(x + w, y + h - r);
  g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  g.lineTo(x + r, y + h);
  g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  g.lineTo(x, y + r);
  g.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
  g.closePath();
  g.strokePath();
}

/**
 * 弹窗广告卡片。
 * 不同 kind 的关闭按钮布局不同，用于关卡难度叠加：
 * - normal    常规：假× 紫粉固定右上标题栏内侧（经典陷阱）+ 真× 青 随机角贴边（里/外）
 * - doubleX   双×迷惑：两个 × 都为青色、分居两个对角；真×严格贴边，假×略向中心内收（靠位置辨真伪）
 * - fullscreen 全屏广告：卡片取偏大尺寸，真× 青仅 1 个、贴底边中央外侧（易漏看）
 */
/**
 * 一个可点击目标：整卡 body 或某个 × 按钮。
 * kind: 'body' | 'true' | 'fake'；rect 为本地坐标（相对所属 popup container 中心）。
 * canvas 像素掩码用它把每张广告的「真实可见像素」画上去，实现像素级命中判定。
 */
interface HitZone {
  kind: 'body' | 'true' | 'fake';
  cx: number; // 本地中心 x
  cy: number; // 本地中心 y
  halfW: number; // 半宽
  halfH: number; // 半高
  radius: number; // 圆角半径（body 用；按钮为 0=直角）
}

class PopupCard {
  public container!: Phaser.GameObjects.Container;

  // 本张广告的可点击像素区（本地坐标）。供场景像素掩码绘制。
  public hitZones: HitZone[] = [];

  private onTrue: () => void;
  private onFake: () => void;

  private w: number;
  private h: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: PopupTypeDef,
    iconTexture: string,
    cfg: GameConfig,
    onTrue: () => void,
    onFake: () => void,
    pw?: number,
    ph?: number,
  ) {
    this.onTrue = onTrue;
    this.onFake = onFake;

    // 1) 弹窗尺寸：normal/doubleX 用关卡范围随机；fullscreen 取偏大固定（关卡 maxW/maxH 本身更大）。
    //    外部可传 pw/ph（= 放置时用来找位的实际尺寸），保证「占位避让」与「实际渲染」一致，
    //    否则按 max 占位会把小广告当大广告挤占空间，高难关卡会因放不下而投放停滞。
    if (pw != null && ph != null) {
      this.w = pw;
      this.h = ph;
    } else if (type.kind === 'fullscreen') {
      this.w = cfg.popup_max_w;
      this.h = cfg.popup_max_h;
    } else {
      this.w = Phaser.Math.Between(cfg.popup_min_w, cfg.popup_max_w);
      this.h = Phaser.Math.Between(cfg.popup_min_h, cfg.popup_max_h);
    }

    const trueBtnSize = cfg.true_btn_size;
    const trueBtnOffset = cfg.true_btn_offset;

    const container = scene.add.container(x, y);
    this.container = container;

    // 卡片底色
    const gBg = scene.add.graphics();
    drawRoundedRect(gBg, -this.w / 2, -this.h / 2, this.w, this.h, 16, 0x10041f, 0.96);
    container.add(gBg);

    // 霓虹边框（fullscreen 用更醒目的紫描边）
    const borderColor = type.kind === 'fullscreen' ? 0x9d4dff : 0x00f0ff;
    const gBorder = scene.add.graphics();
    drawRoundedRectStroke(gBorder, -this.w / 2, -this.h / 2, this.w, this.h, 16, borderColor, 3);
    container.add(gBorder);

    // 标题栏：顶部高 44
    const titleH = 44;
    const gTitle = scene.add.graphics();
    drawRoundedRect(gTitle, -this.w / 2, -this.h / 2, this.w, titleH, 16, 0x00f0ff, 0.18);
    gTitle.fillStyle(0x00f0ff, 0.18);
    gTitle.fillRect(-this.w / 2, -this.h / 2 + 22, this.w, 22);
    container.add(gTitle);

    // 标题文字
    const titleText = scene.add.text(-this.w / 2 + 22, -this.h / 2 + titleH / 2, type.title, {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontStyle: 'bold',
      fontSize: '22px',
      color: '#00f0ff',
    });
    titleText.setOrigin(0, 0.5);
    container.add(titleText);

    // 内容区：标题栏底部 到 CTA 顶
    const ctaTopY = this.h / 2 - 56;
    const contentTopY = -this.h / 2 + titleH;
    const contentCy = (contentTopY + ctaTopY) / 2;

    // 图标：左侧居中
    const icon = scene.add.image(-this.w / 2 + 90, contentCy, iconTexture);
    icon.setDisplaySize(type.kind === 'fullscreen' ? 120 : 80, type.kind === 'fullscreen' ? 120 : 80);
    container.add(icon);

    // 正文：右侧，wrap 宽度随 w 自适应
    const bodyX = -this.w / 2 + (type.kind === 'fullscreen' ? 210 : 180);
    const bodyText = scene.add.text(bodyX, contentCy, type.bodyLines.join('\n'), {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontSize: type.kind === 'fullscreen' ? '22px' : '20px',
      color: '#ffffff',
      align: 'left',
      lineSpacing: 6,
      wordWrap: { width: this.w - (type.kind === 'fullscreen' ? 260 : 220) },
    });
    bodyText.setOrigin(0, 0.5);
    container.add(bodyText);

    // 底部分割线 + 假 CTA
    const gCta = scene.add.graphics();
    gCta.lineStyle(2, 0x9d4dff, 0.6);
    gCta.lineBetween(-this.w / 2 + 22, ctaTopY, this.w / 2 - 22, ctaTopY);
    container.add(gCta);

    const cta = scene.add.text(0, this.h / 2 - 28, '【 立即查看 】', {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontStyle: 'bold',
      fontSize: '22px',
      color: '#ff2bd6',
      stroke: '#000000',
      strokeThickness: 3,
    });
    cta.setOrigin(0.5);
    container.add(cta);

    // 记录整卡 body 的可点击区（本地坐标，相对容器中心）。
    // 该几何将画进场景像素掩码：点落在 body 上 → 视为「点中该广告本体」（无按钮则吞掉，
    // 但会天然屏蔽被它覆盖的下层广告，实现像素级遮挡）。
    this.hitZones.push({
      kind: 'body',
      cx: 0,
      cy: 0,
      halfW: this.w / 2,
      halfH: this.h / 2,
      radius: 16,
    });

    // 根据 kind 生成 × 按钮。按钮只画视觉，不注册 Phaser 交互（交互统一交给场景像素掩码分诊）。
    if (type.kind === 'doubleX') {
      this.buildDoubleXButtons(scene, trueBtnSize, trueBtnOffset, cfg);
    } else if (type.kind === 'fullscreen') {
      this.buildFullscreenClose(scene, trueBtnSize);
    } else {
      this.buildNormalButtons(scene, titleH, trueBtnSize, trueBtnOffset);
    }

    // 入场动画
    container.setScale(0.6);
    container.setAlpha(0);
    scene.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 220,
      ease: 'Back.easeOut',
    });
  }

  /** 供场景像素掩码分诊调用：命中某 zone 时触发对应业务。 */
  public trigger(kind: 'true' | 'fake') {
    if (kind === 'true') {
      this.onTrue();
    } else {
      this.onFake();
    }
  }

  /** 由场景像素掩码按 kind 绘制一个圆角矩形。 */
  public zoneRect(kind: 'body' | 'true' | 'fake'): HitZone | undefined {
    return this.hitZones.find((z) => z.kind === kind);
  }

  /** normal：假× 紫粉右上标题栏 + 真× 青随机角（里/外） */
  private buildNormalButtons(
    scene: Phaser.Scene,
    titleH: number,
    trueBtnSize: number,
    trueBtnOffset: number,
  ) {
    // 假×：固定在标题栏右端内侧
    this.makeCloseButton(scene, this.w / 2 - 30, -this.h / 2 + titleH / 2, 40, 40, 0xff2bd6, '×', 'fake');

    // 真×：随机角 + 里/外
    const corners: Array<'tl' | 'tr' | 'br' | 'bl'> = ['tl', 'tr', 'br', 'bl'];
    const inner = Math.random() < 0.5;
    let corner = Phaser.Utils.Array.GetRandom(corners);
    if (corner === 'tr' && inner) {
      corner = Phaser.Utils.Array.GetRandom(['tl', 'br', 'bl'] as Array<'tl' | 'br' | 'bl'>);
    }
    const { trueCx, trueCy } = computeTrueButtonPos(this.w, this.h, corner, inner, trueBtnOffset);
    this.makeCloseButton(scene, trueCx, trueCy, trueBtnSize, trueBtnSize, 0x00f0ff, '×', 'true');
  }

  /** doubleX：两个青色 × 分居两个对角，真×贴边、假×内收 */
  private buildDoubleXButtons(
    scene: Phaser.Scene,
    trueBtnSize: number,
    trueBtnOffset: number,
    _cfg: GameConfig,
  ) {
    const corners: Array<'tl' | 'tr' | 'br' | 'bl'> = ['tl', 'tr', 'br', 'bl'];
    // 选两个不同对角对（tr/bl 或 tl/br）
    const diagPair = Math.random() < 0.5 ? ['tl', 'br'] : ['tr', 'bl'];
    const shuf = Phaser.Utils.Array.Shuffle([...diagPair]) as Array<'tl' | 'br' | 'tr' | 'bl'>;
    const trueCorner = shuf[0];
    const fakeCorner = shuf[1];

    // 真×：严格贴角（offset 小）
    const { trueCx, trueCy } = computeTrueButtonPos(this.w, this.h, trueCorner, true, trueBtnOffset);
    this.makeCloseButton(scene, trueCx, trueCy, trueBtnSize, trueBtnSize, 0x00f0ff, '×', 'true');

    // 假×：对角 + 沿两轴各内收 btnSize（比真×离角远）
    const innerPad = trueBtnOffset + trueBtnSize;
    const f = computeTrueButtonPos(this.w, this.h, fakeCorner, true, innerPad);
    this.makeCloseButton(scene, f.trueCx, f.trueCy, trueBtnSize, trueBtnSize, 0x00f0ff, '×', 'fake');
  }

  /** fullscreen：只有 1 个真×，贴底边中央外侧（青色），无假×按钮 */
  private buildFullscreenClose(scene: Phaser.Scene, trueBtnSize: number) {
    const cx = 0; // 底边中央
    const cy = this.h / 2 + 18; // 贴在弹窗下沿外侧（本地坐标）
    this.makeCloseButton(scene, cx, cy, trueBtnSize, trueBtnSize, 0x00f0ff, '×', 'true');
  }

  /**
   * 画一个 × 关闭按钮（仅视觉）。并把它的本地矩形记入 hitZones，
   * 由场景像素掩码负责命中（不注册 Phaser 输入，避免重叠时几何命中与视觉不一致）。
   */
  private makeCloseButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    label: string,
    kind: 'true' | 'fake',
  ): void {
    // 按钮容器必须挂进弹窗容器：x/y 是「相对弹窗中心」的局部坐标，
    // 只有作为子对象才会随弹窗一起位移/缩放/入场动画，否则会被当作世界坐标画到屏幕左上角。
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.4);
    g.fillRoundedRect(-w / 2, -h / 2, w, h, 8);
    g.lineStyle(2, color, 1);
    g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
    c.add(g);

    const t = scene.add.text(0, 0, label, {
      fontFamily: 'monospace',
      fontStyle: 'bold',
      fontSize: '30px',
      color: '#' + color.toString(16).padStart(6, '0'),
    });
    t.setOrigin(0.5);
    c.add(t);

    // 挂到弹窗容器末尾 → 渲染在卡片本体之上；按钮无 Phaser 交互，命中统一由像素掩码分诊。
    this.container.add(c);

    // 按钮命中区用真实可见尺寸（直角矩形，圆角很小可忽略）。
    this.hitZones.push({ kind, cx: x, cy: y, halfW: w / 2, halfH: h / 2, radius: 0 });
  }

  public destroy() {
    this.container.destroy();
  }
}

/** 省电道具：电池/闪电 飘过屏幕 */
class PowerItem {
  public sprite!: Phaser.GameObjects.Image;
  public glow!: Phaser.GameObjects.Rectangle;
  private scene: Phaser.Scene;
  private cfg: GameConfig;
  private collected = false;
  private lifetimeMs: number;
  private elapsed = 0;
  private onCollect: () => void;
  private onMiss: () => void;
  private targetScale: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    textureKey: string,
    cfg: GameConfig,
    onCollect: () => void,
    onMiss: () => void,
  ) {
    this.scene = scene;
    this.cfg = cfg;
    this.lifetimeMs = cfg.item_lifetime_ms;
    this.onCollect = onCollect;
    this.onMiss = onMiss;

    this.glow = scene.add.rectangle(x, y, 160, 160, 0x00f0ff, 0.18);
    this.glow.setStrokeStyle(2, 0x00f0ff, 0.7);

    this.sprite = scene.add.image(x, y, textureKey);
    // 重要：先 setDisplaySize 再 setScale，否则 setScale 会基于原始贴图大小覆盖显示尺寸
    this.sprite.setDisplaySize(110, 110);

    // 入场 tween：从 0.4 缩放到目标尺寸（不能用 scale:1 否则会按 1024 贴图原生大小放大）
    // 重要：必须在 texture 已加载之后才计算 width，否则会按 32×32 默认 MISSING 贴图算
    const nativeW = this.sprite.width || 1024;
    this.targetScale = 110 / nativeW;
    this.sprite.setScale(0.4 * this.targetScale);
    this.sprite.setAlpha(0);
    this.glow.setAlpha(0);
    this.glow.setScale(0.4);
    scene.tweens.add({
      targets: this.sprite,
      scale: this.targetScale,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });
    scene.tweens.add({
      targets: this.glow,
      scale: 1,
      alpha: 0.18,
      duration: 250,
      ease: 'Back.easeOut',
    });

    // 浮动（只动 y，不动 scale）
    scene.tweens.add({
      targets: [this.sprite, this.glow],
      y: y - 30,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** 场景像素掩码分诊：点是否落在本道具可点范围（未收集时）。 */
  public contains(px: number, py: number): boolean {
    if (this.collected) return false;
    // 图标约 110×110 + 光晕 160，取半径 ~82 的圆形可点区
    const dx = px - this.sprite.x;
    const dy = py - this.sprite.y;
    return dx * dx + dy * dy <= 82 * 82;
  }

  public collect() {
    if (this.collected) return;
    this.collected = true;
    this.onCollect();

    // 爆开特效
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const p = this.scene.add.circle(this.sprite.x, this.sprite.y, 6, 0x00f0ff, 1);
      this.scene.tweens.add({
        targets: p,
        x: this.sprite.x + Math.cos(angle) * 80,
        y: this.sprite.y + Math.sin(angle) * 80,
        alpha: 0,
        duration: 450,
        onComplete: () => p.destroy(),
      });
    }

    this.scene.tweens.add({
      targets: [this.sprite, this.glow],
      scale: { from: this.sprite.scaleX, to: this.sprite.scaleX * 1.6 },
      alpha: 0,
      duration: 220,
      onComplete: () => this.destroy(),
    });
  }

  /** 由主循环调用，超过 lifetime 即视作漏掉 */
  public tick(dt: number) {
    if (this.collected) return;
    this.elapsed += dt;
    if (this.elapsed >= this.lifetimeMs) {
      this.onMiss();
      this.scene.tweens.add({
        targets: [this.sprite, this.glow],
        alpha: 0,
        scale: { from: this.sprite.scaleX, to: this.sprite.scaleX * 0.3 },
        duration: 200,
        onComplete: () => this.destroy(),
      });
      this.collected = true; // 防止再次触发
    } else {
      // 剩余 1s 开始闪烁
      const remain = (this.lifetimeMs - this.elapsed) / 1000;
      if (remain < 1) {
        this.glow.setAlpha(0.2 + 0.5 * Math.abs(Math.sin(this.elapsed / 80)));
      }
    }
  }

  public isDead() {
    return this.collected && !this.sprite.active;
  }

  public destroy() {
    this.sprite.destroy();
    this.glow.destroy();
  }
}

export class GameScene extends Phaser.Scene {
  static KEY = 'GameScene';

  private cfg!: GameConfig;
  // 本局生效配置 = 全局 cfg 与关卡覆盖项的合并（新建，不污染 registry 的 cfg）
  private lc!: GameConfig;
  // 当前关卡
  private level!: LevelDef;

  // 状态
  private battery = 20;
  private timeLeftMs = 30000;
  private score = 0;
  private correctCloses = 0;
  private fakeClicks = 0;
  private itemsCollected = 0;
  private itemsMissed = 0;
  private running = true;
  private startTimeMs = 0;
  private elapsedMs = 0;
  // 关卡广告投放进度：已出总数 / 需正确关闭总数
  private adsSpawned = 0;
  private adsTotal = 10;
  // 胜利奖分（含剩余时间加成）
  private victoryTimeBonus = 0;

  // HUD
  private batteryBar!: Phaser.GameObjects.Rectangle;
  private batteryText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;
  // 顶部「目标」常驻提示行：还需正确关闭 X / 共 Y
  private objectiveText!: Phaser.GameObjects.Text;

  // 弹窗 / 道具
  private popups: PopupCard[] = [];
  private items: PowerItem[] = [];

  // 提示文本（"+1.5%" / "-3%"）
  private floatTexts: Phaser.GameObjects.Text[] = [];

  // 闪红/震屏层
  private flashRect!: Phaser.GameObjects.Rectangle;

  // 下一个道具出现时间
  private nextItemAt = 0;

  constructor() {
    super(GameScene.KEY);
  }

  init(data: { levelId?: number }) {
    this.level = getLevel(data?.levelId ?? 1);
  }

  create() {
    this.cfg = this.game.registry.get('cfg') as GameConfig;
    // 关卡覆盖项合并成本局配置（不污染共享 cfg）
    const lv = this.level;
    this.lc = {
      ...this.cfg,
      initial_battery: lv.initialBattery,
      round_seconds: lv.roundSeconds,
      natural_drain_per_sec: lv.naturalDrainPerSec,
      popup_spawn_min_ms: lv.spawnMinMs,
      popup_spawn_max_ms: lv.spawnMaxMs,
      popup_min_w: lv.popupMinW,
      popup_max_w: lv.popupMaxW,
      popup_min_h: lv.popupMinH,
      popup_max_h: lv.popupMaxH,
      score_win_bonus: lv.scoreWinBonus,
    };
    this.adsTotal = lv.totalAdCount;

    const { width, height } = this.scale;

    // 初始化状态
    this.battery = this.lc.initial_battery;
    this.timeLeftMs = this.lc.round_seconds * 1000;
    this.score = 0;
    this.correctCloses = 0;
    this.fakeClicks = 0;
    this.itemsCollected = 0;
    this.itemsMissed = 0;
    this.adsSpawned = 0;
    this.victoryTimeBonus = 0;
    this.running = true;
    this.popups = [];
    this.items = [];
    this.floatTexts = [];
    this.startTimeMs = this.time.now;
    this.elapsedMs = 0;
    this.nextItemAt = this.lc.item_first_appear_ms;

    // 背景
    const bg = this.add.image(width / 2, height / 2, 'bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.85);

    // 暗色遮罩
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0418, 0.45);

    // 闪红层
    this.flashRect = this.add.rectangle(width / 2, height / 2, width, height, 0xff2bd6, 0);
    this.flashRect.setDepth(1000);
    this.flashRect.setBlendMode(Phaser.BlendModes.ADD);

    this.buildHud();
    this.setupPointerForPopups();
    // 立即生成第一批（在关卡投放总数内）
    this.scheduleNextPopup(300);

    // 顶部提示
    this.showBanner(
      `第${this.level.id}关 · 在倒计时内关掉全部 ${this.adsTotal} 条广告！`,
      2400,
    );
  }

  private buildHud() {
    const { width } = this.scale;

    // 顶部 HUD 区域
    const hudY = 50;
    const hudH = 150;
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x0a0418, 0.85);
    hudBg.fillRect(0, 0, width, hudH);
    hudBg.lineStyle(2, 0x00f0ff, 0.7);
    hudBg.lineBetween(0, hudH, width, hudH);

    // 左侧：关卡名 + 需关广告实时进度
    this.objectiveText = this.add.text(20, 18, '', {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontStyle: 'bold',
      fontSize: '22px',
      color: '#ff2bd6',
    });
    this.objectiveText.setOrigin(0, 0);

    // 右侧：倒计时
    this.timerText = this.add.text(width - 20, 16, `${this.adsTotal}.0`, {
      fontFamily: 'monospace',
      fontStyle: 'bold',
      fontSize: '38px',
      color: '#ff2bd6',
      stroke: '#000',
      strokeThickness: 3,
    });
    this.timerText.setOrigin(1, 0);

    // 电量条
    const barX = 20;
    const barY = 60;
    const barW = width - 40;
    const barH = 30;
    this.add
      .rectangle(barX, barY, barW, barH, 0x10041f, 0.95)
      .setStrokeStyle(2, 0x9d4dff, 1)
      .setOrigin(0, 0);
    this.batteryBar = this.add
      .rectangle(barX + 2, barY + 2, 0, barH - 4, 0xff2bd6, 1)
      .setOrigin(0, 0);

    this.batteryText = this.add.text(barX + 12, barY + barH / 2, '20%', {
      fontFamily: 'monospace',
      fontStyle: 'bold',
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3,
    });
    this.batteryText.setOrigin(0, 0.5);

    this.add
      .text(width - 20, barY + barH / 2, '电量', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '20px',
        color: '#00f0ff',
      })
      .setOrigin(1, 0.5);

    // 得分 / 统计
    this.scoreText = this.add.text(20, 104, '得分 0', {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontSize: '20px',
      color: '#9d4dff',
    });
    this.statsText = this.add.text(width - 20, 104, '关对 0 / 误点 0', {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontSize: '17px',
      color: '#ffffff',
    });
    this.statsText.setOrigin(1, 0);
  }

  private setupPointerForPopups() {
    // 像素级命中分诊：广告允许重叠后，Phaser 自带的「矩形几何命中 + topOnly」会把上层广告
    // 的透明整卡/放大缓冲按钮当成最上层命中，几何覆盖 ≠ 视觉可见，导致下层露出的 × 点不到。
    // 因此这里放弃每个对象各自的 interactive，改为维护一张离屏像素掩码（每帧自底向上把每张
    // 广告的真实 body 圆角 + 按钮像素 + 道具画上去），点击时读取该点像素得到「视觉最上层命中」。
    const { width, height } = this.scale;
    const c = document.createElement('canvas');
    c.width = Math.ceil(width);
    c.height = Math.ceil(height);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    this.maskCanvas = c;
    this.maskCtx = ctx;

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.dispatchTap(pointer.worldX, pointer.worldY);
    });
  }

  private maskCanvas!: HTMLCanvasElement;
  private maskCtx!: CanvasRenderingContext2D;
  // 每个画到掩码上的「命中单元」→ 对应弹窗/道具
  private maskRefs: Array<{ kind: 'body' | 'true' | 'fake' | 'item'; popup?: PopupCard; item?: PowerItem }> = [];

  /** 画一个（世界坐标）圆角矩形色块到掩码。 */
  private maskFillRoundRect(wx: number, wy: number, halfW: number, halfH: number, radius: number, color: string) {
    const ctx = this.maskCtx;
    const x = wx - halfW;
    const y = wy - halfH;
    const w = halfW * 2;
    const h = halfH * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    const r = Math.max(0, Math.min(radius, halfW, halfH));
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  /** 每帧重建像素掩码：自底向上 = 后画的覆盖先画的 → 每像素保存最顶层命中。 */
  private rebuildMask() {
    const ctx = this.maskCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    this.maskRefs.length = 0;

    const indexToColor = (i: number) =>
      `rgb(${i & 0xff},${(i >> 8) & 0xff},${(i >> 16) & 0xff})`;

    // 广告（投放顺序即由底到顶；关掉的已从 popups 移除）
    for (const pop of this.popups) {
      if (!pop.container || !pop.container.active) continue;
      const c = pop.container;
      const s = c.scaleX || 1;
      // 先画 body（圆角矩形），让「点击广告本体」覆盖下层；随后画按钮覆盖在同卡 body 上
      for (const zone of pop.hitZones) {
        const wcx = c.x + zone.cx * s;
        const wcy = c.y + zone.cy * s;
        const halfW = zone.halfW * s;
        const halfH = zone.halfH * s;
        const idx = this.maskRefs.length;
        this.maskRefs.push({ kind: zone.kind, popup: pop });
        this.maskFillRoundRect(wcx, wcy, halfW, halfH, zone.radius * s, indexToColor(idx));
      }
    }
    // 道具画在最上层（后生成、渲染在广告之上）
    for (const it of this.items) {
      if (it.isDead() || !it.sprite || !it.sprite.active) continue;
      const idx = this.maskRefs.length;
      this.maskRefs.push({ kind: 'item', item: it });
      this.maskFillRoundRect(it.sprite.x, it.sprite.y, 82, 82, 82, indexToColor(idx));
    }
  }

  private dispatchTap(wx: number, wy: number) {
    if (!this.running) return;
    // 按需重建掩码（仅在点击时构建一次，避免每帧开销）
    this.rebuildMask();
    const x = Math.round(wx);
    const y = Math.round(wy);
    const cw = this.maskCanvas.width;
    const ch = this.maskCanvas.height;
    if (x < 0 || y < 0 || x >= cw || y >= ch) return;
    const d = this.maskCtx.getImageData(x, y, 1, 1).data;
    if (d[3] === 0) return; // 点到空白（无广告/道具）
    const idx = (d[0] | (d[1] << 8) | (d[2] << 16)) & 0xffffff;
    const ref = this.maskRefs[idx];
    if (!ref) return;
    if (ref.kind === 'true') {
      ref.popup?.trigger('true');
    } else if (ref.kind === 'fake') {
      ref.popup?.trigger('fake');
    } else if (ref.kind === 'item') {
      ref.item?.collect();
    }
    // kind === 'body'：点到广告本体非按钮区 → 不做任何事（吞掉，且已屏蔽其下层）
  }

  private popupSpawnTimer?: Phaser.Time.TimerEvent;

  /** 若本关广告还没投放完，按固定间隔安排下一次生成；已投完则不再生成。 */
  private scheduleNextPopup(delayMs?: number) {
    if (this.popupSpawnTimer) this.popupSpawnTimer.remove();
    if (!this.running || this.adsSpawned >= this.adsTotal) return;
    const d =
      delayMs ??
      Phaser.Math.Between(this.lc.popup_spawn_min_ms, this.lc.popup_spawn_max_ms);
    this.popupSpawnTimer = this.time.addEvent({
      delay: d,
      callback: () => {
        if (!this.running) return;
        this.trySpawnPopup();
        // 不管是否投放成功（无同屏上限、允许重叠，投不出仅因已投完），
        // 未投完就继续按关卡间隔推进下一张
        if (this.adsSpawned < this.adsTotal) {
          this.scheduleNextPopup();
        }
      },
      callbackScope: this,
    });
  }

  /**
   * 投放一张广告（成功则 adsSpawned+1）。
   * 规则按产品口径：本关「一共要投放 adsTotal 张」就逐张投满为止——
   * 不设同屏上限、不去避让重叠（广告允许重叠）。位置在屏幕内随机取中心，
   * 保证中心可见即可。能否在倒计时内把 N 张全关掉完全看玩家手速。
   */
  private trySpawnPopup(): boolean {
    if (!this.running) return false;
    if (this.adsSpawned >= this.adsTotal) return false;

    const type = pickRandomPopupType(this.level.popupPoolIds);
    const w = type.kind === 'fullscreen' ? this.lc.popup_max_w : Phaser.Math.Between(this.lc.popup_min_w, this.lc.popup_max_w);
    const h = type.kind === 'fullscreen' ? this.lc.popup_max_h : Phaser.Math.Between(this.lc.popup_min_h, this.lc.popup_max_h);

    const { width, height } = this.scale;
    const minTop = 200;      // HUD 下方
    const bottomPad = 20;    // 底边距（全屏真×会贴在弹窗下沿，需留一点可点区）
    // 中心 x / y：优先整卡可见；尺寸过大时 clamp 到屏内，至少中心不越界
    const loX = Math.min(width - bottomPad, Math.max(bottomPad, w / 2));
    const hiX = Math.max(loX, width - w / 2 - bottomPad);
    const loY = Math.min(height - bottomPad, Math.max(minTop, h / 2));
    const hiY = Math.max(loY, height - h / 2 - bottomPad);
    const x = Phaser.Math.Between(loX, hiX);
    const y = Phaser.Math.Between(loY, hiY);

    const popup = new PopupCard(
      this,
      x,
      y,
      type,
      type.iconKey,
      this.lc,
      () => this.handleTrueClose(popup),
      () => this.handleFakeClose(popup),
      w,
      h,
    );
    this.popups.push(popup);
    this.adsSpawned += 1;
    return true;
  }

  private handleTrueClose(popup: PopupCard) {
    this.correctCloses += 1;
    this.score += this.lc.score_correct;
    this.battery = Math.min(100, this.battery + this.lc.correct_close_gain);
    this.spawnFloatText(
      popup.container.x,
      popup.container.y,
      `+${this.lc.correct_close_gain}%`,
      '#00f0ff',
    );
    // 移除该弹窗
    this.popupOut(popup, true);

    // 全部广告都已正确关闭 → 立即胜利
    if (this.correctCloses >= this.adsTotal) {
      const secLeft = Math.max(0, this.timeLeftMs / 1000);
      this.victoryTimeBonus = Math.floor(secLeft) * 10;
      this.endGame(true);
    }
  }

  private handleFakeClose(popup: PopupCard) {
    this.fakeClicks += 1;
    this.score -= this.lc.score_fake_penalty;
    this.battery = Math.max(0, this.battery - this.lc.fake_close_penalty);
    this.spawnFloatText(
      popup.container.x,
      popup.container.y,
      `点错了！-${this.lc.fake_close_penalty}%`,
      '#ff2bd6',
    );
    this.shakeAndFlash();
    // 误点不关掉广告：弹窗保留，玩家仍需找到真×才能关闭它
  }

  private popupOut(popup: PopupCard, isGood: boolean) {
    this.popups = this.popups.filter((p) => p !== popup);
    this.tweens.add({
      targets: popup.container,
      scale: 0.4,
      alpha: 0,
      duration: 200,
      ease: 'Back.easeIn',
      onComplete: () => popup.destroy(),
    });
  }

  private shakeAndFlash() {
    this.cameras.main.shake(220, 0.008);
    this.flashRect.setAlpha(0.45);
    this.tweens.add({
      targets: this.flashRect,
      alpha: 0,
      duration: 280,
    });
  }

  private trySpawnItem() {
    if (this.items.length >= 1) return;
    const { width, height } = this.scale;
    const margin = 100;
    const x = Phaser.Math.Between(margin, width - margin);
    const y = Phaser.Math.Between(height * 0.35, height * 0.7);
    const tex = Math.random() > 0.5 ? 'it_battery' : 'it_lightning';
    const item = new PowerItem(
      this,
      x,
      y,
      tex,
      this.cfg,
      () => this.handleItemCollect(item),
      () => this.handleItemMiss(item),
    );
    this.items.push(item);
  }

  private handleItemCollect(item: PowerItem) {
    this.items = this.items.filter((i) => i !== item);
    this.itemsCollected += 1;
    this.score += this.cfg.score_item;
    this.battery = Math.min(100, this.battery + this.cfg.item_charge_gain);
    this.timeLeftMs += this.cfg.item_time_bonus * 1000;
    this.spawnFloatText(
      item.sprite.x,
      item.sprite.y,
      `+${this.cfg.item_charge_gain}% +${this.cfg.item_time_bonus}s`,
      '#00ff80',
    );
  }

  private handleItemMiss(item: PowerItem) {
    this.items = this.items.filter((i) => i !== item);
    this.itemsMissed += 1;
    this.score -= this.cfg.score_miss_item;
  }

  private spawnFloatText(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, {
      fontFamily: 'monospace',
      fontStyle: 'bold',
      fontSize: '32px',
      color,
      stroke: '#000',
      strokeThickness: 4,
    });
    t.setOrigin(0.5);
    t.setDepth(800);
    this.floatTexts.push(t);
    this.tweens.add({
      targets: t,
      y: y - 80,
      alpha: 0,
      duration: 900,
      onComplete: () => {
        this.floatTexts = this.floatTexts.filter((f) => f !== t);
        t.destroy();
      },
    });
  }

  private showBanner(text: string, durationMs: number) {
    const { width } = this.scale;
    const banner = this.add.container(width / 2, 220);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.7);
    g.fillRoundedRect(-260, -30, 520, 60, 12);
    g.lineStyle(2, 0xff2bd6, 1);
    g.strokeRoundedRect(-260, -30, 520, 60, 12);
    banner.add(g);
    const t = this.add.text(0, 0, text, {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontStyle: 'bold',
      fontSize: '26px',
      color: '#ff2bd6',
    });
    t.setOrigin(0.5);
    banner.add(t);
    banner.setDepth(900);
    banner.setAlpha(0);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      duration: 200,
      yoyo: true,
      hold: durationMs,
      onComplete: () => banner.destroy(),
    });
  }

  update(time: number, delta: number) {
    if (!this.running) return;
    this.elapsedMs = time - this.startTimeMs;

    // 倒计时结束：若还没关完 → 失败（剩 X 条未关）
    this.timeLeftMs -= delta;
    if (this.timeLeftMs <= 0) {
      this.timeLeftMs = 0;
      this.endGame(false, 'timeout');
      return;
    }

    // 自然掉电 → 电量耗尽失败
    this.battery -= (this.lc.natural_drain_per_sec * delta) / 1000;
    if (this.battery <= 0) {
      this.battery = 0;
      this.endGame(false, 'battery');
      return;
    }

    // 道具计时
    if (this.elapsedMs >= this.nextItemAt) {
      this.trySpawnItem();
      const min = this.cfg.item_interval_min_ms;
      const max = this.cfg.item_interval_max_ms;
      this.nextItemAt = this.elapsedMs + Phaser.Math.Between(min, max);
    }

    // 道具生命周期
    for (const it of [...this.items]) {
      it.tick(delta);
      if (it.isDead()) {
        this.items = this.items.filter((i) => i !== it);
      }
    }

    // HUD 更新
    this.updateHud();
  }

  private updateHud() {
    const w = this.scale.width;
    const barMaxW = w - 40 - 4 - 80; // 留右侧「电量」文字
    this.batteryBar.width = Math.max(0, (this.battery / 100) * barMaxW);
    this.batteryBar.setFillStyle(this.battery > 30 ? 0xff2bd6 : this.battery > 15 ? 0xff8800 : 0xff2b2b, 1);
    this.batteryText.setText(`${this.battery.toFixed(1)}%`);

    this.timerText.setText((this.timeLeftMs / 1000).toFixed(1));
    if (this.timeLeftMs < 5000) {
      this.timerText.setColor('#ff2b2b');
    } else if (this.timeLeftMs < 10000) {
      this.timerText.setColor('#ff8800');
    } else {
      this.timerText.setColor('#ff2bd6');
    }

    // 目标进度：还需正确关闭 X / 共 Y
    const remain = Math.max(0, this.adsTotal - this.correctCloses);
    const done = remain === 0;
    this.objectiveText.setText(
      `第${this.level.id}关 · ${done ? '全部关闭！' : `还需关 ${remain} / 共 ${this.adsTotal}`}`,
    );
    this.objectiveText.setColor(done ? '#00ff80' : '#ff2bd6');

    this.scoreText.setText(`得分 ${this.score}`);
    this.statsText.setText(
      `关对 ${this.correctCloses} / 误点 ${this.fakeClicks} / 剩 ${Math.max(0, this.adsTotal - this.correctCloses)}`,
    );
  }

  private endGame(survived: boolean, reason: 'battery' | 'timeout' | 'win' = 'win') {
    if (!this.running) return;
    this.running = false;
    if (this.popupSpawnTimer) this.popupSpawnTimer.remove();

    let score = this.score;
    if (survived) {
      score += this.level.scoreWinBonus + this.victoryTimeBonus;
    }

    const snap: ScoreSnapshot = {
      score,
      correctCloses: this.correctCloses,
      fakeClicks: this.fakeClicks,
      itemsCollected: this.itemsCollected,
      itemsMissed: this.itemsMissed,
      finalBattery: this.battery,
      survived,
      elapsedMs: this.elapsedMs,
    };

    if (survived) {
      unlockLevel(this.level.id + 1);
    }

    this.scene.start('ResultScene', {
      snapshot: snap,
      level: this.level,
      adsTotal: this.adsTotal,
      remainingAds: Math.max(0, this.adsTotal - this.correctCloses),
      winBonus: this.level.scoreWinBonus,
      timeBonus: this.victoryTimeBonus,
      reason,
    });
  }
}
