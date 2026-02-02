# Campus Wall Codebase Guide

This repository contains the source code for the "Campus Wall" project, a social platform consisting of a Node.js backend, a Vue 3 admin panel, and a uni-app mobile application.

## 📂 Project Structure

- `server/` - Node.js + Express backend
- `admin/` - Vue 3 + Vite + Element Plus admin panel
- `uni-APP/` - uni-app (Vue 3) cross-platform mobile app

---

## 🚀 Backend (server/)

### Build & Run
- **Start Dev**: `npm run dev` (uses nodemon)
- **Start Prod**: `npm start`
- **Lint**: `npm run lint`

### Testing (Jest)
- **Run all tests**: `npm test`
- **Run specific test file**: `npx jest tests/path/to/test.js`
- **Run specific test case**: `npx jest -t "should register user successfully"`

### Code Style & Patterns
- **Module System**: CommonJS (`require` / `module.exports`).
- **Architecture**: Controller (`controllers/`) → Service (`services/`) → Repository (implied) → Model (`models/`).
- **Formatting**: 2 spaces indentation, semicolons required.
- **Naming**: 
  - Files: `kebab-case.js` (e.g., `user.controller.js`)
  - Classes: `PascalCase` (e.g., `UserController`)
  - Methods/Variables: `camelCase`

### Error Handling & Responses
- **Async Handling**: Always use `try/catch` in controllers. Pass errors to Express error handler via `next(error)`.
- **Response Format**: Use `ResponseUtil` for consistent responses.
  ```javascript
  const { ResponseUtil } = require('../utils');
  const { StatusCodes } = require('http-status-codes');
  
  // Success
  res.status(StatusCodes.OK).json(ResponseUtil.success(data));
  
  // Error (handled by middleware usually, but for manual):
  // next(error);
  ```

---

## 🖥️ Admin Panel (admin/)

### Build & Run
- **Dev Server**: `npm run dev` (Vite)
- **Build**: `npm run build`

### Code Style
- **Framework**: Vue 3 with Composition API (`<script setup>`).
- **UI Library**: Element Plus.
- **State Management**: Pinia.
- **Styling**: SCSS within `<style scoped>`.
- **Components**: PascalCase (e.g., `UserList.vue`).
- **Icons**: Import from `@element-plus/icons-vue`.

### Best Practices
- Use `ref` for reactive primitive data, `reactive` for objects (optional, `ref` preferred for consistency).
- API calls should be encapsulated in `src/api/` and imported.
- Handle loading states explicitly (`v-loading`).

---

## 📱 Mobile App (uni-APP/)

### Build & Run
- **H5 Dev**: `npm run dev:h5`
- **WeChat Mini Program**: `npm run dev:mp-weixin`

### Code Style
- **Framework**: uni-app based on Vue 3.
- **Tags**: Use uni-app tags (`<view>`, `<text>`, `<image>`) instead of HTML tags (`<div>`, `<span>`, `<img>`).
- **Lifecycle**:
  - Page: `onLoad`, `onShow`, `onPullDownRefresh`.
  - Component: Standard Vue 3 lifecycle (`onMounted`).
- **Units**: Use `rpx` for responsive layout in styles.

### Patterns
- **Conditional Compilation**: Use `// #ifdef MP-WEIXIN` for platform-specific logic if needed.
- **Navigation**: Use `uni.navigateTo`, `uni.switchTab`.
- **Storage**: Use `uni.getStorageSync`, `uni.setStorageSync`.

---

## 🧹 General Guidelines

- **Git Messages**: Follow Conventional Commits (e.g., `feat: add user login`, `fix: resolve crash on startup`).
- **Comments**: JSDoc for complex logic and API methods.
- **Type Safety**:
  - Server: Loose typing (JS), but validate inputs with `express-validator` or `Joi`.
  - Frontend: Prop types in Vue components.

## 🤖 Agent Instructions

When modifying code:
1. **Check context**: Identify if you are in `server`, `admin`, or `uni-APP`.
2. **Follow patterns**: Copy the structure of existing controllers/components.
3. **Verify**:
   - Server: Run `npm test` if tests exist for the module.
   - Frontend: Ensure no lint errors (if linting is set up).
4. **No "any"**: Avoid suppressing errors without understanding the root cause.
