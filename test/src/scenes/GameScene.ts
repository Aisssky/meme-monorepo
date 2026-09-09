import Phaser from 'phaser';
import type { GameConfig, PopupTypeDef, ScoreSnapshot } from '../types';
import { POPUP_POOL, pickRandomPopupType } from '../data/popupPool';

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
 * - 真×：右上角，霓虹青
 * - 假×：左上角或中部，霓虹紫粉 / 假装是「关闭」按钮
 */
class PopupCard {
  public container!: Phaser.GameObjects.Container;
  public bounds!: Phaser.GameObjects.Rectangle;

  private trueBtn!: Phaser.GameObjects.Container;
  private fakeBtn!: Phaser.GameObjects.Container;

  private onTrue: () => void;
  private onFake: () => void;

  private type: PopupTypeDef;
  private w: number;
  private h: number;
  private isTrueTopRight: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    type: PopupTypeDef,
    iconTexture: string,
    cfg: GameConfig,
    onTrue: () => void,
    onFake: () => void,
  ) {
    this.type = type;
    this.onTrue = onTrue;
    this.onFake = onFake;
    // 真×位置随机化，5% 概率放底部，避免玩家形成「必点右上」的肌肉记忆
    this.isTrueTopRight = Math.random() > 0.05;
    this.w = 460;
    this.h = 280;

    const container = scene.add.container(x, y);
    this.container = container;

    // 卡片底色
    const gBg = scene.add.graphics();
    drawRoundedRect(gBg, -this.w / 2, -this.h / 2, this.w, this.h, 16, 0x10041f, 0.96);
    container.add(gBg);

    // 霓虹边框
    const gBorder = scene.add.graphics();
    drawRoundedRectStroke(gBorder, -this.w / 2, -this.h / 2, this.w, this.h, 16, 0x00f0ff, 3);
    container.add(gBorder);

    // 标题栏
    const gTitle = scene.add.graphics();
    drawRoundedRect(gTitle, -this.w / 2, -this.h / 2, this.w, 50, 16, 0x00f0ff, 0.18);
    // 覆盖底部圆角
    gTitle.fillStyle(0x00f0ff, 0.18);
    gTitle.fillRect(-this.w / 2, -this.h / 2 + 25, this.w, 25);
    container.add(gTitle);

    // 标题文字
    const titleText = scene.add.text(-this.w / 2 + 24, -this.h / 2 + 25, type.title, {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontStyle: 'bold',
      fontSize: '24px',
      color: '#00f0ff',
    });
    titleText.setOrigin(0, 0.5);
    container.add(titleText);

    // 图标
    const icon = scene.add.image(-this.w / 2 + 80, 12, iconTexture);
    icon.setDisplaySize(96, 96);
    container.add(icon);

    // 正文
    const bodyText = scene.add.text(40, -10, type.bodyLines.join('\n'), {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      align: 'left',
      lineSpacing: 8,
      wordWrap: { width: this.w - 220 },
    });
    bodyText.setOrigin(0, 0.5);
    container.add(bodyText);

    // 假×：左上角，颜色紫粉
    this.fakeBtn = this.makeCloseButton(
      scene,
      -this.w / 2 + 28,
      -this.h / 2 + 25,
      44,
      44,
      0xff2bd6,
      '×',
      false,
    );
    container.add(this.fakeBtn);

    // 真×：右上角，颜色青
    this.trueBtn = this.makeCloseButton(
      scene,
      this.w / 2 - 28,
      -this.h / 2 + 25,
      44,
      44,
      0x00f0ff,
      '×',
      true,
    );
    container.add(this.trueBtn);

    // 底部分割线 + 假 CTA
    const gCta = scene.add.graphics();
    gCta.lineStyle(2, 0x9d4dff, 0.6);
    gCta.lineBetween(-this.w / 2 + 24, this.h / 2 - 56, this.w / 2 - 24, this.h / 2 - 56);
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

    // 点击事件
    this.fakeBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.onFake();
    });
    this.trueBtn.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event?.stopPropagation();
      this.onTrue();
    });

    // 用于 hit-test 区域（透明矩形，覆盖整卡）。
    // 自定义命中：只拦截「非按钮区」，把左上/右上两个 × 区域让给下层按钮，
    // 否则盖全卡的透明矩形会在输入检测中把按钮点击也吞掉。
    const btnHalf = 30; // 按钮判定半宽（略大于 44/2，留出容差）
    const inButtonArea = (lx: number, ly: number) => {
      const fakeCx = -this.w / 2 + 28;
      const trueCx = this.w / 2 - 28;
      const topCy = -this.h / 2 + 25;
      return (
        Math.abs(lx - fakeCx) <= btnHalf && Math.abs(ly - topCy) <= btnHalf
      ) || (
        Math.abs(lx - trueCx) <= btnHalf && Math.abs(ly - topCy) <= btnHalf
      );
    };
    const bounds = scene.add.rectangle(0, 0, this.w, this.h, 0x000000, 0);
    bounds.setInteractive(
      new Phaser.Geom.Rectangle(-this.w / 2, -this.h / 2, this.w, this.h),
      (hitArea: unknown, x: number, y: number) =>
        Phaser.Geom.Rectangle.Contains(hitArea as Phaser.Geom.Rectangle, x, y) &&
        !inButtonArea(x, y),
    );
    // 点击非按钮区域：无效
    bounds.on('pointerdown', () => {
      /* swallow */
    });
    container.add(bounds);
    this.bounds = bounds;
  }

  private makeCloseButton(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
    h: number,
    color: number,
    label: string,
    isTrue: boolean,
  ): Phaser.GameObjects.Container {
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
      fontSize: isTrue ? '32px' : '28px',
      color: '#' + color.toString(16).padStart(6, '0'),
    });
    t.setOrigin(0.5);
    c.add(t);

    // 关键修复：Container 必须自身 setInteractive，Phaser 才会把 pointer 事件
    // 派发给 c 上注册的监听器（on('pointerdown')）。此前仅容器内子矩形 setInteractive，
    // 容器本身从不响应输入，导致 真×/假× 点击永远不触发。
    c.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains,
    );
    // 提层级：确保按钮位于卡片透明拦截区（bounds）之上，优先命中
    c.setDepth(20);

    return c;
  }

  public destroy() {
    this.container.destroy();
  }

  public getBounds(): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      this.container.x - this.w / 2,
      this.container.y - this.h / 2,
      this.w,
      this.h,
    );
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
    this.glow.setInteractive({ useHandCursor: true });
    this.glow.on('pointerdown', () => this.collect());

    this.sprite = scene.add.image(x, y, textureKey);
    // 重要：先 setDisplaySize 再 setScale，否则 setScale 会基于原始贴图大小覆盖显示尺寸
    this.sprite.setDisplaySize(110, 110);
    this.sprite.setInteractive({ useHandCursor: true });
    this.sprite.on('pointerdown', () => this.collect());

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

  private collect() {
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

  // HUD
  private batteryBar!: Phaser.GameObjects.Rectangle;
  private batteryText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private statsText!: Phaser.GameObjects.Text;

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

  create() {
    this.cfg = this.game.registry.get('cfg') as GameConfig;
    const { width, height } = this.scale;

    // 初始化状态
    this.battery = this.cfg.initial_battery;
    this.timeLeftMs = this.cfg.round_seconds * 1000;
    this.score = 0;
    this.correctCloses = 0;
    this.fakeClicks = 0;
    this.itemsCollected = 0;
    this.itemsMissed = 0;
    this.running = true;
    this.popups = [];
    this.items = [];
    this.floatTexts = [];
    this.startTimeMs = this.time.now;
    this.elapsedMs = 0;
    this.nextItemAt = this.cfg.item_first_appear_ms;

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
    this.scheduleNextPopup(800);

    // 顶部提示
    this.showBanner('开机…手机已弹窗 99+', 1500);
  }

  private buildHud() {
    const { width } = this.scale;

    // 顶部 HUD 区域
    const hudY = 50;
    const hudH = 160;
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x0a0418, 0.85);
    hudBg.fillRect(0, 0, width, hudH);
    hudBg.lineStyle(2, 0x00f0ff, 0.7);
    hudBg.lineBetween(0, hudH, width, hudH);
    this.add.text(20, 18, '📱 我的手机', {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontSize: '22px',
      color: '#00f0ff',
    });

    this.add
      .text(width - 20, 18, '⏱', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ff2bd6',
      })
      .setOrigin(1, 0);

    this.timerText = this.add.text(width - 20, 16, '30.0', {
      fontFamily: 'monospace',
      fontStyle: 'bold',
      fontSize: '36px',
      color: '#ff2bd6',
      stroke: '#000',
      strokeThickness: 3,
    });
    this.timerText.setOrigin(1, 0);

    // 电量条
    const barX = 20;
    const barY = 64;
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

    // 分数 / 统计
    this.scoreText = this.add.text(20, 110, '得分 0', {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontSize: '20px',
      color: '#9d4dff',
    });
    this.statsText = this.add.text(width - 20, 110, '关对 0 / 误点 0 / 漏 0', {
      fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
      fontSize: '18px',
      color: '#ffffff',
    });
    this.statsText.setOrigin(1, 0);
  }

  private setupPointerForPopups() {
    // 每个 popup 自己处理 pointer 事件。
    // 这里只兜底：点击空白处不计。
  }

  private popupSpawnTimer?: Phaser.Time.TimerEvent;

  private scheduleNextPopup(delayMs?: number) {
    if (this.popupSpawnTimer) this.popupSpawnTimer.remove();
    const d =
      delayMs ??
      Phaser.Math.Between(this.cfg.popup_spawn_min_ms, this.cfg.popup_spawn_max_ms);
    this.popupSpawnTimer = this.time.addEvent({
      delay: d,
      callback: () => {
        if (!this.running) return;
        this.trySpawnPopup();
        // 越后期越快
        const ratio = Math.min(1, this.elapsedMs / (this.cfg.round_seconds * 1000));
        const min = Phaser.Math.Linear(this.cfg.popup_spawn_min_ms, 350, ratio);
        const max = Phaser.Math.Linear(this.cfg.popup_spawn_max_ms, 600, ratio);
        this.scheduleNextPopup(Phaser.Math.Between(min, max));
      },
      callbackScope: this,
    });
  }

  private trySpawnPopup() {
    if (this.popups.length >= this.cfg.max_popups_on_screen) {
      // 强制老化最早一个（视作漏关，扣微量电）
      const oldest = this.popups.shift();
      oldest?.destroy();
      this.battery = Math.max(0, this.battery - 0.5);
    }

    // 找一个不重叠的位置
    const { width, height } = this.scale;
    const margin = 16;
    const popW = 460;
    const popH = 280;
    const minTop = 230; // HUD 下方
    const maxBottom = height - 40;

    let x = 0;
    let y = 0;
    let placed = false;
    for (let i = 0; i < 24; i++) {
      x = Phaser.Math.Between(popW / 2 + margin, width - popW / 2 - margin);
      y = Phaser.Math.Between(minTop + popH / 2, maxBottom - popH / 2);
      const test = new Phaser.Geom.Rectangle(x - popW / 2, y - popH / 2, popW, popH);
      let overlap = false;
      for (const p of this.popups) {
        if (Phaser.Geom.Rectangle.Overlaps(test, p.getBounds())) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        placed = true;
        break;
      }
    }
    if (!placed) return;

    const type = pickRandomPopupType();
    const popup = new PopupCard(
      this,
      x,
      y,
      type,
      type.iconKey,
      this.cfg,
      () => this.handleTrueClose(popup),
      () => this.handleFakeClose(popup),
    );
    this.popups.push(popup);
  }

  private handleTrueClose(popup: PopupCard) {
    this.correctCloses += 1;
    this.score += this.cfg.score_correct;
    this.battery = Math.min(100, this.battery + this.cfg.correct_close_gain);
    this.spawnFloatText(popup.container.x, popup.container.y, `+${this.cfg.correct_close_gain}%`, '#00f0ff');
    this.popupOut(popup, true);
  }

  private handleFakeClose(popup: PopupCard) {
    this.fakeClicks += 1;
    this.score -= this.cfg.score_fake_penalty;
    this.battery = Math.max(0, this.battery - this.cfg.fake_close_penalty);
    this.spawnFloatText(popup.container.x, popup.container.y, `-${this.cfg.fake_close_penalty}%`, '#ff2bd6');
    this.shakeAndFlash();
    this.popupOut(popup, false);
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

    // 倒计时
    this.timeLeftMs -= delta;
    if (this.timeLeftMs <= 0) {
      this.timeLeftMs = 0;
      this.endGame(true);
      return;
    }

    // 自然掉电
    this.battery -= (this.cfg.natural_drain_per_sec * delta) / 1000;
    if (this.battery <= 0) {
      this.battery = 0;
      this.endGame(false);
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

    this.scoreText.setText(`得分 ${this.score}`);
    this.statsText.setText(
      `关对 ${this.correctCloses} / 误点 ${this.fakeClicks} / 漏 ${this.itemsMissed}`,
    );
  }

  private endGame(survived: boolean) {
    if (!this.running) return;
    this.running = false;
    if (this.popupSpawnTimer) this.popupSpawnTimer.remove();

    const snap: ScoreSnapshot = {
      score: this.score,
      correctCloses: this.correctCloses,
      fakeClicks: this.fakeClicks,
      itemsCollected: this.itemsCollected,
      itemsMissed: this.itemsMissed,
      finalBattery: this.battery,
      survived,
      elapsedMs: this.elapsedMs,
    };
    if (survived) {
      this.score += this.cfg.score_win_bonus;
      snap.score = this.score;
    }

    this.scene.start('ResultScene', { snapshot: snap });
  }
}
