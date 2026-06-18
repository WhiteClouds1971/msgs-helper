# msgs-helper 项目框架搭建设计

**日期**：2026-06-18 | **状态**：已确认

## 目标

搭建 msgs-helper 全新项目的基础框架。该项目是"面杀辅助工具"的 AI 驱动全新建构，参考旧项目 `msgs-tools` 的技术骨架但不复用其业务代码。

本次范围**仅限框架搭建**，不涉及业务功能开发。

## 技术栈

| 维度       | 选型                          | 版本              |
| ---------- | ----------------------------- | ----------------- |
| 框架       | Vue 3（`<script setup>` SFC） | ^3.5              |
| 构建       | Vite                          | ^6                |
| 路由       | Vue Router                    | ^4                |
| 状态管理   | Pinia                         | ^3                |
| CSS 预处理 | Less                          | ^4                |
| 代码格式化 | Prettier                      | ^3                |
| 代码检查   | ESLint                        | ^9（flat config） |
| 运行时     | Node（nvm 管理）              | 22 LTS            |
| 包管理     | npm                           | 自带              |

### 明确排除（本次不引入）

- Vant 4 UI 库（后续按需决定）
- unplugin-auto-import / unplugin-vue-components（后续按需决定）
- 自定义 Vite 插件（marked、imageOrientation 等，后续按需决定）

## 目录结构

```
msgs-helper/
├── index.html                # HTML 入口
├── package.json              # 依赖与脚本
├── vite.config.js            # Vite 配置（路径别名、dev server）
├── jsconfig.json             # IDE 路径提示
├── .prettierrc.json          # Prettier 配置
├── eslint.config.js          # ESLint flat config
├── .env                      # 默认环境变量
├── .env.dev                  # 开发环境
├── .env.prod                 # 生产环境
├── .env.uat                  # UAT 环境
├── .gitignore                # Git 忽略
├── build.sh                  # 构建脚本
├── public/                   # 不经过编译的静态资源
│   └── favicon.svg
└── src/
    ├── main.js               # 入口：createApp → use(router) → use(pinia) → mount
    ├── App.vue               # 根组件，<router-view>
    ├── style.css             # 全局样式 + CSS 变量
    ├── router/
    │   ├── index.js          # createRouter + beforeEach 守卫
    │   └── routes.js         # 路由表常量
    ├── stores/
    │   └── index.js          # createPinia 实例导出
    ├── pages/
    │   └── index.js          # 页面路由数组导出
    ├── components/            # 公共组件目录（占位）
    ├── utils/                # 工具函数目录（占位）
    │   └── .gitkeep
    └── assets/               # 经编译的资源
        └── css/
            └── .gitkeep
```

## 路径别名

```js
// vite.config.js
'@'  → './src'     // import X from '@/router'
'~'  → './'        // import X from '~/public/...'
```

## 构建脚本

| 命令              | 作用            |
| ----------------- | --------------- |
| `npm run dev`     | 启动开发服务器  |
| `npm run build`   | 生产构建        |
| `npm run preview` | 预览生产构建    |
| `npm run lint`    | ESLint 检查     |
| `npm run format`  | Prettier 格式化 |

## 环境变量

```
APP_NAME=面杀辅助工具
APP_BASE_API=/api
APP_SERVER_URL=
```

四个环境文件（`.env`、`.env.dev`、`.env.prod`、`.env.uat`）结构一致，`APP_SERVER_URL` 按环境填入。

## 不在本次范围

- 业务页面和组件
- UI 组件库选择
- 自动导入插件
- 自定义 Vite 插件
- API 对接
- 部署配置
