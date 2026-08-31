# 修复 Enter 换行模式下 Ctrl+Enter 繁忙态直发

## 问题

`dsh-enter-shortcuts` 在「Enter 换行」模式（开关关闭）下，把 **Ctrl/Cmd+Enter** 当成「发送」。上次为适配 Lexical Composer，发送时把原按键的 `ctrlKey`/`metaKey` 原样合成进 `keydown`。

DSH 原生 Composer 的繁忙态语义（agent 思考中）是：

- **Enter** → `resolveSubmitMode(..., 'enter')` → 用设置里的 busy-Enter（默认 **queue** 入队）
- **Ctrl/Cmd+Enter** → `resolveSubmitMode(..., 'accelerated')` → busy-Enter 的反面（默认 **steer** 插话进当前回合）
- 空草稿的 Ctrl+Enter 还会走 `steerQueue()`

所以插件把「发送」映射成带 Ctrl 的 Enter 后，思考中的 Ctrl+Enter 会 **steer 直发**，而不是入队。这是回归：旧 textarea 版发送时强制 `ctrlKey: false`。

## 目标

「Enter 换行」模式下，Ctrl+Enter 的发送必须等价于 **原生普通 Enter**：

- 空闲：发送当前草稿
- Agent 思考中：按 DSH 默认排队语义入队，不插话
- 空草稿：不要触发 `steerQueue()`

「Enter 发送」模式下的 Enter 发送保持同样语义（本来就没有 Ctrl）。

## 改动（只动插件目录）

文件：`lib/client.js`

1. `submitThroughNativeHandler` **不再接收/转发** 原事件的 Ctrl/Meta。合成事件固定为普通 Enter：`ctrlKey/metaKey/shiftKey` 全 `false`。
2. 换行路径不变：继续合成 **Shift+Enter**（Lexical 的原生换行）。
3. `README.md` 写明：插件的「发送」始终映射为原生 Enter，不映射为原生 Ctrl+Enter，因此繁忙态走 queue 而不是 steer。

Web profile 已是 `link:D:/DeepSeek/tpd/dsh-enter-shortcuts`，改源码即改安装副本。Client 模块仍是启动快照，改完后需重启 `dsh web` 并硬刷新。

## 不改

- 不改 DSH 本体 keymap / submission-policy
- 不点发送按钮：思考中主按钮会变成 Stop 或 `disabled`，点不了入队
- 不改 Shift+Enter 直通

## 验收

1. 开关关闭（Enter 换行），空闲：Ctrl+Enter 发送草稿。
2. 开关关闭，agent 思考中、输入框有内容：Ctrl+Enter 进入队列，不插入当前回合。
3. 开关关闭，空草稿：Ctrl+Enter 不 steer 队列。
4. 开关打开（Enter 发送）：Enter 同样在思考中入队；Ctrl+Enter 仍换行。
5. IME 组词中的 Enter 仍不发送。
