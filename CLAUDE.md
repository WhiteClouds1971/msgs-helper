@/Users/cloudswhite/Personal/Codes/my/claude/md/programming.md

# 面杀辅助工具 (msgs-helper)

面杀（桌上角色扮演推理游戏）辅助 Web 应用。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 (Composition API) |
| 构建工具 | Vite 6 |
| 路由 | Vue Router 4 (History Mode) |
| 状态管理 | Pinia 3 |
| CSS 预处理 | Less |
| 代码规范 | ESLint 9 (flat config) + Prettier |
| Node | >=22.0.0 |

## 目录结构

```
msgs-helper/
├── index.html                  # 入口 HTML
├── vite.config.js              # Vite 配置（含路径别名、dev server）
├── jsconfig.json               # JS 配置（路径别名映射，供 IDE 识别）
├── eslint.config.js            # ESLint flat config
├── .prettierrc.json            # Prettier 配置
├── DESIGN_SYSTEM.md             # UI 设计系统规范（理念+Token+组件+反模式）
├── ANIMATION_SPECS.md          # 动效精确参数表（3 个 key moment）
├── build.sh                    # 构建脚本（git pull + npm install + build）
├── .env / .env.dev / .env.uat / .env.prod  # 环境变量
├── public/
│   └── favicon.svg             # 网站图标
├── src/
│   ├── main.js                 # 应用入口（挂载 Vue/Router/Pinia）
│   ├── App.vue                 # 根组件
│   ├── style.css               # 全局样式
│   ├── assets/css/             # 额外样式
│   ├── components/             # 公共组件
│   ├── pages/                  # 页面组件
│   │   ├── index.js            # 页面统一导出
│   │   └── Home.vue            # 首页
│   ├── router/
│   │   ├── index.js            # Router 实例（history mode + beforeEach 守卫）
│   │   └── routes.js           # 路由配置表
│   ├── stores/
│   │   └── index.js            # Pinia 实例
│   └── utils/                  # 工具函数
└── docs/
    └── superpowers/specs/      # 设计文档
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 9456，监听 0.0.0.0） |
| `npm run build` | 生产构建（输出到 dist/） |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | ESLint 检查 |
| `npm run format` | Prettier 格式化 |
| `bash build.sh` | 拉取最新代码并构建（可传 mode 参数） |
| `bash build.sh uat` | 以 UAT 模式构建 |

## 路径别名

| 别名 | 解析路径 | 用途 |
|------|----------|------|
| `@/` | `src/` | 源码根目录（组件、页面、路由、状态等） |
| `~/` | `./` (项目根目录) | 项目根目录资源引用 |

别名在 `vite.config.js` 和 `jsconfig.json` 中均有配置，确保 Vite 构建和 IDE 均可正确识别。

## 环境变量

所有环境变量以 `APP_` 为前缀，暴露给客户端代码（Vite 规则）。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `APP_NAME` | 应用名称 | 面杀辅助工具 |
| `APP_ENV` | 运行环境 | 见各 .env 文件 |
| `APP_BASE_API` | API 基础路径 | /api |
| `APP_SERVER_URL` | 后端服务地址 | 空 |

- `.env` — 基础配置（所有环境生效）
- `.env.dev` — 开发环境 (`APP_ENV=development`)
- `.env.uat` — UAT 环境 (`APP_ENV=uat`)
- `.env.prod` — 生产环境 (`APP_ENV=production`)

## UI 主题设计 — 墨韵金章 × 暗夜谋局

**设计理念**：从三国物质文化（宣纸、松烟墨、朱砂、古铜金、竹简、漆器）中提取视觉语言。雅致国风 + 现代策略游戏界面融合。

**完整规范见**：`@/../DESIGN_SYSTEM.md`（设计理念、Token 规则、组件规范、反模式清单）、`@/../ANIMATION_SPECS.md`（3 个 key moment 动效精确参数）

**单一事实源**：`src/assets/css/design-tokens.css`（已在 `main.js` 顶部导入）。所有组件通过 `var(--token-name)` 引用，不在组件内重新定义颜色/字体/间距。

### 核心规则（必须遵守）

1. **禁止硬编码颜色** — 所有颜色使用 `var(--token)`，如 `color: var(--text-primary)`，永远不要写 `color: #2c2c2c`
2. **移动端优先** — 竖屏布局、触控友好，页面主体 `max-width: var(--max-width)`（480px），居中显示
3. **暗色非纯黑** — Dark 模式底色为 `#1a1a1f`（松烟墨暖黑），禁止使用 `#000` 或冷灰 `#888`
4. **动效克制** — 只对页面切换、卡牌选中、装饰线入场 3 个 key moment 加动画。其余组件 instant state change。详见 `ANIMATION_SPECS.md`
5. **字体分级** — 标题/武将名用 `var(--font-display)`（Ma Shan Zheng 书法体），正文只用 `var(--font-body)`（系统字体）
6. **触控最小 44px** — 所有可交互元素（按钮、链接、表单控件）高度/宽度 ≥ 44px
7. **过渡禁止 `all`** — transition 必须显式列出属性名，如 `transition: transform 200ms var(--ease-out), opacity 200ms var(--ease-out)`
8. **Light 阴影用暖棕** — `rgba(120, 100, 80, x)` 而非 `rgba(0, 0, 0, x)`，模拟墨色渗透纸面
9. **主题切换** — `data-theme="light|dark"` 优先于系统偏好。JS 初始化逻辑见 `DESIGN_SYSTEM.md` §5
10. **不使用 UI 组件库** — 本项目的所有组件均为自建，不引入 Vant/shadcn 等第三方 UI 库

### 金色使用警告

- `--accent-gold` 在 Light 模式下对比度仅 3.0:1，**仅用于装饰/描边/图标**，不作为正文或按钮背景色
- **主按钮背景**必须使用 `--accent-gold-dark`（Light: `#7a5c10`，与白字对比度 6.1:1 ✓ AAA），而非 `--accent-gold`

### 快速 Token 参考

| 类别 | 常用 Token |
|------|-----------|
| 背景 | `--bg` / `--bg-surface` / `--bg-surface-hover` |
| 文字 | `--text-primary` / `--text-secondary` / `--text-tertiary` |
| 强调 | `--accent-gold` / `--accent-gold-dark`(按钮) / `--accent-red` / `--accent-green` |
| 边框 | `--border` / `--border-light` |
| 间距 | `--space-1`(4) `--space-2`(8) `--space-3`(12) `--space-4`(16) `--space-6`(24) `--space-8`(32) |
| 圆角 | `--radius-sm`(4) `--radius-md`(8) `--radius-lg`(12) `--radius-full` |
| 阴影 | `--shadow-sm` / `--shadow-md` / `--shadow-lg` / `--shadow-glow-gold` |
| 字体 | `--font-display` / `--font-body` / `--font-mono` |
| 动效 | `--duration-fast`(150ms) `--duration-normal`(200ms) `--duration-slow`(300ms) |
| 缓动 | `--ease-out` / `--ease-enter` / `--ease-in-out` / `--ease-ink` |

### 签名效果工具类

| 类名 | 用途 |
|------|------|
| `.texture-rice-paper` | SVG 噪点宣纸纹理（特殊面板/故事区） |
| `.border-ink` | 墨色渗透双环投影（文本卡片/手札） |
| `.seal-stamp` / `.seal-stamp--gold` | 朱砂/金色印章（身份标记） |
| `.decorative-line--knotted` | 金色装饰线 + 编绳菱形节点 |
| `.ink-wash-hover` | hover 时金色辉光扩散（可交互卡牌） |

---
