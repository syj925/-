# 贡献指南 | Contributing Guidelines

[English](#english) | [中文](#中文)

---

## 中文

感谢你考虑为校园墙项目做出贡献！我们欢迎各种形式的贡献。

### 如何贡献

#### 报告 Bug

1. 在 [Issues](https://github.com/syj925/-/issues) 中搜索是否已有类似问题
2. 如果没有，创建新的 Issue，并提供：
   - 清晰的标题和描述
   - 复现步骤
   - 预期行为 vs 实际行为
   - 环境信息（Node.js 版本、浏览器等）
   - 相关的错误日志或截图

#### 提出新功能

1. 在 Issues 中描述你的想法
2. 说明这个功能解决什么问题
3. 提供可能的实现方案（可选）

#### 提交代码

1. **Fork 仓库**
   ```bash
   git clone https://github.com/your-username/-.git
   cd 校园墙
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

3. **开发**
   - 遵循项目的代码规范（见下文）
   - 编写必要的测试
   - 确保所有测试通过

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   然后在 GitHub 上创建 Pull Request

### 代码规范

#### Git 提交信息

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（不是新功能也不是修复）
- `test`: 测试相关
- `chore`: 构建/工具链变更

**作用域 (scope)**:
- `server`: 后端
- `admin`: 管理后台
- `uni-app`: 移动端
- `docs`: 文档

**示例**:
```
feat(server): add user avatar upload API

- Support JPG/PNG/WebP formats
- Add image compression with Sharp
- Max file size: 5MB

Closes #123
```

#### 代码风格

**后端 (Node.js)**
- 使用 ESLint 检查代码
- 遵循分层架构：Controller → Service → Repository → Model
- 使用 JSDoc 注释公共方法
- 异步操作使用 async/await

```javascript
/**
 * 创建帖子
 * @param {Object} data - 帖子数据
 * @param {string} data.title - 标题
 * @param {string} data.content - 内容
 * @returns {Promise<Object>} 创建的帖子
 */
async createPost(data) {
  // ...
}
```

**前端 (Vue 3)**
- 使用 `<script setup>` 语法
- 组件使用 PascalCase 命名
- 样式使用 SCSS + scoped
- 遵循 Element Plus 设计规范

```vue
<template>
  <div class="post-card">
    <!-- ... -->
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  post: { type: Object, required: true }
})
</script>

<style lang="scss" scoped>
.post-card {
  // ...
}
</style>
```

### 项目结构

开始贡献前，请熟悉项目结构：

```
校园墙/
├── server/          # 后端 API
├── admin/           # 管理后台
├── uni-APP/         # 移动端
├── docs/            # 项目文档
└── AGENTS.md        # 完整编码规范
```

详细的编码规范请参阅 [AGENTS.md](./AGENTS.md)。

### 开发环境设置

1. 确保安装了 Node.js 18+、MySQL 8+、Redis 6+
2. 分别在 server、admin、uni-APP 目录执行 `npm install`
3. 配置 server/.env 文件
4. 启动各服务进行开发

### 测试

- 后端测试：`cd server && npm test`
- 确保新功能有对应的测试覆盖
- PR 前确保所有测试通过

### Code Review

提交 PR 后，维护者会进行代码审查。请：

- 耐心等待反馈
- 积极回应评论
- 根据建议修改代码

### 许可证

提交贡献即表示你同意将代码以 [MIT License](./LICENSE) 授权。

---

## English

Thank you for considering contributing to Campus Wall! We welcome all kinds of contributions.

### How to Contribute

#### Reporting Bugs

1. Search [Issues](https://github.com/syj925/-/issues) for existing reports
2. If none exists, create a new Issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (Node.js version, browser, etc.)
   - Relevant logs or screenshots

#### Proposing Features

1. Describe your idea in Issues
2. Explain what problem it solves
3. Provide possible implementation (optional)

#### Submitting Code

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/-.git
   cd campus-wall
   ```

2. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Develop**
   - Follow coding standards (see below)
   - Write necessary tests
   - Ensure all tests pass

4. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a Pull Request on GitHub

### Coding Standards

#### Git Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code formatting
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Build/tooling

**Scopes**:
- `server`: Backend
- `admin`: Admin dashboard
- `uni-app`: Mobile app
- `docs`: Documentation

#### Code Style

**Backend (Node.js)**
- Use ESLint for linting
- Follow layered architecture: Controller → Service → Repository → Model
- Use JSDoc for public methods
- Use async/await for async operations

**Frontend (Vue 3)**
- Use `<script setup>` syntax
- PascalCase for components
- SCSS + scoped styles
- Follow Element Plus design guidelines

### Development Setup

1. Install Node.js 18+, MySQL 8+, Redis 6+
2. Run `npm install` in server, admin, and uni-APP directories
3. Configure server/.env
4. Start services for development

### Testing

- Backend tests: `cd server && npm test`
- Ensure new features have test coverage
- All tests must pass before PR

### Code Review

After submitting a PR, maintainers will review your code. Please:

- Be patient for feedback
- Respond to comments actively
- Update code based on suggestions

### License

By contributing, you agree to license your code under the [MIT License](./LICENSE).

---

感谢你的贡献！| Thank you for contributing! 🙏
