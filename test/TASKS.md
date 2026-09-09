# 游戏开发任务列表

- [x] T001 [决策任务 · 开发者] 确定玩法方向：老人查手机触屏 vs 流氓弹窗 戏仿
- [x] T002 [生成任务 · Agent] 生成 9 张弹窗/道具/背景图标并通过 TOS 公开（URL 已写入 config.json）
- [x] T003 [生成任务 · Agent] 搭建 Vite+Phaser+TS 工程骨架（main.ts / scenes / data / public/config.json）
- [x] T004 [生成任务 · Agent] 实现 PreloadScene / MenuScene / GameScene / ResultScene
- [x] T005 [生成任务 · Agent] public/config.json 暴露玩法参数（电量、掉电、奖励、生成节奏等）
- [x] T006 [生成任务 · Agent] `npm run build` 输出 dist/ 1.5MB 单 chunk
- [x] T007 [细节调整任务 · 开发者] 修复启动崩溃：把 `?autostart=1` 处理从 main.ts 移到 MenuScene.create() —— 原代码在 scene 未入列时访问 `preloadScene.events.once` 抛 TypeError
- [x] T008 [细节调整任务 · 开发者] 修复 PowerItem 显示尺寸 bug：`setScale(0.4)` 在 1024×1024 贴图上覆盖了 `setDisplaySize(110,110)`，导致电池/闪电道具占满整个屏幕。现改成在 tween 中按贴图原生宽计算 targetScale，销毁/缩回 tween 也用 `from->to` 相对值
- [x] T009 [生成任务 · Agent] 修复后 `npm run build` + `tsc --noEmit` 通过；用 Chrome DevTools Protocol + headless 验证 menu / autostart / gameplay / result 路径全部正常加载，远程 9 张图全部 200 OK
- [x] T010 [细节调整任务 · 开发者] MemeSkill 发布前检查：viewport / 全屏 / config schema / 相对路径 / dist 独立部署 全部满足（FIT 模式 + 100dvh + base=./ + config 在 dist/）；门禁：dist 全文本零二进制、无本地绝对路径、封面 URL 200 OK
- [x] T011 [细节调整任务 · 开发者] 通过 memeskill_submit_game_code 完成提交 → thread_id 54517157-56b8-434d-a686-172a4b807c4b / checkpoint 1f1ac3ed-ee7a-6f7d-8001-90fc173bc829（18 文件）；T012 修复后二次覆盖 checkpoint 1f1ac41e-88ec-69a3-8002-c21ade493b2d
- [x] T012 [细节调整任务 · 开发者] 修复真×/假×点击不响应：原代码 `makeCloseButton` 返回的 Container 没有 setInteractive，Phaser 不会把 pointer 事件派发给该容器，导致 `container.on('pointerdown')` 永不触发。修复：给按钮 container 自身 `setInteractive(new Geom.Rectangle(-w/2,-h/2,w,h), Contains)` 并 `setDepth(20)`。同步把覆盖全卡的透明 `bounds` 矩形改为自定义命中（排除左右上角按钮区域），避免盖在按钮上层。CDP 验证：`p.trueBtn.emit('pointerdown')` 后 correctCloses 1→，popups -1，监听链路通畅。

