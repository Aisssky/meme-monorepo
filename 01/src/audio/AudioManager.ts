import type Phaser from 'phaser';
import type { GameConfig } from '../types';

/**
 * 音频键名：同时作为 config.json 字段名与 Phaser 音频缓存 key。
 * BGM 来自 bgm/ 桶，SFX 来自 sfx/ 桶（见 .claude/skills/game-audio 参考清单）。
 */
export const AUDIO = {
  bgm: 'bgm_main',
  adClose: 'sfx_ad_close',
  success: 'sfx_success',
  fail: 'sfx_fail',
  fakeClose: 'sfx_fake_close',
  click: 'sfx_click',
} as const;

function cfgOf(scene: Phaser.Scene): GameConfig {
  return (scene.game.registry.get('cfg') as GameConfig) ?? (scene.game as any).cfg;
}

/** 从 config 取出所有可加载的音频条目（key + url）。 */
export function audioLoadList(cfg: GameConfig): { key: string; url: string }[] {
  const keys: (keyof GameConfig)[] = [
    'bgm_main',
    'sfx_ad_close',
    'sfx_success',
    'sfx_fail',
    'sfx_fake_close',
    'sfx_click',
  ];
  const out: { key: string; url: string }[] = [];
  for (const k of keys) {
    const v = cfg[k];
    if (typeof v === 'string' && v) out.push({ key: k, url: v });
  }
  return out;
}

/** 循环播放背景音乐（在 GameScene 内调用，场景关闭时自动停止，不会泄漏到结算页）。 */
export function playBgm(scene: Phaser.Scene, key: string = AUDIO.bgm, volume = 0.5) {
  const c = cfgOf(scene) as any;
  if (c.audio_music_enabled === false) return;
  const url = c[key];
  if (!url) return;
  try {
    if (typeof scene.sound.isPlaying === 'function' && scene.sound.isPlaying(key)) return;
    scene.sound.play(key, { loop: true, volume });
  } catch {
    /* 音频不可用（无设备 / 未解锁）时静默降级 */
  }
}

/** 触发一次性短音效。 */
export function playSfx(scene: Phaser.Scene, key: string, volume = 0.85) {
  const c = cfgOf(scene) as any;
  if (c.audio_sfx_enabled === false) return;
  const url = c[key];
  if (!url) return;
  try {
    scene.sound.play(key, { volume });
  } catch {
    /* 同上 */
  }
}

/**
 * Phaser 在没有可用音频设备 / 浏览器尚未解锁 AudioContext 时会退化成
 * `NoAudioSoundManager`——它**没有 `stop()`**（只有 `stopByKey`），
 * 直接调 `stop(key)` 会在场景 shutdown 时抛出 `xxx.stop is not a function`。
 * 这里统一走 `stopByKey` 并做能力探测，任何异常都吞掉，绝不让音频拖垮场景切换。
 */
export function stopAudio(scene: Phaser.Scene, key: string) {
  try {
    const sm = scene.sound as unknown as {
      isPlaying?: (k: string) => boolean;
      stopByKey?: (k: string) => void;
      stop?: (k: string) => void;
    };
    if (!sm) return;
    if (typeof sm.isPlaying === 'function' && !sm.isPlaying(key)) return;
    if (typeof sm.stopByKey === 'function') sm.stopByKey(key);
    else if (typeof sm.stop === 'function') sm.stop(key);
  } catch {
    /* 无音频设备等场景：静默忽略 */
  }
}
