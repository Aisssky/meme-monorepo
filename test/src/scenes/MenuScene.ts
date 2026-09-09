import Phaser from 'phaser';
import type { GameConfig } from '../types';

/**
 * 开始界面：玩法说明 + 开始按钮。
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

    // 调试用：?autostart=1 跳过菜单直接进入游戏（验收后保留无害）
    if (new URLSearchParams(window.location.search).get('autostart') === '1') {
      this.scene.start('GameScene');
      return;
    }

    this.cameras.main.setBackgroundColor('#000000');

    // 背景
    const bg = this.add.image(width / 2, height / 2, 'bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.6);

    // 黑色遮罩
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.55);

    // 标题
    this.add
      .text(width / 2, height * 0.18, '我的手机', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '54px',
        color: '#ff2bd6',
        stroke: '#000000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.27, '不可能这么多广告！？', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '38px',
        color: '#00f0ff',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    // 说明
    const desc = [
      '电量只剩 20%，倒计时 30 秒',
      '点击广告的「×」关闭弹窗 → 回电',
      '点中「假×」 → 加速耗电',
      '收集省电道具 → 大量回电',
    ].join('\n');
    this.add
      .text(width / 2, height * 0.45, desc, {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '22px',
        color: '#ffffff',
        align: 'center',
        lineSpacing: 12,
      })
      .setOrigin(0.5)
      .setAlpha(0.95);

    // 开始按钮
    const startBtn = this.add
      .rectangle(width / 2, height * 0.72, 360, 96, 0x14082a, 1)
      .setStrokeStyle(4, 0x00f0ff, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, height * 0.72, '开 始', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '42px',
        color: '#00f0ff',
        stroke: '#ff2bd6',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    startBtn.on('pointerover', () => startBtn.setFillStyle(0x2a0a4a, 1));
    startBtn.on('pointerout', () => startBtn.setFillStyle(0x14082a, 1));
    startBtn.on('pointerdown', () => this.startGame());

    // 提示
    this.add
      .text(width / 2, height * 0.85, '老人模式·戏仿', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#9d4dff',
      })
      .setOrigin(0.5);
  }

  private startGame() {
    this.cameras.main.flash(120, 255, 43, 214, false);
    this.scene.start('GameScene');
  }
}
