# Editor Main

一个基于 Vue 3 的多编辑器集成应用，支持多种编辑器类型的统一管理和切换。

## 技术栈

### 核心框架
- [Vue 3](https://vuejs.org/) - 渐进式 JavaScript 框架
- [TypeScript](https://www.typescriptlang.org/) - TypeScript 类型系统
- [Vite](https://vitejs.dev/) - 下一代前端构建工具

### UI 与样式
- [UnoCSS](https://unocss.dev/) - 即时按需原子化 CSS 引擎
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
- [SCSS](https://sass-lang.com/) - CSS 预处理器
- [Lucide Vue Next](https://lucide.dev/) - 精美的图标库

### 编辑器集成
- [Excalidraw](https://excalidraw.com/) - 手绘风格绘图工具
- [Draw.io](https://draw.io/) - 流程图和网络图编辑器
- [Plait](https://github.com/plait-plait/plait) - 流程图、思维导图编辑器
- [Markdown](https://markdown.cn/) - Markdown 文本编辑器

### 状态管理与存储
- [@vueuse/core](https://vueuse.org/) - Vue 组合式工具集
- [Dexie.js](https://dexie.org/) - 简化的 IndexedDB 封装
- [@iss-ai/easy-web-store](https://github.com/ISS-AI/easy-web-store) - Web 存储解决方案

### 组件与工具
- [lodash-es](https://lodash.com/) - JavaScript 实用库

### 开发工具
- [ESLint](https://eslint.org/) - JavaScript 代码检查工具
- [vue-tsc](https://github.com/johnsoncodehk/volar/tree/master/packages/vue-tsc) - Vue TypeScript 编译器

## 项目结构

```
editor-main/
├── src/
│   ├── api/              # API 接口层
│   │   ├── ChatApi.ts    # 聊天相关 API
│   │   └── FetchApi.ts   # 通用请求 API
│   ├── components/       # Vue 组件
│   │   ├── chat/         # 聊天相关组件
│   │   │   ├── AIProviderConfig.vue
│   │   │   ├── ChatPanel.vue
│   │   │   ├── CodeBlock.vue
│   │   │   ├── MessageBlocks.vue
│   │   │   └── ThoughtBlock.vue
│   │   ├── files/        # 文件管理组件
│   │   │   ├── FileCreateDialog.vue
│   │   │   └── FileManager.vue
│   │   ├── ui/           # UI 基础组件
│   │   │   ├── Button.vue
│   │   │   ├── Dialog.vue
│   │   │   ├── Dropdown.vue
│   │   │   ├── Input.vue
│   │   │   ├── Radio.vue
│   │   │   ├── Select.vue
│   │   │   └── Toast.vue
│   │   └── Sidebar.vue   # 侧边栏组件
│   ├── const/            # 常量定义
│   │   └── languages.ts  # 语言配置
│   ├── db/               # 数据库层
│   │   ├── index.ts      # Dexie 数据库实例
│   │   └── types.ts      # 数据库类型定义
│   ├── editors/          # 编辑器集成
│   │   ├── drawio.ts     # Draw.io 编辑器
│   │   ├── excalidraw.ts # Excalidraw 编辑器
│   │   ├── index.ts      # 编辑器索引
│   │   ├── markdown.ts   # Markdown 编辑器
│   │   └── plait.ts      # Plait 编辑器
│   ├── styles/           # 全局样式
│   │   ├── main.scss
│   │   ├── smart-editor.scss
│   │   └── variables.scss
│   ├── utils/            # 工具函数
│   │   └── Utils.ts
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── lang/                 # 国际化资源
│   ├── index.js
│   └── index.json
├── public/               # 静态资源
├── index.html            # HTML 模板
├── package.json          # 项目依赖配置
├── tsconfig.json         # TypeScript 配置
├── vite.config.ts        # Vite 构建配置
└── README.md             # 项目说明文档
```

## 功能特性

### 多编辑器支持
- **Excalidraw**: 手绘风格的虚拟白板，适合绘制草图和示意图
- **Draw.io**: 专业的流程图和网络图编辑工具
- **Plait**: 支持流程图和思维导图的专业编辑器
- **Markdown**: 支持语法高亮的 Markdown 文本编辑器

### 国际化支持
- 支持多种语言：简体中文、繁体中文、英语、韩语、日语、法语、俄语、德语等 20+ 种语言
- 自动翻译插件支持实时翻译界面文本

### 主题切换
- 支持亮色/暗色主题切换
- 主题偏好持久化存储

### 文件管理
- 基于 IndexedDB 的文件存储
- 文件历史记录管理
- 文件创建与组织

### 通信机制
- 使用 `@iss-ai/window-message-bus` 实现跨窗口通信
- 支持编辑器与主应用的实时数据同步

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0 (推荐)

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

启动后访问 http://localhost:5173 查看应用。

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

### 代码检查

```bash
pnpm lint
```

## 配置说明

### Vite 配置

项目使用 Vite 作为构建工具，主要配置包括：

- **别名配置**: `@` 指向 `/src` 目录
- **CSS 预处理**: 支持 SCSS，自动注入全局变量
- **插件集成**:
  - `@vitejs/plugin-vue`: Vue 3 SFC 支持
  - `@unocss/vite`: UnoCSS 原子化 CSS
  - `unplugin-auto-import`: Vue API 自动导入
  - `unplugin-vue-components`: 组件自动导入
  - `vite-auto-i18n-plugin`: 国际化自动翻译

### TypeScript 配置

- 启用严格类型检查
- 支持 Vue 单文件组件类型推断
- 自动导入类型声明生成

## 编辑器扩展

添加新编辑器需要以下步骤：

1. 在 `src/editors/` 目录下创建新的编辑器配置文件
2. 实现编辑器接口（包含 `value`, `label`, `iframe`, `prompt`, `format` 等属性）
3. 在 `src/editors/index.ts` 中导出新编辑器

示例编辑器结构：

```typescript
export default {
  value: 'my-editor',
  label: 'My Editor',
  iframe: '/editors/my-editor.html',
  prompt: '',
  format: ['png', 'svg'],
} as const;
```

## 依赖说明

### 运行时依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| vue | ^3.4.21 | Vue 3 核心框架 |
| lucide-vue-next | ^1.0.0 | 图标库 |
| monaco-editor-vue3 | ^1.0.5 | Monaco 编辑器 Vue 封装 |
| lodash-es | ^4.18.1 | 工具库 |
| @iss-ai/* | * | ISS AI 内部工具包 |

### 开发依赖

| 包名 | 版本 | 说明 |
|------|------|------|
| vite | ^5.2.8 | 构建工具 |
| typescript | ^5.4.3 | 类型系统 |
| vue-tsc | ^2.0.7 | TypeScript 编译器 |
| unocss | ^0.59.4 | 原子化 CSS |
| tailwindcss | ^3.4.1 | CSS 框架 |
| sass | ^1.72.0 | SCSS 预处理器 |
| eslint | ^8.57.0 | 代码检查 |
| vite-auto-i18n-plugin | ^1.1.16 | 国际化插件 |

## 许可证

[MIT License](https://github.com/worktile/slate-angular/blob/master/LICENSE)
