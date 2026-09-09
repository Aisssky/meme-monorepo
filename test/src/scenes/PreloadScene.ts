import Phaser from 'phaser';

/**
 * 加载游戏图片素材。
 * 图片 URL 来自运行时拉取的 config.json。
 */
export class PreloadScene extends Phaser.Scene {
  static KEY = 'PreloadScene';

  /** 由 BootScene 注入 */
  public imageKeys!: Record<string, string>;
  public imageUrls!: Record<string, string>;

  constructor() {
    super(PreloadScene.KEY);
  }

  preload() {
    this.createLoadingUI();

    for (const [key, url] of Object.entries(this.imageUrls)) {
      this.load.image(this.imageKeys[key], url);
    }

    this.load.on('progress', (p: number) => {
      this.progressBar.width = 540 * p;
    });
  }

  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Rectangle;
  private progressBox!: Phaser.GameObjects.Rectangle;

  private createLoadingUI() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor('#000000');

    this.add
      .text(width / 2, height / 2 - 100, 'LOADING', {
        fontFamily: 'monospace',
        fontSize: '40px',
        color: '#00f0ff',
        stroke: '#ff2bd6',
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    this.progressBox = this.add
      .rectangle(width / 2, height / 2, 560, 28, 0x10001a, 0.9)
      .setStrokeStyle(2, 0x00f0ff, 1);
    this.progressBar = this.add
      .rectangle(width / 2 - 276, height / 2, 0, 22, 0x00f0ff, 1)
      .setOrigin(0, 0.5);

    this.loadingText = this.add
      .text(width / 2, height / 2 + 60, '0%', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
  }

  create() {
    this.scene.start('MenuScene');
  }

  update() {
    if (this.load.progress < 1 && this.loadingText) {
      this.loadingText.setText(`${Math.floor(this.load.progress * 100)}%`);
    }
  }
}
