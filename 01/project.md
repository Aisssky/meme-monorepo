# 《我的手机不可能这么多广告！？》策划案

## 概述
竖屏触屏休闲反应游戏。玩家扮演一部被流氓广告劫持的智能手机，在 30 秒倒计时和 20% 起手电量下，
通过正确点击广告弹窗的「×」按钮回电、躲避假×陷阱、顺手捡省电道具，撑到时间结束。

## 核心循环
1. 屏幕随机位置生成广告弹窗卡片（6 种类型：限时福利 / 安全警告 / 内存清理 / 新世界开启 / 幸运转盘 / 每日签到）
2. 弹窗同时放置「真×」（青）和「假×」（紫粉/陷阱）
3. 玩家在 30s 内点击真×回电 + 加分；点假× 扣电 + 扣分
4. 屏幕上偶尔出现省电道具（电池 / 闪电），点击回电 + 加时
5. 倒计时结束则胜利（完赛奖励），电量耗尽则失败

## 胜负
- **胜利**：30 秒内电量未耗尽 + score_win_bonus 加分
- **失败**：电量提前归零

## 视觉风格
- 复古赛博朋克霓虹：深紫底（#0a0418）+ 霓虹青（#00f0ff）+ 霓虹紫粉（#ff2bd6）
- 弹窗卡片：圆角矩形 + 霓虹描边 + 紫粉 CTA + 戏仿中文广告文案
- 弹窗图标使用生成图片（已经过 TOS 上传，config.json 中以 URL 引用）

## 平台要求
- 竖屏 H5，FIT 模式 720×1280 设计稿
- 触控优先，desktop 也支持鼠标
- 发布到 MemeSkill 平台：相对发布基路径（`./`）+ dist/ 独立可部署

## 当前状态（2026-09-09 19:10）
- ✅ 工程结构：Vite + TS + Phaser，main.ts 拉取 config.json 注入 PreloadScene
- ✅ PreloadScene：进度条 + 资源加载
- ✅ MenuScene：标题 + 玩法说明 + 开始按钮 + `?autostart=1` 调试入口
- ✅ GameScene：HUD（电量条 / 倒计时 / 分数 / 统计）+ 弹窗生成 + 真假× 判定 + 道具 + 浮动文字 + 震屏
- ✅ ResultScene：胜负卡 + 再来一局
- ✅ public/config.json：可见参数 + 9 张生成图远程 URL + `_game_cover_url`（封面）
- ✅ 封面：已用 memeskill 生成 1440×2560 竖屏含大字标题封面 → assets/1bebf7d7-....png，TOS URL 200 OK，写入 config `_game_cover_url`
- ✅ dist/ 已构建（1.5MB 单一 chunk，`tsc --noEmit` 干净）
- ✅ 启动崩溃已修复：autostart 处理从 main.ts 移到 MenuScene.create() —— 原代码在 scene 未入列时访问 `preloadScene.events.once` 抛 TypeError，CDP 复现→确认→修复
- ✅ 道具显示 bug 已修复：setScale 不再覆盖 setDisplaySize，电池/闪电按 110×110 显示（之前是 1024×1024 占满屏）
- ✅ 9 张图 + 封面全部 TOS 200 OK（HEAD 全部正常）
- ✅ 浏览器冒烟测试通过：Menu → GameScene → ResultScene 循环正常
- ✅ 已提交 MemeSkill 草稿：thread_id `54517157-56b8-434d-a686-172a4b807c4b` / 首版 checkpoint `1f1ac3ed-ee7a-6f7d-8001-90fc173bc829`；修复真×/假×后二次覆盖提交 checkpoint `1f1ac41e-88ec-69a3-8002-c21ade493b2d`（18 文件）
- ✅ 真×/假× 点击不响应修复：`makeCloseButton` 返回的 Container 之前没有 setInteractive，导致 `container.on('pointerdown')` 永不触发。改为 container 自身 `setInteractive` + `setDepth(20)`，bounds 透明矩形改成排除按钮区。CDP 验证：直接 emit 后监听链路通畅（popups 减少、score++）。已 rebuild + tsc 干净并二次提交覆盖。
