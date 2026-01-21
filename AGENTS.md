# AGENTS.md

Project-specific guidelines for AI coding agents on the 校园墙 (Campus Wall) project.

## Build & Test Commands

### Server (Node.js + Express + Sequelize)
```bash
cd server
npm start              # Production (port 3000)
npm run dev            # Development with nodemon
npm test               # Run all Jest tests
npm run lint           # Run ESLint
npm run seed-data      # Seed test data
npm run backup-db      # Backup database
```

**Run single test:**
```bash
cd server
npx jest tests/follow.test.js
npx jest --testNamePattern="test name"
```

### Admin (Vue 3 + Element Plus)
```bash
cd admin
npm run dev            # Development (port 8888)
npm run build          # Production build
npm run preview        # Preview build
```

### uni-APP (uni-app + Vue 3)
```bash
cd uni-APP
npm run dev:h5         # H5 development
npm run dev:mp-weixin  # WeChat mini-program
npm run build:h5       # H5 production
npm run build:mp-weixin # WeChat production
```

## API Conventions

### Response Format
```javascript
{ code: 0, success: true, msg: '成功', data: {...} }
// Success: res.code === 0 || res.success === true
// Message: res.msg || res.message
// Error: ElMessage.error(message || '操作失败')
```

### Pagination & Search
- Fields: `page`, `limit`, `title`, `status`, `startDate`, `endDate`
- Prevent cache: add `_t: Date.now()` to request params

### Authentication
- Header: `Authorization: Bearer ${token}`
- Token: `localStorage.getItem('admin_token')` or `uni.getStorageSync('token')`

## Code Style

### Naming
- **Files**: kebab-case (`follow-service.js`)
- **Variables/Functions**: camelCase (`getUserData`)
- **Classes/Models**: PascalCase (`User`, `Follow`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Database columns**: snake_case (`created_at`)
- **Display**: Use "账号" (account), "昵称" (nickname)

### Import/Export
**Server (Node.js):** `const express = require('express'); module.exports = router;`
**Frontend (ES6):** `import { ref } from 'vue'; export default { /* ... */ };`

### Error Handling
**Server:** Try/catch with logger.error and proper status codes
**Frontend:** Try/catch with ElMessage.error

### General
- Use complete words, no abbreviations
- Early return pattern
- Comments explain "why", not "what"
- No TODOs - implement or remove
- Architecture: Controller → Service → Repository → Model

## Architecture

**Backend (`server/src/`):** `controllers/`, `services/`, `repositories/`, `models/`, `routes/`, `middlewares/`, `utils/`, `constants/`

**Frontend (`admin/src/`, `uni-APP/src/`):** `api/`, `components/`, `views/pages/`, `utils/`, `store/`, `router/`

## Testing

**Framework:** Jest + Supertest. Use `beforeAll`/`afterAll` for setup/cleanup, `expect(response.body.success).toBe(true)` for assertions.

## Date/Time

**Input:** `YYYY-MM-DD HH:mm:ss` (Element Plus `value-format`)
**Display:** `.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })`

## File Upload

**Endpoint:** `/api/upload`, **Success:** `response.code === 0`, **Image URL:** Prepend base URL if not `http://` prefixed

## Activity Management

**Status:** `upcoming | ongoing | ended | canceled`

**Rules:** `max_participants = 0` (unlimited), `is_recommended` (boolean), filter empty form fields

## Guidelines

### Development
- Read migration docs before implementing
- Implement backend API first, then frontend
- Reuse existing UI patterns/components
- New features must include tests
- Maintain backward compatibility

### API Changes
- Update `admin/src/utils/api.js`, controllers/services, and related views

### Database
- Use Sequelize ORM, avoid raw SQL
- Store relative image paths, build URLs at runtime
- Index optimization after core features complete

### Configuration
- **Server port:** 3000, **Admin port:** 8888
- **Database password:** `20060711`
- No hardcoded IP addresses, Redis required

### Quality
- No mock data - use real APIs
- High-quality UI required
- Complete self-testing
- Follow existing architecture patterns
- SCSS for global styles (don't convert to CSS)

### Known Issues
- `uni-APP初版` only works in H5 mode
- Topic API may not return complete author fields
- Statistics returns `postCount, likeCount, favoriteCount, followCount, fansCount` (no `commentCount`)
- Home page must handle 100+ posts

## Documentation

- `docs/响应格式兼容性问题修复文档.md`
- `docs/图片URL迁移指南.md`
- `server/campus-wall-api-specification.md`
- `.cursor/rules/xm.mdc` (detailed rules)

## Security

- Never commit secrets/credentials
- Validate inputs on client and server
- Sanitize user content
- Use HTTPS in production
- Keep dependencies updated
