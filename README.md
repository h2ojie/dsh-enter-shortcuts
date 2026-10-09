# DSH Enter Shortcuts

为 [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness) 提供对话输入框快捷键切换。

## 功能

插件只处理 DSH 对话 Composer 输入框，不影响其他网页、浏览器地址栏或 DSH 的其他文本框。

| 开关状态 | Enter | Ctrl/Cmd+Enter | Shift+Enter | Ctrl/Cmd+J |
| --- | --- | --- | --- | --- |
| 关闭（默认） | 换行 | 发送 | DSH 原行为 | 换行 |
| 打开 | 发送 | 换行 | DSH 原行为 | 换行 |

- 开关默认关闭。
- 插件会避开中文输入法正在组词时的 Enter。
- 适配当前 DSH Web 的 Lexical Composer（`[data-composer-input]`），旧版 `textarea` 仍兼容。
- 换行走 DSH 原生 Shift+Enter，不会插入字面量 `\\n`，也不破坏引用芯片。
- 发送始终映射为原生普通 Enter，不映射为原生 Ctrl/Cmd+Enter。Agent 思考/运行中走 DSH 默认排队（queue），不会当成插话（steer）。
- Shift+Enter 始终交给 DSH 原生处理，不受本插件影响。
- 开关状态保存在当前浏览器页面运行期间；刷新页面或重启 DSH 后恢复为关闭。

## 目录结构

```text
lib/
  index.js   # Host 半，无业务逻辑
  client.js  # Web Client 半
package.json
README.md
```

## 安装到 DSH Web Profile

源码目录：`D:\DeepSeek\tpd\dsh-enter-shortcuts`。本包声明 `dsh.client` 和 `dsh.bundle.patch`，自带加载补丁，可在插件管理页显示并管理启用状态。

### 1. 安装依赖

```bash
dsh plugin --profile web add D:\DeepSeek\tpd\dsh-enter-shortcuts
```

Windows 上 `file:` 依赖通常是拷贝。改完本目录后要再执行一次上面的命令，或改用：

```bash
dsh plugin --profile web add link:D:\DeepSeek\tpd\dsh-enter-shortcuts
```

### 2. 启用 Profile bundle

通过 `dsh plugin add` 登记 bundle 后，可在插件管理页控制启用状态。手动配置时，把 `dsh-enter-shortcuts` 加入 `$DSH_HOME/profiles/web/package.json` 的 `dsh.profile.bundles` 列表；加载条目 `ui-enter-shortcuts` 由包自带的 `cordis.patch.yml` 提供。

**旧配置迁移：**从 Profile 用户 `cordis.patch.yml` 的 `insert` 列表中移除原有的 `ui-enter-shortcuts` 条目，避免重复插入。后续的禁用或配置覆盖仍可使用原条目 id。

### 3. 应用配置与刷新

Profile 使用 `patchReload: live` 时，bundle 列表与用户补丁变更会触发配置重载；本次迁移保留相同的插件 id 和模块名，不修改快捷键实现。刷新插件管理页面以读取新列表。

首次安装或修改静态 Web Client 模块后，如果没有运行对应的开发构建与重载机制，需要重启 DSH Web/CLI，再刷新页面。

## 从压缩包安装

解压 `dsh-enter-shortcuts.zip`，将解压后的插件目录放到你自己的 GitHub 仓库，然后按上面的 Profile 安装步骤配置。

## 开发说明

插件使用 DSH Web 暴露的 Composer DOM 标记：

- `[data-composer-card]`
- `[data-input-scroll]`
- `[data-composer-input]`（当前 Lexical contenteditable；旧版 `textarea[data-phase]` 仍兼容）

插件在捕获阶段拦截 Enter / Ctrl+Enter / Ctrl+J，再把换行和发送交回 DSH 原生快捷键（Shift+Enter 换行、普通 Enter 发送）。发送不带 Ctrl/Meta，因此繁忙态入队而不是插话。停止/卸载时移除监听器、按钮和样式。
