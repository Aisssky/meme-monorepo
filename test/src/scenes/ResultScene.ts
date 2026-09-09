import Phaser from 'phaser';
import type { GameConfig, ScoreSnapshot } from '../types';

export class ResultScene extends Phaser.Scene {
  static KEY = 'ResultScene';

  private cfg!: GameConfig;
  private snap!: ScoreSnapshot;

  constructor() {
    super(ResultScene.KEY);
  }

  init(data: { snapshot: ScoreSnapshot }) {
    this.snap = data.snapshot;
  }

  create() {
    this.cfg = this.game.registry.get('cfg') as GameConfig;
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#000');

    // 背景
    const bg = this.add.image(width / 2, height / 2, 'bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.5);
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0418, 0.55);

    const win = this.snap.survived;

    // 大标题
    this.add
      .text(width / 2, height * 0.2, win ? '撑住了！' : '电量耗尽了…', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontStyle: 'bold',
        fontSize: '64px',
        color: win ? '#00f0ff' : '#ff2bd6',
        stroke: '#000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(
        width / 2,
        height * 0.28,
        win ? '广告没把手机弄关机' : '又被广告坑去注册了外卖骑手',
        {
          fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
          fontSize: '26px',
          color: '#ffffff',
        },
      )
      .setOrigin(0.5);

    // 统计卡
    const cardX = width / 2;
    const cardY = height * 0.45;
    const cardW = 520;
    const cardH = 320;
    const g = this.add.graphics();
    g.fillStyle(0x10041f, 0.95);
    g.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 16);
    g.lineStyle(3, 0x00f0ff, 1);
    g.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 16);

    const lines = [
      `最终得分：${this.snap.score}`,
      `关对广告：${this.snap.correctCloses} 个`,
      `误点假×：${this.snap.fakeClicks} 个`,
      `收集道具：${this.snap.itemsCollected} 个`,
      `漏掉道具：${this.snap.itemsMissed} 个`,
      `剩余电量：${this.snap.finalBattery.toFixed(1)}%`,
      `坚持时长：${(this.snap.elapsedMs / 1000).toFixed(1)} 秒`,
    ];
    const txt = this.add.text(cardX, cardY - 20, lines.join('\n'), {
      fontFamily: '"Microsoft YaHei","PingFang SC",monospace',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 12,
    });
    txt.setOrigin(0.5);

    // 完赛奖励
    if (win) {
      this.add
        .text(cardX, cardY + cardH / 2 - 30, `+${this.cfg.score_win_bonus} 完赛奖励`, {
          fontFamily: '"Microsoft YaHei","PingFang SC",monospace',
          fontStyle: 'bold',
          fontSize: '26px',
          color: '#00ff80',
        })
        .setOrigin(0.5);
    }

    // 再来一局
    const btnY = height * 0.82;
    const btn = this.add
      .rectangle(width / 2, btnY, 360, 96, 0x14082a, 1)
      .setStrokeStyle(4, 0x00f0ff, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(width / 2, btnY, '再 来 一 局', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontStyle: 'bold',
        fontSize: '40px',
        color: '#00f0ff',
        stroke: '#ff2bd6',
        strokeThickness: 2,
      })
      .setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0x2a0a4a, 1));
    btn.on('pointerout', () => btn.setFillStyle(0x14082a, 1));
    btn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
  }
}
