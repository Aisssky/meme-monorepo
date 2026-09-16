import Phaser from 'phaser';

/**
 * 像素爱心绘制工具。
 *
 * HUD 的「三颗心」、占屏幕道具（回血）都用这里生成的纹理，风格与局内像素背景同源，
 * 且完全由代码绘制 —— 不额外消耗生图积分，也不需要新增 CDN 素材。
 *
 * 心形采用 7×6 的像素网格（经典像素心轮廓，比 5×4 更易辨认）：
 *   .##.##.
 *   #######
 *   #######
 *   .#####.
 *   ..###..
 *   ...#...
 */
const HEART_PATTERN = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
const COLS = 7;
const ROWS = 6;

/** HUD 用心的单个像素边长 */
export const HEART_CELL_HUD = 6;
/** 道具爱心的单个像素边长 */
export const HEART_CELL_ITEM = 11;

export const TEX_HEART_FULL = 'px_heart_full';
export const TEX_HEART_EMPTY = 'px_heart_empty';
export const TEX_HEART_ITEM = 'px_heart_item';

export interface HeartPalette {
  main: number;
  /** 左上角高光像素（可选） */
  highlight?: number;
  /** 外轮廓颜色与宽度（像素） */
  outline?: number;
  outlineWidth?: number;
}

const PALETTE_FULL: HeartPalette = {
  main: 0xff2b6b,
  highlight: 0xff9ec4,
  outline: 0xffffff,
  outlineWidth: 1,
};

const PALETTE_EMPTY: HeartPalette = {
  main: 0x3d2c48,
  outline: 0x6c5a78,
  outlineWidth: 1,
};

const PALETTE_ITEM: HeartPalette = {
  main: 0xff2b6b,
  highlight: 0xff9ec4,
  outline: 0xffffff,
  outlineWidth: 2,
};

/** 心形纹理的像素尺寸（含 padding 与描边余量）。 */
export function heartTextureSize(cell: number, outlineWidth = 1) {
  const pad = outlineWidth + 3;
  return { width: COLS * cell + pad * 2, height: ROWS * cell + pad * 2 };
}

function paintHeart(scene: Phaser.Scene, key: string, cell: number, pal: HeartPalette) {
  const ow = pal.outlineWidth ?? 0;
  const { width, height } = heartTextureSize(cell, ow);
  const pad = ow + 3;
  const tex = scene.textures.createCanvas(key, width, height);
  if (!tex) return null;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, width, height);

  const cells: Array<{ x: number; y: number }> = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (HEART_PATTERN[r][c] !== '#') continue;
      cells.push({ x: pad + c * cell, y: pad + r * cell });
    }
  }

  // 先画放大版轮廓，再用主体色覆盖 → 只在心的最外圈留下描边，内部像素彼此紧贴无缝
  if (pal.outline !== undefined && ow > 0) {
    ctx.fillStyle = `#${pal.outline.toString(16).padStart(6, '0')}`;
    for (const p of cells) {
      ctx.fillRect(p.x - ow, p.y - ow, cell + ow * 2, cell + ow * 2);
    }
  }

  ctx.fillStyle = `#${pal.main.toString(16).padStart(6, '0')}`;
  for (const p of cells) {
    ctx.fillRect(p.x, p.y, cell, cell);
  }

  if (pal.highlight !== undefined) {
    ctx.fillStyle = `#${pal.highlight.toString(16).padStart(6, '0')}`;
    // 左上两个像素做高光，让像素心有一点体积感（坐标必须落在图案的 '#' 上）
    ctx.fillRect(pad + 1 * cell, pad + 1 * cell, cell, cell);
    ctx.fillRect(pad + 2 * cell, pad + 1 * cell, cell, cell);
  }

  tex.refresh();
  return tex;
}

/** 确保三份心形纹理已生成（幂等）。 */
export function ensureHeartTextures(scene: Phaser.Scene) {
  if (scene.textures.exists(TEX_HEART_FULL)) return;
  paintHeart(scene, TEX_HEART_FULL, HEART_CELL_HUD, PALETTE_FULL);
  paintHeart(scene, TEX_HEART_EMPTY, HEART_CELL_HUD, PALETTE_EMPTY);
  paintHeart(scene, TEX_HEART_ITEM, HEART_CELL_ITEM, PALETTE_ITEM);
}

/**
 * 掉心演出：从 (x, y) 炸开一撮像素碎片。
 * 用于 HUD 上某颗心被扣掉时，以及生命归零的结算瞬间。
 */
export function heartBreak(scene: Phaser.Scene, x: number, y: number, scale = 1) {
  const shards: Phaser.GameObjects.Rectangle[] = [];
  const cell = 5 * scale;
  // 按 7×6 图案取一撮像素点（坐标含在图案的 '#' 内，避免飞出图案外）
  const positions: Array<[number, number]> = [
    [1, 0],
    [4, 0],
    [0, 1],
    [3, 1],
    [6, 1],
    [1, 2],
    [5, 2],
    [2, 3],
    [4, 4],
    [3, 5],
  ];
  for (const [c, r] of positions) {
    const s = scene.add.rectangle(x + (c - 3) * cell, y + (r - 2.5) * cell, cell, cell, 0xff2b6b, 1);
    s.setDepth(1200);
    shards.push(s);
  }
  shards.forEach((s, i) => {
    const angle = (i / shards.length) * Math.PI * 2 + Phaser.Math.FloatBetween(-0.3, 0.3);
    const dist = Phaser.Math.Between(30, 70) * scale;
    scene.tweens.add({
      targets: s,
      x: s.x + Math.cos(angle) * dist,
      y: s.y + Math.sin(angle) * dist + Phaser.Math.Between(10, 40),
      angle: Phaser.Math.Between(-180, 180),
      alpha: 0,
      scale: 0.4,
      duration: Phaser.Math.Between(380, 620),
      ease: 'Quad.easeOut',
      onComplete: () => s.destroy(),
    });
  });
}
