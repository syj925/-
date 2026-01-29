# AGENTS.md - 校园墙 (Campus Wall) AI Coding Guide

## Project Overview

Campus social platform with three main packages:
- **server/** - Node.js + Express + Sequelize + MySQL + Redis backend API
- **admin/** - Vue 3 + Element Plus + Vite admin dashboard
- **uni-APP/** - uni-app + Vue 3 mobile application

## Build/Lint/Test Commands

### Server (Backend API)
```bash
cd server
npm install                 # Install dependencies
npm start                   # Start production server (port 3000)
npm run dev                 # Start with nodemon (hot reload)
npm test                    # Run all Jest tests
npm run lint                # Run ESLint
npm run test -- --testPathPattern="follow"    # Run single test file
npm run test -- --testNamePattern="should"    # Run tests matching name
```

### Admin (Management Dashboard)
```bash
cd admin
npm install
npm run dev                 # Start dev server (port 8888)
npm run build               # Production build
npm run preview             # Preview production build
```

### uni-APP (Mobile Frontend)
```bash
cd uni-APP
npm install
npm run dev:h5              # Start H5 development server
npm run build:h5            # Build for H5
npm run dev:mp-weixin       # WeChat mini-program dev
npm run build:mp-weixin     # WeChat mini-program build
```

## Architecture Patterns

### Backend Layered Architecture
```
Controller → Service → Repository → Model
```

**Controller** (`src/controllers/*.controller.js`): Request/response handling, validation
**Service** (`src/services/*.service.js`): Business logic, transactions
**Repository** (`src/repositories/*.repository.js`): Database operations
**Model** (`src/models/*.js`): Sequelize model definitions

### File Naming Conventions
- Backend: kebab-case (`post.controller.js`, `user.service.js`)
- Frontend Vue: PascalCase (`PostCard.vue`, `UserList.vue`)
- Utility files: kebab-case or camelCase

## API Response Format

### Success Response
```javascript
{
  success: true,
  code: 0,
  msg: '成功',
  message: '成功',  // Compatibility field
  data: { ... }
}
```

### Error Response
```javascript
{
  success: false,
  code: 10001,  // Error code from constants/error-codes.js
  msg: '错误消息',
  data: null
}
```

### Frontend Success Check
```javascript
if (res.code === 0 || res.success === true) {
  // Success
}
const message = res.msg || res.message;
```

### Pagination Response
```javascript
{
  success: true,
  code: 0,
  data: {
    list: [...],
    pagination: { page: 1, pageSize: 10, total: 100 }
  }
}
```

## Code Style Guidelines

### JavaScript (Backend - CommonJS)
```javascript
// Imports - group by type
const express = require('express');
const { StatusCodes } = require('http-status-codes');
const postService = require('../services/post.service');
const { ResponseUtil } = require('../utils');
const logger = require('../../config/logger');

// Class-based controllers/services with JSDoc
/**
 * Controller description
 */
class PostController {
  /**
   * Method description
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Next middleware
   * @returns {Promise<void>}
   */
  async createPost(req, res, next) {
    try {
      const userId = req.user.id;
      const { title, content } = req.body;
      
      // Early returns for validation
      if (!content) {
        return res.status(StatusCodes.BAD_REQUEST)
          .json(ResponseUtil.error({ code: 10001, message: '内容不能为空' }));
      }
      
      const result = await postService.createPost({ title, content, user_id: userId });
      res.json(ResponseUtil.success(result, '创建成功'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PostController();
```

### Vue 3 (Frontend - ES Modules with script setup)
```vue
<template>
  <view class="post-card" @tap="goDetail">
    <text class="post-card__title">{{ post.title }}</text>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { postApi } from '@/api';

// Props & Emits
const props = defineProps({
  post: { type: Object, required: true },
  compact: { type: Boolean, default: false }
});
const emit = defineEmits(['click', 'like']);

// Reactive state
const isLoading = ref(false);

// Computed
const formatTime = computed(() => {
  return new Date(props.post.created_at).toLocaleString('zh-CN');
});

// Methods
const goDetail = () => {
  uni.navigateTo({ url: `/pages/post/detail?id=${props.post.id}` });
};

// Lifecycle
onMounted(() => {
  // Initialize
});
</script>

<style lang="scss" scoped>
.post-card {
  padding: 16rpx;
  
  &__title {
    font-size: 32rpx;
    font-weight: bold;
  }
}
</style>
```

### Naming Conventions
- **Variables/Functions**: camelCase (`userId`, `createPost`)
- **Classes**: PascalCase (`PostController`, `UserService`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_PAGE_SIZE`, `DEFAULT_LIMIT`)
- **Database fields**: snake_case (`user_id`, `created_at`)
- **API endpoints**: kebab-case (`/api/private-messages`)
- Use full words, avoid abbreviations

### Error Handling
```javascript
// Backend - throw with middleware
throw ErrorMiddleware.createError(
  '用户不存在',
  StatusCodes.NOT_FOUND,
  errorCodes.USER_NOT_EXIST
);

// Frontend - unified toast
ElMessage.error(res.msg || res.message || '操作失败');
```

### Validation
- Use Joi for request validation (avoid mixing with express-validator)
```javascript
const schema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).max(30).required()
});
router.post('/login', Validator.validateBody(schema), controller.login);
```

## Important Conventions

### Ports
- Backend API: **3000**
- Admin Dashboard: **8888**
- Frontend H5: **5173** (default Vite)

### Image URLs
- Store relative paths in database (`/uploads/images/xxx.png`)
- Frontend concatenates base URL at runtime
- NEVER hardcode IP addresses

### Database
- ORM queries preferred over raw SQL
- Use transactions for multi-step operations
- Password: `20060711` (MySQL)

### Styling
- Use **SCSS** exclusively, never convert to plain CSS
- BEM naming convention for CSS classes
- Mobile: use `rpx` units

### Timestamps
- Frontend format: `value-format="YYYY-MM-DD HH:mm:ss"`
- Display format: `toLocaleString('zh-CN', { ... })`

## Testing

```javascript
// Jest test file structure
const request = require('supertest');
const app = require('../src/app');
const { User } = require('../src/models');

describe('Feature Tests', () => {
  beforeAll(async () => {
    // Setup test data
  });

  afterAll(async () => {
    // Cleanup test data
  });

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

## Key Reminders

1. **Early returns** - Avoid deep nesting
2. **Comments explain WHY** - Not what the code does
3. **No TODO left behind** - Implement or remove
4. **Match existing patterns** - Check similar files first
5. **Test new features** - All new functionality requires tests
6. **Two-phase development** - Backend API first, then frontend
7. **Incremental changes** - Feature by feature, not all at once
8. **Never suppress type errors** - No `as any`, `@ts-ignore`
9. **Minimize console logs** - Use structured logger in backend
10. **Pagination fields**: `page`, `limit` (not `pageSize`)
