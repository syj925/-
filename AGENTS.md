# AGENTS.md - AI Coding Agent Guidelines

> 校园墙 (Campus Wall) - 校园社交平台

## Quick Reference

| Component | Port | Tech Stack |
|-----------|------|------------|
| Backend API | 3000 | Node.js 18+, Express, Sequelize, MySQL 8, Redis 6 |
| Admin Dashboard | 8888 | Vue 3.5, Vite 6, Element Plus, Pinia, SCSS |
| Mobile App | 5173 (H5) | uni-app 3.0, Vue 3.4, Pinia |

---

## Build / Lint / Test Commands

### Backend (`server/`)

```bash
npm run dev              # Development with nodemon hot-reload
npm start                # Production mode
npm test                 # Run Jest tests
npm run lint             # ESLint check

# Run single test file
npx jest tests/follow.test.js

# Run specific test by name
npx jest --testNamePattern="应该能够关注用户"

# Utility scripts
npm run seed-data        # Seed test data
npm run backup-db        # Backup database
npm run clear-cache      # Clear Redis cache
```

### Admin Dashboard (`admin/`)

```bash
npm run dev              # Dev server at localhost:8888
npm run build            # Production build
npm run preview          # Preview production build
```

### Mobile App (`uni-APP/`)

```bash
npm run dev:h5           # H5 dev at localhost:5173
npm run dev:mp-weixin    # WeChat mini-program
npm run build:h5         # H5 production build
```

---

## Architecture

### Backend Layered Structure

```
Controller → Service → Repository → Model
     ↓           ↓          ↓          ↓
  Request    Business    Data       Sequelize
  handling    logic     access       ORM
```

- **Controllers**: `server/src/controllers/` - Request/response handling only
- **Services**: `server/src/services/` - Business logic, validation
- **Repositories**: `server/src/repositories/` - Database queries via Sequelize
- **Models**: `server/src/models/` - Sequelize model definitions (28 models)

---

## API Response Format

### Success Response

```javascript
{
  success: true,
  code: 0,
  msg: "成功",
  message: "成功",  // Alias for frontend compatibility
  data: { ... }
}
```

### Error Response

```javascript
{
  code: 200,        // Error code from error-codes.js
  msg: "用户不存在",
  data: null
}
```

### Pagination Response

```javascript
{
  code: 0,
  msg: "成功",
  data: {
    list: [...],
    pagination: { page: 1, pageSize: 10, total: 100 }
  }
}
```

### Frontend Success Check

```javascript
// Always use this pattern
if (res.code === 0 || res.success === true) { ... }
const message = res.msg || res.message;
```

---

## Code Style Guidelines

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `user-badge.repository.js` |
| Vue Components | PascalCase | `UserList.vue` |
| Variables/Functions | camelCase | `getUserInfo()` |
| Database fields | snake_case | `created_at`, `user_id` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |

### Backend (Node.js)

- **Module system**: CommonJS (`require`/`module.exports`)
- **Async**: Always use `async/await`, never raw Promises
- **Validation**: Use Joi for request validation
- **Logging**: Use Winston logger, not `console.log`
- **Error handling**: Use `ErrorMiddleware.createError()` pattern

```javascript
// Controller pattern
async getUserList(req, res, next) {
  try {
    const result = await userService.findUsers(options);
    res.status(StatusCodes.OK).json(ResponseUtil.success(result));
  } catch (error) {
    logger.error('Error:', error);
    next(error);  // Pass to error middleware
  }
}
```

### Frontend (Vue 3)

- **Script syntax**: Always use `<script setup>`
- **Styling**: SCSS with scoped styles, never plain CSS
- **UI Components**: Element Plus for admin, uni-app components for mobile
- **State**: Pinia stores
- **HTTP**: Axios with centralized API modules

```vue
<template>
  <div class="component-name">...</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  data: { type: Object, required: true }
})
</script>

<style lang="scss" scoped>
.component-name { ... }
</style>
```

---

## Critical Constraints

### MUST DO

- Use relative paths for image URLs in database (`/uploads/images/xxx.png`)
- Frontend concatenates base URL at runtime
- Check `res.code === 0 || res.success === true` for API success
- Use Joi for validation (not express-validator) for consistency
- Follow existing UI patterns - reuse components, don't create new ones
- Implement tests for new features
- Use structured logger output, minimize console noise

### MUST NOT

- Never hardcode IP addresses (use `localhost:3000`)
- Never store full URLs with IPs in database
- Never suppress TypeScript/ESLint errors with `@ts-ignore` or `eslint-disable`
- Never use `as any` type casting
- Never leave empty catch blocks
- Never delete tests to make them pass
- Never mix Joi and express-validator in same codebase

---

## Database

- **Engine**: MySQL 8.0 with utf8mb4 charset
- **ORM**: Sequelize 6.35
- **Prefer ORM queries** over raw SQL for consistency
- Soft deletes where applicable (`deleted_at` timestamps)

### Key Models

User, Post, Comment, Like, Favorite, Follow, Topic, Category, Event, EventRegistration, Badge, UserBadge, Message, Banner, Setting, SearchHistory, Emoji*, Tag

---

## Testing

```bash
# Run all tests
cd server && npm test

# Run specific test file
npx jest tests/follow.test.js

# Run with coverage
npx jest --coverage

# Run specific test by name pattern
npx jest --testNamePattern="关注"
```

Test files use Jest + Supertest pattern:

```javascript
const request = require('supertest');
const app = require('../src/app');

describe('Feature Tests', () => {
  test('should do something', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .send({ data: 'value' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

---

## Git Commit Convention

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | test | chore
scope: server | admin | uni-app | docs
```

Examples:
- `feat(server): add user avatar upload API`
- `fix(admin): correct pagination in user list`
- `docs: update API documentation`

---

## Environment

- Node.js >= 18.0.0
- MySQL >= 8.0
- Redis >= 6.0
- Default admin: `admin` / `admin123`

### Key Environment Variables (server/.env)

```
PORT=3000
DB_HOST=localhost
DB_NAME=campus_community
DB_USER=root
DB_PASSWORD=20060711
REDIS_HOST=localhost
JWT_SECRET=your_secret
```

---

## Reference Documentation

- API Docs: `server/docs/api/*.md`
- Feature Docs: `docs/features/*.md`
- Cursor Rules: `.cursor/rules/xm.mdc` (detailed conventions)
