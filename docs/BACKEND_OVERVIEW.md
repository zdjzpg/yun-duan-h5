# yun-duan-h5 项目目录说明



## 文档矩阵
- **根 README (`README.md`)**：项目初始化指南（安装、启动、构建、Lint），适合在拉取仓库后快速跑通开发环境。
- **本文 (`docs/BACKEND_OVERVIEW.md`)**：针对后端/接口开发的结构速查表，聚焦目录含义、Mock 切换、类型契约等。
- **组件规范 (`docs/COMPONENTS.md`)**：详解所有 `Y*` 自封装组件的 Props 与事件，保证业务场景统一交互；`src/components/README.md` 提供简版索引。
- **Mock 协议 (`docs/API_MOCK_THEATER.md`)**：列举剧场域所有 Mock 接口的 URL、请求体、响应示例，是对接真实后端最重要的参考。
- **场馆锁定文档 (`docs/THEATER_VENUE_LOCK_README.md`, `docs/THEATER_VENUE_LOCK_TOOLTIP.md`)**：描述锁定/复制场馆的 UX、接口、提示文案，避免破坏已有演出数据。
- **Hooks 约定 (`src/hooks/README.md`)**：说明如何新增组合式 API Hook，把接口能力包装成可复用逻辑，方便用 AI 生成的组件直接复用。

## 技术栈与运行方式
- Node 20.19+ / 22.12+，通过 npm 脚本 `dev`、`build`、`type-check`、`lint`、`format` 驱动日常开发（详见 `package.json`）。
- 前端基于 Vite 7 + Vue 3 + TypeScript，搭配 Ant Design Vue、Pinia、Vue Router、axios、vuedraggable 等依赖，UI/交互与业务逻辑集中在 `src/`。
- 所有 HTTP 请求统一由 `src/services/request.ts` 封装的 axios 实例发起：读取 `VITE_API_BASE_URL`、设置 15s 超时、挂载请求/响应拦截并全局 message 提示。
- DEV 环境默认启用 `axios-mock-adapter` 的剧场 Mock（`src/api/setup-mocks.ts`），可通过 `enable`/`delay` 参数或注释掉 `setupMockAdapter` 来切换真实后端。

## 根目录速览
- `docs/`：上述所有协作文档所在地，新增业务或协议时请在此补充，以便 AI/同事有统一知识库。
- `public/`：Vite 静态资源根，构建时原样拷贝，不经过打包器处理。
- `src/`：业务代码主入口，详见下文细分结构。
- `index.html`、`vite.config.ts`、`tsconfig*.json`：控制 HTML 模板、Vite 行为、路径别名与 TS 编译。
- `.editorconfig`、`.prettierrc.json`、`eslint.config.ts`：统一格式/Lint 约定，建议提交前运行 `npm run lint`。
- `package.json` / `package-lock.json`：依赖声明、Node engine 约束、npm 脚本定义。

## src 目录结构
- `api/`：按领域拆分的 API 方法与 DTO。示例：
  - `api/account.ts`：登录与关卡登录。
  - `api/theaterVenue.ts`：场馆 CRUD、状态切换。
  - `api/endpoints/`：Mock 端点映射，真实后端可按相同 URL/Method/响应结构实现。
- `services/request.ts`：HTTP 抽象层，提供 `get/post/patch/delete`，`unwrapResponse` 兼容 `{status,result,messages}` 与 `{code,data}` 两种响应格式。
- `api/setup-mocks.ts`：集中注册剧场/演出领域 Mock，支持 `delay`、`enable` 配置，同时导出 `resetMock`、`restoreMock` 助于调试。
- `hooks/`：组合式 API Hook 集合（见 `src/hooks/README.md`），用于封装常用逻辑（请求、表单、鉴权等）供组件直接复用。
- `config/system.ts`：系统常量（系统名、默认路由、角色标签/颜色），可与后端共享枚举定义。
- `router/`：路由配置。根 `router/index.ts` 负责 history、标题、登录守卫；`router/modules/*.ts` 按业务模块拆分路由表。
- `components/`：自封装通用组件与剧场领域组件；`docs/COMPONENTS.md`、`src/components/README.md` 提供详细/快速说明。
- `views/`：页面实现，按业务域（`Demo/`、`Theater/` 等）拆分，与 `router/modules` 一一对应，便于 AI 生成页面后定位。
- `stores/`：Pinia store 示例，管理跨页面状态。
- `styles/`、`assets/`：全局样式入口（如 `styles/common.less`）和静态资源。
- `types/`：领域模型定义（`types/theater.ts`, `types/user.ts` 等），API 与视图均应复用，避免魔法字符串。

## 联调要点
- **Base URL**：通过 `.env.*` 配置 `VITE_API_BASE_URL`，`services/request` 会自动引用。关闭 Mock 后即可直连真实后端。
- **响应格式**：前端支持 `{status,result,messages}`（模板项目格式）与 `{code,message,data}`（剧场 Mock 格式），后端任选一种并保持稳定。
- **Mock 参考**：`docs/API_MOCK_THEATER.md` 列出每个端点的 URL / Method / 请求体 / 响应示例，照此即可实现真实接口。
- **场馆锁定逻辑**：详见 `docs/THEATER_VENUE_LOCK_README.md`，包括锁定原因、允许操作、复制场馆流程；`THEATER_VENUE_LOCK_TOOLTIP.md` 则记录 UI 文案。
- **类型契约**：`types/theater.ts`、`types/user.ts` 描述了全部字段及枚举；如需新增字段请先更新类型再在 API/Mock 中使用，避免 AI 生成代码与接口不一致。

## 协作建议
- 新增模块或接口后，立即更新 `docs/` 中对应文档，并在根 README 或本文维护索引，方便后续 AI/同事检索。
- 若扩展自封装组件或 Hook，需同步更新 `docs/COMPONENTS.md`、`src/components/README.md`、`src/hooks/README.md`，保持规范统一。
- 在使用 AI 生成前端代码前，可先让 AI 阅读本文 + 组件/Hook 文档，确保生成的代码符合约定（如必须使用 `Y*` 组件、数据类型使用 `Dayjs` 等）。
