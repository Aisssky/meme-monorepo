import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { TitleScene } from './scenes/TitleScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import type { GameConfig } from './types';
import { audioLoadList } from './audio/AudioManager';

/**
 * 启动 Phaser 游戏。
 * 1. 拉取运行时 config.json
 * 2. 把所有图片 URL 注入 PreloadScene
 * 3. 启动 PreloadScene → TitleScene(标题页) → MenuScene(选关页) → GameScene
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

  // 图片 key 映射（config 中的字段名 → Phaser 贴图 key）
  const imageKeys: Record<string, string> = {
    image_background: 'bg',
    card_shop: 'card_shop',
    card_gamead: 'card_gamead',
    card_scam: 'card_scam',
    card_rogue: 'card_rogue',
    card_redpack: 'card_redpack',
    card_booster: 'card_booster',
    page_shop: 'page_shop',
    page_gamead: 'page_gamead',
    page_scam: 'page_scam',
    page_rogue: 'page_rogue',
    page_redpack: 'page_redpack',
    page_booster: 'page_booster',
  };
  const imageUrls: Record<string, string> = {
    image_background: cfg.image_background,
    card_shop: cfg.card_shop,
    card_gamead: cfg.card_gamead,
    card_scam: cfg.card_scam,
    card_rogue: cfg.card_rogue,
    card_redpack: cfg.card_redpack,
    card_booster: cfg.card_booster,
    page_shop: cfg.page_shop,
    page_gamead: cfg.page_gamead,
    page_scam: cfg.page_scam,
    page_rogue: cfg.page_rogue,
    page_redpack: cfg.page_redpack,
    page_booster: cfg.page_booster,
  };

  const preloadScene = new PreloadScene();
  preloadScene.imageKeys = imageKeys;
  preloadScene.imageUrls = imageUrls;

  // 音频 URL（来自 config.json 的 bgm_*/sfx_* 字段）
  const audioUrls: Record<string, string> = {};
  for (const { key, url } of audioLoadList(cfg)) {
    audioUrls[key] = url;
  }
  preloadScene.audioUrls = audioUrls;

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
    scene: [preloadScene, TitleScene, MenuScene, GameScene, ResultScene],
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
