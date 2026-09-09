import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import type { GameConfig } from './types';

/**
 * 启动 Phaser 游戏。
 * 1. 拉取运行时 config.json
 * 2. 把所有图片 URL 注入 PreloadScene
 * 3. 启动 PreloadScene → MenuScene → GameScene
 */
async function bootstrap() {
  const raw: Record<string, any> = await fetch('./config.json').then((r) => r.json());

  // 把可见参数 (key 不以 _ 开头) 拍平为 key → value 的简单对象，方便 Scene 直接读取
  const flat: Record<string, any> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.startsWith('_')) continue;
    if (v && typeof v === 'object' && 'value' in v) {
      flat[k] = v.value;
    } else {
      flat[k] = v;
    }
  }
  const cfg = flat as unknown as GameConfig;

  // 图片 key 映射
  const imageKeys: Record<string, string> = {
    image_background: 'bg',
    icon_gift: 'ic_gift',
    icon_warning: 'ic_warning',
    icon_rocket: 'ic_rocket',
    icon_castle: 'ic_castle',
    icon_diamond: 'ic_diamond',
    icon_calendar: 'ic_calendar',
    item_battery: 'it_battery',
    item_lightning: 'it_lightning',
  };
  const imageUrls: Record<string, string> = {
    image_background: cfg.image_background,
    icon_gift: cfg.icon_gift,
    icon_warning: cfg.icon_warning,
    icon_rocket: cfg.icon_rocket,
    icon_castle: cfg.icon_castle,
    icon_diamond: cfg.icon_diamond,
    icon_calendar: cfg.icon_calendar,
    item_battery: cfg.item_battery,
    item_lightning: cfg.item_lightning,
  };

  const preloadScene = new PreloadScene();
  preloadScene.imageKeys = imageKeys;
  preloadScene.imageUrls = imageUrls;

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'app',
    backgroundColor: '#000000',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: 720,
      height: 1280,
    },
    scene: [preloadScene, MenuScene, GameScene, ResultScene],
    fps: { target: 60, forceSetTimeOut: false },
    banner: false,
  };

  const game = new Phaser.Game(config);
  // 全局访问 cfg
  (game as any).cfg = cfg;
  game.registry.set('cfg', cfg);
  // 调试/测试用全局句柄（无副作用，便于 CDP 内省与冒烟测试）
  (window as any).__game = game;
}

bootstrap().catch((err) => {
  console.error('[bootstrap] 启动失败', err);
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML =
      '<div style="color:#ff2bd6;font-family:monospace;padding:24px;line-height:1.6">' +
      '游戏启动失败：' +
      String(err) +
      '</div>';
  }
});
