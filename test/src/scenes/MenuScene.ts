import Phaser from 'phaser';
import type { GameConfig } from '../types';
import { LEVELS, MAX_LEVEL, getUnlockedLevel } from '../data/levels';

/**
 * 开始界面：关卡选择（逐关解锁）+ 极简玩法提示。
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

    // 调试用：?autostart=1 直接进第 1 关（验收用）
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
      .text(width / 2, height * 0.09, '广告', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '34px',
        color: '#ff2bd6',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.15, '关不完了！', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '52px',
        color: '#00f0ff',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // 玩法一句话
    this.add
      .text(width / 2, height * 0.22, '在时间内关掉全部广告 · 别点假×  · 别让手机没电', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '17px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    // 关卡卡片（竖屏一列，最多 MAX_LEVEL 张）
    const listTopY = height * 0.29;
    const cardH = Math.min(96, (height - listTopY - 40) / LEVELS.length);
    const cardGap = 16;
    const cardW = Math.min(460, width * 0.82);

    for (let i = 0; i < LEVELS.length; i++) {
      const lv = LEVELS[i];
      const isUnlocked = lv.id <= unlocked;
      const isLastUnlocked = lv.id === unlocked;
      const cardY = listTopY + i * (cardH + cardGap);

      // 卡片
      const card = this.add
        .rectangle(width / 2, cardY, cardW, cardH, isUnlocked ? 0x14082a : 0x1a1a22, isUnlocked ? 1 : 0.7)
        .setStrokeStyle(isUnlocked ? 3 : 2, isUnlocked ? 0x00f0ff : 0x444444, isUnlocked ? 1 : 0.5)
        .setInteractive(isUnlocked ? { useHandCursor: true } : undefined);

      // 关号 + 名称
      this.add
        .text(
          width / 2 - cardW / 2 + 20,
          cardY - (isUnlocked ? 14 : 10),
          `第${lv.id}关  ${lv.name}`,
          {
            fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
            fontStyle: 'bold',
            fontSize: '24px',
            color: isUnlocked ? '#00f0ff' : '#777777',
          },
        )
        .setOrigin(0, 0.5);

      // 描述（目标条数）
      this.add
        .text(
          width / 2 - cardW / 2 + 20,
          cardY + (isUnlocked ? 22 : 26),
          `${lv.description} · ${lv.roundSeconds}s`,
          {
            fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
            fontSize: '15px',
            color: isUnlocked ? '#dddddd' : '#666666',
          },
        )
        .setOrigin(0, 0.5);

      if (!isUnlocked) {
        // 锁
        this.add
          .text(width / 2 + cardW / 2 - 26, cardY, '🔒', {
            fontFamily: 'monospace',
            fontSize: '28px',
          })
          .setOrigin(0.5);
      } else {
        // 完成标记：已通关的关（非当前最高）右上角勾
        if (!isLastUnlocked && lv.id < unlocked) {
          this.add
            .text(width / 2 + cardW / 2 - 26, cardY, '✓', {
              fontFamily: 'monospace',
              fontSize: '30px',
              color: '#00ff80',
            })
            .setOrigin(0.5);
        }
        const startLevel = lv.id;
        card.on('pointerover', () => {
          card.setFillStyle(0x2a0a4a, 1);
          card.setScale(1.02);
        });
        card.on('pointerout', () => {
          card.setFillStyle(0x14082a, 1);
          card.setScale(1);
        });
        card.on('pointerdown', () => this.startGame(startLevel));
      }
    }

    // 底部署名
    this.add
      .text(width / 2, height * 0.955, '进度自动保存 · 老人防骗 · 戏仿', {
        fontFamily: 'monospace',
        fontSize: '15px',
        color: '#9d4dff',
      })
      .setOrigin(0.5);
  }

  private startGame(levelId: number) {
    this.cameras.main.flash(120, 255, 43, 214, false);
    this.scene.start('GameScene', { levelId });
  }
}
