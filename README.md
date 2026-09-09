# Meme Monorepo

**多款 MemeSkill 手机小游戏源码仓库。**

按「根目录下每游戏一个文件夹」平铺组织，每个子文件夹是一个**独立、可自构建自运行**的 Phaser/Three.js 小游戏工程。GitHub 仓库名虽叫 monorepo，但各游戏源码相互独立、无共享 workspace 依赖，clone 后进入任一游戏目录 `npm install && npm run build` 即可。

## 目录

| 目录 | 游戏 | 技术栈 | 状态 |
|------|------|--------|------|
| [`test/`](./test) | 《我的手机不可能这么多广告！？》 | Vite + Phaser 3 + TypeScript | ✅ 已发布 MemeSkill 草稿 |

> 说明：目录名 `test/` 是历史遗留命名，对应游戏《我的手机不可能这么多广告！？》。新游戏建议直接用语义化英文目录名（如 `ad-blocker`、`card-memory` 等）新建文件夹加入。

## 约定

- 每个游戏一个文件夹，含自己的 `package.json` / `src/` / `public/config.json` / `dist/` 构建产物 / `.memeskillignore`（MemeSkill 云提交忽略规则）。
- `node_modules/`、`dist/`、`assets/`、各 IDE 状态目录均被根 `.gitignore` 忽略，不进版本控制（构建产物与图片缓存均可重新生成，类似 UE 的 DDC）。
- 游戏运行时图片素材通过各游戏 `public/config.json` 里的**公开 TOS URL** 引用，本地 `assets/` 只是生成缓存。

## 快速上手（以 test 游戏为例）

```bash
cd test
npm install
npm run dev      # 本地开发
npm run build    # 产出 dist/
```

## 发布到 MemeSkill

在每个游戏目录内完成发布（需 MemeSkill CLI/MCP 与登录态），提交会按该目录的 `.memeskillignore` 收集 `dist/` 等文件并上传。
