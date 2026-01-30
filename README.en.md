<p align="center">
  <h1 align="center">🏫 Campus Wall</h1>
  <p align="center">
    <strong>All-in-One Campus Social Platform</strong><br>
    Posts · Topics · Events · Real-time Messaging
  </p>
  <p align="center">
    English | <a href="./README.md">中文</a>
  </p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js&logoColor=white" alt="Vue 3">
  <img src="https://img.shields.io/badge/uni--app-3.0-2B9939" alt="uni-app">
  <img src="https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Redis-6.0-DC382D?logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
</p>

---

## 📖 Overview

**Campus Wall** is a full-featured campus social platform designed to provide a convenient space for students and faculty to communicate and interact.

The platform supports **multi-platform deployment**:
- 📱 **Mobile App** - Built with uni-app, supports H5, WeChat Mini Program, and 12+ platforms
- 💻 **Admin Dashboard** - Modern management interface with Vue 3 + Element Plus
- ⚙️ **Backend API** - RESTful API built with Node.js + Express

### Why Campus Wall?

| Feature | Description |
|---------|-------------|
| 🚀 **Ready to Deploy** | Complete frontend and backend code, configure and deploy |
| 📱 **Multi-platform** | One codebase compiles to WeChat/Alipay/H5/App and more |
| 🔐 **Secure** | JWT auth, rate limiting, XSS protection, SQL injection prevention |
| 📊 **Data Visualization** | ECharts-powered analytics dashboard |
| 🔄 **Real-time** | WebSocket-powered messaging and notifications |
| 🎨 **Modern UI** | Beautiful design with responsive layouts |

---

## ✨ Features

### User Features

<table>
<tr>
<td width="50%">

**📝 Content Publishing**
- Image posts (multi-image support)
- Topic hashtags (#topic#)
- Category submissions
- Anonymous posting
- Post editing/deletion

</td>
<td width="50%">

**💬 Social Interaction**
- Comments with nested replies
- Likes (posts/comments)
- Favorites management
- User following/followers
- Mutual follows

</td>
</tr>
<tr>
<td>

**📨 Messaging**
- System notifications
- Interaction messages (likes/comments/follows)
- Private chat (WebSocket real-time)
- Read status tracking

</td>
<td>

**🎉 Events System**
- Event publishing and registration
- Custom registration forms
- Capacity limits
- Registration status management
- My events list

</td>
</tr>
<tr>
<td>

**👤 Profile Center**
- Profile editing
- Avatar upload
- Privacy settings
- Audit history
- My posts/favorites

</td>
<td>

**🔍 Discovery & Search**
- Global search (posts/users/topics)
- Search history
- Trending topics
- Recommended posts
- Homepage carousel

</td>
</tr>
</table>

### Admin Features

<table>
<tr>
<td width="50%">

**👥 User Management**
- User list and search
- User audit (registration review)
- Ban/unban users
- Rejection logs
- User statistics

</td>
<td width="50%">

**📋 Content Management**
- Post review/deletion
- Comment management
- Topic CRUD
- Topic merging
- Topic statistics

</td>
</tr>
<tr>
<td>

**🏷️ Categories & Tags**
- Category management
- User tag management
- Banner management
- Badge system configuration

</td>
<td>

**⚙️ System Settings**
- Recommendation algorithm config
- System parameters
- Operation logs
- Data dashboard

</td>
</tr>
</table>

### Special Features

- **🎭 Emoji System** - Custom emoji packs, favorites, usage history
- **🏅 Badge System** - Achievement badges, manual grant/revoke
- **📊 Hot Comment Algorithm** - Smart sorting based on interaction data
- **🔔 Real-time Push** - Instant WebSocket message delivery

---

## 🛠️ Tech Stack

### Backend (server/)

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 18+ |
| **Framework** | Express 4.18 |
| **ORM** | Sequelize 6.35 |
| **Database** | MySQL 8.0 |
| **Cache** | Redis 6.0 (ioredis) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Real-time** | Socket.IO 4.8 / WebSocket |
| **File Handling** | Multer + Sharp (image compression) |
| **Validation** | Joi 17 |
| **Security** | Helmet + express-rate-limit + CORS |
| **Logging** | Winston 3 |
| **Scheduling** | node-schedule |
| **Export** | ExcelJS |

### Admin Dashboard (admin/)

| Category | Technology |
|----------|------------|
| **Framework** | Vue 3.5 (Composition API) |
| **Build Tool** | Vite 6 |
| **UI Components** | Element Plus 2.9 |
| **State Management** | Pinia 3 |
| **Router** | Vue Router 4.5 |
| **Charts** | ECharts 5 |
| **HTTP Client** | Axios |
| **Export** | XLSX |
| **Styling** | SCSS (sass-embedded) |

### Mobile App (uni-APP/)

| Category | Technology |
|----------|------------|
| **Framework** | uni-app 3.0 + Vue 3.4 |
| **State Management** | Pinia 2 + Persisted State |
| **i18n** | vue-i18n 9 |
| **Styling** | SCSS |
| **Platforms** | H5, WeChat/Alipay/Baidu/Douyin/QQ/Kuaishou/Lark/JD Mini Programs, HarmonyOS, QuickApp, XiaoHongShu |

---

## 📁 Project Structure

```
Campus-Wall/
├── server/                     # Backend API Service
│   ├── src/
│   │   ├── controllers/        # Controller Layer
│   │   │   └── admin/          # Admin Controllers
│   │   ├── services/           # Service Layer - Business Logic
│   │   │   └── admin/          # Admin Services
│   │   ├── repositories/       # Data Access Layer
│   │   ├── models/             # Sequelize Models (28)
│   │   ├── routes/             # Route Definitions (24 modules)
│   │   │   └── admin/          # Admin Routes
│   │   ├── middlewares/        # Middleware (Auth/Validation/Error)
│   │   ├── utils/              # Utility Functions
│   │   └── constants/          # Constants
│   ├── config/                 # Configuration Files
│   ├── scripts/                # Utility Scripts
│   ├── uploads/                # Upload Directory
│   └── docs/
│       ├── api/                # API Documentation (21)
│       └── guides/             # Usage Guides
│
├── admin/                      # Vue 3 Admin Dashboard
│   └── src/
│       ├── views/              # Page Components (29)
│       ├── components/         # Shared Components
│       ├── api/                # API Wrappers
│       ├── stores/             # Pinia Stores
│       └── router/             # Route Config
│
├── uni-APP/                    # uni-app Mobile App
│   └── src/
│       ├── pages/              # Pages (36)
│       ├── components/         # Shared Components
│       ├── api/                # API Wrappers
│       ├── stores/             # Pinia Stores
│       └── utils/              # Utilities
│
├── docs/                       # Project Documentation
│   ├── features/               # Feature Design Docs (12)
│   └── guides/                 # Usage Guides (4)
│
├── AGENTS.md                   # AI Coding Guidelines
├── README.md                   # Project README (Chinese)
├── README.en.md                # Project README (English)
├── CONTRIBUTING.md             # Contribution Guidelines
└── LICENSE                     # Open Source License
```

---

## 🚀 Quick Start

### Prerequisites

| Dependency | Version | Description |
|------------|---------|-------------|
| Node.js | >= 18.0.0 | LTS version recommended |
| MySQL | >= 8.0 | Database |
| Redis | >= 6.0 | Cache and sessions |
| npm/pnpm | Latest | Package manager |

### 1. Clone the Repository

```bash
git clone https://github.com/syj925/-.git campus-wall
cd campus-wall
```

### 2. Start Backend Server

```bash
cd server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env file with your database settings

# Start in development mode (hot reload)
npm run dev

# Server runs at http://localhost:3000
```

<details>
<summary>📄 .env Configuration Example</summary>

```env
# Server Config
PORT=3000
NODE_ENV=development

# Database Config
DB_HOST=localhost
DB_PORT=3306
DB_NAME=campus_wall
DB_USER=root
DB_PASSWORD=your_password

# Redis Config
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Config
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

</details>

### 3. Start Admin Dashboard

```bash
cd admin

# Install dependencies
npm install

# Start in development mode
npm run dev

# Dashboard runs at http://localhost:8888
```

### 4. Start Mobile App

```bash
cd uni-APP

# Install dependencies
npm install

# H5 Development
npm run dev:h5
# Runs at http://localhost:5173

# WeChat Mini Program
npm run dev:mp-weixin
# Open dist/dev/mp-weixin in WeChat DevTools

# Other Platforms
npm run dev:mp-alipay     # Alipay Mini Program
npm run dev:mp-baidu      # Baidu Mini Program
npm run dev:mp-toutiao    # Douyin Mini Program
npm run dev:mp-qq         # QQ Mini Program
npm run dev:mp-harmony    # HarmonyOS
```

### 5. Default Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |

> ⚠️ **Security Note**: Change default password in production!

---

## 📚 API Documentation

Backend API documentation is located in `server/docs/api/`:

### User API

| Module | Document | Description |
|--------|----------|-------------|
| Overview | [00-overview.md](./server/docs/api/00-overview.md) | Auth, response format, error codes |
| Auth | [01-auth.md](./server/docs/api/01-auth.md) | Login, register, verification |
| User | [02-user.md](./server/docs/api/02-user.md) | User info, profile |
| Post | [03-post.md](./server/docs/api/03-post.md) | Create, list, detail |
| Comment | [04-comment.md](./server/docs/api/04-comment.md) | Comments, replies |
| Interaction | [05-interaction.md](./server/docs/api/05-interaction.md) | Like, favorite, follow |
| Message | [06-message.md](./server/docs/api/06-message.md) | Notifications, private messages |
| Topic | [07-topic.md](./server/docs/api/07-topic.md) | Topics list, detail |
| Category | [08-category.md](./server/docs/api/08-category.md) | Content categories |
| Search | [09-search.md](./server/docs/api/09-search.md) | Global search |
| Upload | [10-upload.md](./server/docs/api/10-upload.md) | File upload |
| Event | [11-event.md](./server/docs/api/11-event.md) | Events, registration |
| Badge | [12-badge.md](./server/docs/api/12-badge.md) | User badges |
| Banner | [13-banner.md](./server/docs/api/13-banner.md) | Homepage carousel |
| Tag | [14-tag.md](./server/docs/api/14-tag.md) | User tags |
| Emoji | [15-emoji.md](./server/docs/api/15-emoji.md) | Emoji packs |
| Settings | [16-settings.md](./server/docs/api/16-settings.md) | User settings |

### Admin API

| Module | Document | Description |
|--------|----------|-------------|
| Auth | [20-admin-auth.md](./server/docs/api/20-admin-auth.md) | Admin login |
| User Management | [21-admin-user.md](./server/docs/api/21-admin-user.md) | User audit, management |
| Content Management | [22-admin-content.md](./server/docs/api/22-admin-content.md) | Posts, comments, topics |
| System Management | [23-admin-system.md](./server/docs/api/23-admin-system.md) | Settings, dashboard |

---

## 🚢 Production Deployment

### Option 1: Docker Compose (Recommended)

<details>
<summary>📄 docker-compose.yml</summary>

```yaml
version: '3.8'

services:
  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: campus-wall-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: campus_wall
      TZ: Asia/Shanghai
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"

  # Redis Cache
  redis:
    image: redis:6-alpine
    container_name: campus-wall-redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  # Backend API
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: campus-wall-server
    restart: unless-stopped
    depends_on:
      - mysql
      - redis
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      REDIS_HOST: redis
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - ./server/uploads:/app/uploads
    ports:
      - "3000:3000"

  # Admin Dashboard
  admin:
    image: nginx:alpine
    container_name: campus-wall-admin
    restart: unless-stopped
    volumes:
      - ./admin/dist:/usr/share/nginx/html
    ports:
      - "8888:80"

volumes:
  mysql_data:
  redis_data:
```

</details>

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f server

# Stop services
docker-compose down
```

### Option 2: PM2 Deployment

```bash
# Install PM2 globally
npm install -g pm2

# Enter backend directory
cd server

# Install production dependencies
npm install --production

# Start with PM2
pm2 start src/server.js --name campus-wall-api

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

### Option 3: Nginx Reverse Proxy

<details>
<summary>📄 nginx.conf</summary>

```nginx
upstream campus_wall_api {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://campus_wall_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /uploads {
        alias /path/to/campus-wall/server/uploads;
        expires 30d;
    }
}
```

</details>

---

## 🧪 Development

### Common Commands

#### Backend (server/)

```bash
npm start              # Production mode
npm run dev            # Development mode (nodemon)
npm test               # Run Jest tests
npm run lint           # ESLint check
npm run seed-data      # Seed test data
npm run backup-db      # Backup database
npm run clear-cache    # Clear Redis cache
```

#### Admin Dashboard (admin/)

```bash
npm run dev            # Dev server
npm run build          # Production build
npm run preview        # Preview build
```

#### Mobile App (uni-APP/)

```bash
npm run dev:h5         # H5 development
npm run build:h5       # H5 build
npm run dev:mp-weixin  # WeChat Mini Program dev
npm run build:mp-weixin # WeChat Mini Program build
```

### Code Standards

- **Backend**: CommonJS modules, layered architecture (Controller → Service → Repository → Model)
- **Frontend**: Vue 3 Composition API + `<script setup>` + SCSS
- **Naming**: Files kebab-case, components PascalCase, variables camelCase
- **Comments**: JSDoc style, explain "why" not "what"

See [AGENTS.md](./AGENTS.md) for complete coding guidelines.

---

## 🗄️ Data Models

The project includes **28 data models**:

| Module | Models | Description |
|--------|--------|-------------|
| **User** | User, Follow, UserTag, UserBadge, UserRejectionLog | Users and relationships |
| **Content** | Post, PostImage, Comment, Like, Favorite | Posts and interactions |
| **Category** | Category, Topic, Tag | Content classification |
| **Message** | Message, MessageRead | Notifications and chat |
| **Event** | Event, EventRegistration | Event registration |
| **Badge** | Badge, UserBadge | Achievement system |
| **Emoji** | Emoji, EmojiPack, EmojiVersion, EmojiFavorite, EmojiUsageHistory, UserEmojiPack, UserCustomEmoji | Emoji system |
| **Other** | Banner, Setting, SearchHistory | System config |

---

## 🤝 Contributing

We welcome all contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

### Quick Start

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

### Commit Convention

```
<type>(<scope>): <subject>

type: feat | fix | docs | style | refactor | test | chore
scope: server | admin | uni-app | docs
```

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🙏 Acknowledgments

- [Express](https://expressjs.com/) - Backend framework
- [Vue.js](https://vuejs.org/) - Frontend framework
- [Element Plus](https://element-plus.org/) - UI component library
- [uni-app](https://uniapp.dcloud.io/) - Cross-platform framework
- [Sequelize](https://sequelize.org/) - ORM framework

---

<p align="center">
  If this project helps you, please give it a ⭐ Star!
</p>
