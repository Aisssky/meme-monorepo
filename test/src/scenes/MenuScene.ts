import Phaser from 'phaser';
import type { GameConfig } from '../types';
import { LEVELS, MAX_LEVEL, getUnlockedLevel } from '../data/levels';

/**
 * 开始界面：关卡选择（逐关解锁，竖排可上下拖动滚动）+ 极简玩法提示。
 * 关卡多到一屏放不下，故做成可拖拽滚动列表：
 *  - 卡片直接挂在场景层（不套 container），共用一张 mask 裁剪可视区；
 *  - 手动维护 scrollY，pointer 拖动改变 scrollY；
 *  - 「按下后拖动超过阈值」视为滚动，「按下后几乎不动就松开」视为点选启动关卡。
 */
export class MenuScene extends Phaser.Scene {
  static KEY = 'MenuScene';

  private cfg!: GameConfig;

  constructor() {
    super(MenuScene.KEY);
  }

  create() {
    this.cfg = (this.game.registry.get('cfg') as GameConfig) ?? (this.game as any).cfg;
    const { width, height } = this.scale;

    // 调试用：?autostart=1 直接进第 N 关（验收用）
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('autostart') === '1') {
      this.scene.start('GameScene', { levelId: Number(qs.get('level')) || 1 });
      return;
    }

    this.cameras.main.setBackgroundColor('#000000');

    // 背景
    const bg = this.add.image(width / 2, height / 2, 'bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.6);
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);

    const unlocked = getUnlockedLevel();

    // 标题
    this.add
      .text(width / 2, height * 0.075, '广告', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '28px',
        color: '#ff2bd6',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.125, '关不完了！', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '44px',
        color: '#00f0ff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // 玩法一句话
    this.add
      .text(width / 2, height * 0.185, '在时间内关掉全部广告 · 别点假×  · 别让手机没电', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '15px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    // 第 X/10 关提示
    this.add
      .text(width / 2, height * 0.212, `关卡 · 共 ${LEVELS.length} 关 · 可上下滑动查看`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9d4dff',
      })
      .setOrigin(0.5);

    // ---- 可滚动关卡列表 ----
    const listTopY = height * 0.255; // 列表可视区顶（留标题/提示）
    const listBottomY = height * 0.92; // 列表可视区底（留底部署名带）
    const viewH = listBottomY - listTopY;
    const cardW = Math.min(560, width * 0.86);
    const cardH = 96;
    const gap = 14;
    const contentH = LEVELS.length * cardH + (LEVELS.length - 1) * gap;
    const maxScroll = Math.max(0, contentH + 8 - viewH);

    // 裁剪 mask：只显示可视区矩形内的卡片
    const clip = this.add.graphics();
    clip.fillStyle(0xffffff, 1);
    clip.fillRect(0, listTopY - cardH / 2, width, viewH + cardH);
    const mask = clip.createGeometryMask();

    // 关卡状态徽标：绿色对勾已过 / 青色「▶」当前可选最高未过 / 锁未解锁
    const mkBadge = (card: Phaser.GameObjects.Container, cx: number, cy: number, status: 'done' | 'cur' | 'lock') => {
      if (status === 'lock') {
        const t = this.add.text(cx, cy, '🔒', {
          fontFamily: 'monospace',
          fontSize: '30px',
        }).setOrigin(0.5);
        card.add(t);
        return;
      }
      const s = status === 'done';
      const g = this.add.graphics();
      g.fillStyle(s ? 0x00ff80 : 0x00f0ff, s ? 0.2 : 0.25);
      g.fillCircle(0, 0, 24);
      g.lineStyle(3, s ? 0x00ff80 : 0x00f0ff, 1);
      g.strokeCircle(0, 0, 24);
      card.add(g);
      const t = this.add.text(0, 0, s ? '✓' : '▶', {
        fontFamily: 'monospace',
        fontStyle: 'bold',
        fontSize: s ? '28px' : '22px',
        color: s ? '#00ff80' : '#00f0ff',
      }).setOrigin(0.5);
      card.add(t);
    };

    interface CardRec {
      card: Phaser.GameObjects.Container;
      levelId: number;
      unlocked: boolean;
    }
    const cards: CardRec[] = [];

    for (let i = 0; i < LEVELS.length; i++) {
      const lv = LEVELS[i];
      const isUnlocked = lv.id <= unlocked;
      const isCur = lv.id === unlocked;

      const c = this.add.container(width / 2, 0); // y 由 scroll 每帧决定
      c.setMask(mask);

      // 卡片底
      const r = this.add.rectangle(
        0,
        0,
        cardW,
        cardH,
        isUnlocked ? 0x14082a : 0x1a1a22,
        isUnlocked ? 1 : 0.72,
      );
      r.setStrokeStyle(isUnlocked ? 3 : 2, isUnlocked ? 0x00f0ff : 0x444444, isUnlocked ? 1 : 0.5);
      c.add(r);

      // 第 X 关 · 名称（左对齐，两行首行）
      c.add(
        this.add
          .text(-cardW / 2 + 24, -cardH / 2 + 22, `第${lv.id}关  ${lv.name}`, {
            fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
            fontStyle: 'bold',
            fontSize: '24px',
            color: isUnlocked ? '#00f0ff' : '#777777',
          })
          .setOrigin(0, 0.5),
      );
      // 描述（第二行）—— 限宽到右侧徽标之前，避免被对勾/锁遮字
      const descMaxW = cardW - 48 - 56; // 左 24 边距 + 徽标占位 56
      c.add(
        this.add
          .text(-cardW / 2 + 24, cardH / 2 - 22, `${lv.description} · ${lv.roundSeconds}s`, {
            fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
            fontSize: '15px',
            color: isUnlocked ? '#dddddd' : '#666666',
            wordWrap: { width: descMaxW },
          })
          .setOrigin(0, 0.5),
      );
      // 右侧状态徽标
      mkBadge(c, cardW / 2 - 34, 0, isUnlocked ? (lv.id < unlocked ? 'done' : 'cur') : 'lock');

      // 未解锁卡片也支持手型标识不点亮，解锁卡片可悬停高亮
      c.setInteractive(
        new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH),
        Phaser.Geom.Rectangle.Contains,
      );
      if (isUnlocked) {
        c.on('pointerover', () => {
          r.setFillStyle(0x2a0a4a, 1);
          r.setStrokeStyle(4, 0x00f0ff, 1);
          c.setScale(1.02);
        });
        c.on('pointerout', () => {
          r.setFillStyle(0x14082a, 1);
          r.setStrokeStyle(3, 0x00f0ff, 1);
          c.setScale(1);
        });
      }

      cards.push({ card: c, levelId: lv.id, unlocked: isUnlocked });
    }

    // 底部署名（在列表 mask 之外，先画即可）
    this.add
      .text(width / 2, height * 0.96, '进度自动保存 · 老人防骗 · 戏仿', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9d4dff',
      })
      .setOrigin(0.5);

    // ---- 滚动逻辑（拖动/点选区分） ----
    let scrollY = 0;
    let dragging = false;
    let moved = 0;
    let pressY = 0;
    let scrollStartY = 0;
    let downCardId: number | null = null;

    const layoutCards = () => {
      for (let i = 0; i < cards.length; i++) {
        const baseY = listTopY + i * (cardH + gap);
        cards[i].card.y = baseY - scrollY;
      }
    };
    layoutCards();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragging = true;
      moved = 0;
      pressY = p.y;
      scrollStartY = scrollY;
      downCardId = null;
      // 点到了哪张已解锁的卡片（用当前 layout 下的几何判断）
      for (let i = 0; i < cards.length; i++) {
        const rec = cards[i];
        if (!rec.unlocked) continue;
        const cx = width / 2;
        const cy = listTopY + i * (cardH + gap) - scrollY;
        if (
          p.x >= cx - cardW / 2 &&
          p.x <= cx + cardW / 2 &&
          p.y >= cy - cardH / 2 &&
          p.y <= cy + cardH / 2
        ) {
          downCardId = rec.levelId;
          break;
        }
      }
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      const dy = p.y - pressY;
      moved = Math.max(moved, Math.abs(dy));
      // 出现明显位移 → 视为滚动，滚动量 = 起始 scrollY - 手指位移
      const target = scrollStartY - dy;
      scrollY = Phaser.Math.Clamp(target, 0, maxScroll);
      layoutCards();
    });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!dragging) return;
      dragging = false;
      // 几乎没动 → 视为点击该卡片，启动关卡
      if (moved <= 10 && downCardId !== null) {
        this.startGame(downCardId);
      }
    });
  }

  private startGame(levelId: number) {
    this.cameras.main.flash(120, 255, 43, 214, false);
    this.scene.start('GameScene', { levelId });
  }
}
