import Phaser from 'phaser';
import { getUnlockedLevel, MAX_LEVEL } from '../data/levels';
import { playSfx, AUDIO } from '../audio/AudioManager';

/**
 * 标题页：游戏入口。
 *  - 大标题居上，主行动「开始游戏」放在下半拇指安全区（不遮挡中央舞台）；
 *  - 若有进度，「继续 · 第 N 关」直接跳到已解锁的最高关（与实际存档同步）；
 *  - 触控目标远大于 44px，按下有回弹反馈。
 * 点击「开始游戏」进入选关页（MenuScene）。
 */
export class TitleScene extends Phaser.Scene {
  static KEY = 'TitleScene';

  constructor() {
    super(TitleScene.KEY);
  }

  create() {
    const { width, height } = this.scale;

    // 调试/验收：?autostart=1&level=N 直接进第 N 关（跳过标题与选关）
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('autostart') === '1') {
      this.scene.start('GameScene', { levelId: Number(qs.get('level')) || 1 });
      return;
    }

    this.cameras.main.setBackgroundColor('#000000');

    // 背景（压暗，留出清晰的前景 UI 层级）
    const bg = this.add.image(width / 2, height / 2, 'bg');
    bg.setDisplaySize(width, height);
    bg.setAlpha(0.5);
    this.add.rectangle(width / 2, height / 2, width, height, 0x05010f, 0.55);

    // 标题（上区，避免占用下方按钮安全区）
    const title = this.add
      .text(width / 2, height * 0.17, '广告关不完了！', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontStyle: 'bold',
        fontSize: '58px',
        color: '#ff2bd6',
        stroke: '#000000',
        strokeThickness: 7,
      })
      .setOrigin(0.5);
    const sub = this.add
      .text(width / 2, height * 0.265, '我的手机不可能这么多广告！？', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '24px',
        color: '#00f0ff',
      })
      .setOrigin(0.5);
    const hint = this.add
      .text(width / 2, height * 0.36, '倒计时内关掉全部广告 · 别点假× · 别让手机没电', {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setAlpha(0.85);

    // 标题入场：淡入 + 轻微下落
    title.setAlpha(0).setY(height * 0.15);
    sub.setAlpha(0);
    hint.setAlpha(0);
    this.tweens.add({ targets: [title, sub, hint], alpha: 1, duration: 380, ease: 'Quad.out' });
    this.tweens.add({ targets: title, y: height * 0.17, duration: 420, ease: 'Back.out' });

    const unlocked = getUnlockedLevel();

    // 主按钮：开始游戏 → 选关页
    this.makeButton(
      width / 2,
      height * 0.62,
      384,
      88,
      '开 始 游 戏',
      () => this.go('MenuScene'),
      true,
    );

    // 次按钮：继续到已解锁的最高关（与实际存档同步）
    if (unlocked > 1) {
      this.makeButton(
        width / 2,
        height * 0.74,
        384,
        76,
        `继 续 · 第${unlocked}关`,
        () => this.go('GameScene', { levelId: unlocked }),
        false,
      );
    }

    // 底部信息（不挡中央舞台）
    this.add
      .text(width / 2, height * 0.93, `已解锁第 ${unlocked} / ${MAX_LEVEL} 关 · 进度自动保存`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#9d4dff',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.965, '老人防骗 · 戏仿', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#666666',
      })
      .setOrigin(0.5);
  }

  /** 带淡出转场的场景切换（避免 delayedCall 在场景关闭后失效）。 */
  private go(key: string, data?: object) {
    this.cameras.main.fadeOut(160, 5, 1, 15);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(key, data);
    });
  }

  /** 统一触控按钮：圆角矩形 + 文字，按下回弹 94%，悬停高亮。 */
  private makeButton(
    cx: number,
    cy: number,
    w: number,
    h: number,
    label: string,
    onClick: () => void,
    primary: boolean,
  ) {
    const fill = primary ? 0x14082a : 0x1a0a2a;
    const stroke = primary ? 0x00f0ff : 0x9d4dff;
    const txtColor = primary ? '#00f0ff' : '#ffffff';
    const fontSize = primary ? '34px' : '26px';

    const r = this.add
      .rectangle(cx, cy, w, h, fill, 1)
      .setStrokeStyle(primary ? 4 : 2, stroke, 1)
      .setInteractive({ useHandCursor: true });
    const t = this.add
      .text(cx, cy, label, {
        fontFamily: '"Microsoft YaHei","PingFang SC",sans-serif',
        fontStyle: 'bold',
        fontSize,
        color: txtColor,
      })
      .setOrigin(0.5);

    r.on('pointerover', () => r.setFillStyle(0x2a0a4a, 1));
    r.on('pointerout', () => {
      r.setFillStyle(fill, 1);
      r.setScale(1);
      t.setScale(1);
    });
    r.on('pointerdown', () => {
      playSfx(this, AUDIO.click);
      r.setScale(0.94);
      t.setScale(0.94);
    });
    r.on('pointerup', () => {
      r.setScale(1);
      t.setScale(1);
      onClick();
    });
  }
}
