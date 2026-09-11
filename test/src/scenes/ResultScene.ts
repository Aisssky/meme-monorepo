import Phaser from 'phaser';
import type { GameConfig, LevelDef, ScoreSnapshot } from '../types';
import { MAX_LEVEL } from '../data/levels';
import { playSfx, AUDIO } from '../audio/AudioManager';

interface ResultData {
  snapshot: ScoreSnapshot;
  level?: LevelDef;
  adsTotal?: number;
  remainingAds?: number;
  winBonus?: number;
  timeBonus?: number;
  reason?: 'battery' | 'timeout' | 'win';
}

export class ResultScene extends Phaser.Scene {
  static KEY = 'ResultScene';

  private cfg!: GameConfig;
  private rd!: ResultData;

  constructor() {
    super(ResultScene.KEY);
  }

  init(data: ResultData) {
    this.rd = data;
  }

  create() {
    this.cfg = (this.game.registry.get('cfg') as GameConfig) ?? (this.game as any).cfg;
    const { width, height } = this.scale;
    const { snapshot, level, adsTotal = 10, remainingAds = 0, winBonus = 0, timeBonus = 0 } =
      this.rd;
    const win = snapshot.survived;
    const lv = level ?? { id: 1, name: '', title: '' } as LevelDef;
    const reason = this.rd.reason ?? (win ? 'win' : 'battery');

    this.cameras.main.setBackgroundColor('#000');

    // 背景
    const bg = this.add.image(width / 2, height / 2, 'bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.5);
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0418, 0.6);

    // 标题
    this.add
      .text(width / 2, height * 0.13, win ? lv.title : '本关失败', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontStyle: 'bold',
        fontSize: '60px',
        color: win ? '#00f0ff' : '#ff2bd6',
        stroke: '#000',
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    // 副标题（胜负原因）
    const sub =
      win
        ? `第${lv.id}关 · 清掉了全部 ${adsTotal} 条广告`
        : reason === 'timeout'
          ? `时间到！还有 ${remainingAds} 条广告没收`
          : '电量耗尽，手机关机了…';
    this.add
      .text(width / 2, height * 0.23, sub, {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '26px',
        color: '#ffffff',
        align: 'center',
      })
      .setOrigin(0.5);

    // 结算卡
    const cardX = width / 2;
    const cardY = height * 0.48;
    const cardW = 540;
    const cardH = 230;
    const g = this.add.graphics();
    g.fillStyle(0x10041f, 0.95);
    g.fillRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 16);
    g.lineStyle(3, win ? 0x00f0ff : 0xff2bd6, 1);
    g.strokeRoundedRect(cardX - cardW / 2, cardY - cardH / 2, cardW, cardH, 16);

    const lines = [
      `正确关闭广告：${snapshot.correctCloses} / ${adsTotal}`,
      `误点假×：${snapshot.fakeClicks} 次`,
      `收集道具：${snapshot.itemsCollected} 个`,
      `剩余电量：${snapshot.finalBattery.toFixed(1)}%`,
      `得分：${snapshot.score}`,
    ];
    const txt = this.add.text(cardX, cardY - 10, lines.join('\n'), {
      fontFamily: '"Microsoft YaHei","PingFang SC",monospace',
      fontSize: '23px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 12,
    });
    txt.setOrigin(0.5);

    // 通关奖励明细
    if (win) {
      this.add
        .text(cardX, cardY + cardH / 2 + 4, `通关 +${winBonus} · 剩余时间 +${timeBonus}`, {
          fontFamily: '"Microsoft YaHei","PingFang SC",monospace',
          fontStyle: 'bold',
          fontSize: '20px',
          color: '#00ff80',
        })
        .setOrigin(0.5);
    }

    // 按钮：对称两列
    const hasNext = win && (lv.id ?? 1) < MAX_LEVEL;
    const btnW = 280;
    const leftX = width / 2 - 160;
    const rightX = width / 2 + 160;
    const btnCY = height * 0.84;
    const mkBtn = (bx: number, label: string, cb: () => void, primary = false) => {
      const b = this.add
        .rectangle(bx, btnCY, btnW, 80, primary ? 0x14082a : 0x1a0a2a, 1)
        .setStrokeStyle(primary ? 4 : 2, primary ? 0x00f0ff : 0x9d4dff, 1)
        .setInteractive({ useHandCursor: true });
      this.add
        .text(bx, btnCY, label, {
          fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
          fontStyle: 'bold',
          fontSize: primary ? '32px' : '26px',
          color: primary ? '#00f0ff' : '#ffffff',
        })
        .setOrigin(0.5);
      b.on('pointerover', () => b.setFillStyle(0x2a0a4a, 1));
      b.on('pointerout', () => b.setFillStyle(primary ? 0x14082a : 0x1a0a2a, 1));
      b.on('pointerdown', () => {
        playSfx(this, AUDIO.click);
        cb();
      });
    };

    const goLevel = (id: number) => {
      this.cameras.main.flash(120, 255, 43, 214, false);
      this.scene.start('GameScene', { levelId: id });
    };

    if (win && hasNext) {
      // 左：再玩本关；右：下一关（主）
      mkBtn(leftX, '再 玩 本 关', () => goLevel(lv.id!), false);
      mkBtn(rightX, '下 一 关', () => goLevel((lv.id ?? 1) + 1), true);
    } else if (win && !hasNext) {
      // 最后一关通关：左选关，右庆祝按钮回玩
      mkBtn(leftX, '选 关', () => this.scene.start('MenuScene'), false);
      mkBtn(rightX, '再 玩 一 遍', () => goLevel(lv.id!), true);
    } else {
      // 失败：左选关，右再试本关（主）
      mkBtn(leftX, '选 关', () => this.scene.start('MenuScene'), false);
      mkBtn(rightX, '再 试 一 次', () => goLevel(lv.id!), true);
    }
  }
}
