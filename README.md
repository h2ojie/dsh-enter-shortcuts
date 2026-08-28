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
- 换行使用真实换行字符，不会插入字面量 `\\n`。
- 发送操作交给 DSH 原生 Composer 处理，因此 Agent 思考/运行中会保留 DSH 默认的排队语义。
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

### 1. 将插件放入 Profile 依赖

在 `~/.dsh/profiles/web/package.json` 的 `dependencies` 中加入：

```json
"dsh-enter-shortcuts": "github:<你的 GitHub 用户名>/<你的仓库名>#subdirectory=dsh-enter-shortcuts"
```

如果插件单独放在一个仓库根目录，则使用：

```json
"dsh-enter-shortcuts": "github:<你的 GitHub 用户名>/<你的仓库名>"
```

也可以使用本地目录：

```json
"dsh-enter-shortcuts": "file:/绝对路径/dsh-enter-shortcuts"
```

### 2. 安装依赖

在 Profile 目录执行：

```bash
pnpm install
```

### 3. 加入 Profile composition patch

编辑 `~/.dsh/profiles/web/cordis.patch.yml`，加入：

```yaml
- insert:
    - id: ui-enter-shortcuts
      name: dsh-enter-shortcuts
```

如果已有一个 `insert` 项，把插件条目放入同一个 `insert` 列表即可。

### 4. 重启 DSH Web

这个插件属于静态 Web Client 模块，首次安装或更新后需要重启 DSH Web/CLI；之后刷新页面即可验证。

## 从压缩包安装

解压 `dsh-enter-shortcuts.zip`，将解压后的插件目录放到你自己的 GitHub 仓库，然后按上面的 Profile 安装步骤配置。

## 开发说明

插件使用 DSH Web 暴露的 Composer DOM 标记：

- `[data-composer-card]`
- `[data-input-scroll]`
- `textarea[data-phase]`

插件通过事件捕获阶段处理键盘事件，并在停止/卸载时移除监听器、按钮和样式。
