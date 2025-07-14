# 校园墙后端API接口文档
这是一个基于node.js的后端项目，本地数据库是MySQL，用户名：root，密码是：20060711
## 基础信息
- 基础URL: `http://your-api-domain.com/api`
- 所有请求头需要包含: `Content-Type: application/json`
- 认证请求头: `Authorization: Bearer {token}`

## 1. 用户认证相关接口

### 1.1 用户注册
- **接口**: `POST /auth/register`
- **描述**: 新用户注册
- **请求体**:
```json
{
  "nickname": "用户昵称",
  "username": "账号",
  "password": "密码"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "id": 1,
    "nickname": "用户昵称",
    "username": "账号",
    "token": "jwt_token"
  }
}
```

### 1.2 用户登录
- **接口**: `POST /auth/login`
- **描述**: 用户登录
- **请求体**:
```json
{
  "username": "账号",
  "password": "密码"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "nickname": "用户昵称",
      "username": "账号",
      "avatar": "头像URL"
    },
    "token": "jwt_token"
  }
}
```

### 1.3 获取当前用户信息
- **接口**: `GET /auth/me`
- **描述**: 获取当前登录用户的详细信息
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "用户名",
    "phone": "手机号",
    "studentId": "学号",
    "email": "邮箱",
    "avatar": "头像URL",
    "department": "学院",
    "bio": "个人简介",
    "tags": ["标签1", "标签2"],
    "postCount": 10,
    "followingCount": 20,
    "followerCount": 15
  }
}
```

### 1.4 更新用户信息
- **接口**: `PUT /auth/me`
- **描述**: 更新当前用户信息
- **认证**: 需要
- **请求体**: (所有字段可选)
```json
{
  "username": "新用户名",
  "email": "新邮箱",
  "avatar": "新头像URL",
  "bio": "新个人简介",
  "department": "新学院"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "id": 1,
    "username": "新用户名",
    "avatar": "新头像URL"
  }
}
```

### 1.5 忘记密码
- **接口**: `POST /auth/forgot-password`
- **描述**: 请求重置密码
- **请求体**:
```json
{
  "email": "用户邮箱"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "重置密码的邮件已发送"
}
```

### 1.6 重置密码
- **接口**: `POST /auth/reset-password`
- **描述**: 重置用户密码
- **请求体**:
```json
{
  "token": "重置密码令牌",
  "password": "新密码"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "密码重置成功"
}
```

## 2. 帖子相关接口

### 2.1 获取帖子列表
- **接口**: `GET /posts`
- **描述**: 获取帖子列表，支持分页和筛选
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `category`: 分类ID（可选）
  - `sort`: 排序方式（latest, popular，默认latest）
- **响应**:
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "userId": 101,
        "username": "发布者用户名",
        "avatar": "发布者头像URL",
        "department": "发布者学院",
        "content": "帖子内容",
        "images": ["图片URL1", "图片URL2"],
        "topics": ["话题1", "话题2"],
        "likes": 56,
        "comments": 7,
        "isLiked": false,
        "isCollected": false,
        "createdAt": "2023-06-10T12:30:45Z",
        "latestComments": [
          {
            "id": 1,
            "userId": 102,
            "username": "评论者用户名",
            "content": "评论内容"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

### 2.2 获取单个帖子详情
- **接口**: `GET /posts/:id`
- **描述**: 获取单个帖子的详细信息
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "userId": 101,
    "username": "发布者用户名",
    "avatar": "发布者头像URL",
    "department": "发布者学院",
    "content": "帖子内容",
    "images": ["图片URL1", "图片URL2"],
    "topics": ["话题1", "话题2"],
    "likes": 56,
    "comments": 7,
    "isLiked": false,
    "isCollected": false,
    "createdAt": "2023-06-10T12:30:45Z",
    "updatedAt": "2023-06-10T12:30:45Z"
  }
}
```

### 2.3 创建帖子
- **接口**: `POST /posts`
- **描述**: 创建新帖子
- **认证**: 需要
- **请求体**:
```json
{
  "content": "帖子内容",
  "images": ["图片URL1", "图片URL2"],
  "topics": ["话题1", "话题2"],
  "categoryId": 1
}
```
- **响应**:
```json
{
  "success": true,
  "message": "帖子创建成功",
  "data": {
    "id": 1,
    "content": "帖子内容",
    "createdAt": "2023-06-10T12:30:45Z"
  }
}
```

### 2.4 更新帖子
- **接口**: `PUT /posts/:id`
- **描述**: 更新帖子内容
- **认证**: 需要
- **请求体**:
```json
{
  "content": "更新的内容",
  "images": ["新图片URL1", "新图片URL2"],
  "topics": ["新话题1", "新话题2"],
  "categoryId": 2
}
```
- **响应**:
```json
{
  "success": true,
  "message": "帖子更新成功",
  "data": {
    "id": 1,
    "content": "更新的内容",
    "updatedAt": "2023-06-10T14:30:45Z"
  }
}
```

### 2.5 删除帖子
- **接口**: `DELETE /posts/:id`
- **描述**: 删除帖子
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "帖子删除成功"
}
```

### 2.6 点赞帖子
- **接口**: `POST /posts/:id/like`
- **描述**: 给帖子点赞
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "点赞成功",
  "data": {
    "likeCount": 57
  }
}
```

### 2.7 取消点赞
- **接口**: `DELETE /posts/:id/like`
- **描述**: 取消帖子点赞
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "取消点赞成功",
  "data": {
    "likeCount": 56
  }
}
```

### 2.8 收藏帖子
- **接口**: `POST /posts/:id/collect`
- **描述**: 收藏帖子
- **认证**: 需要
- **请求体**:
```json
{
  "collectionId": 1 // 可选，指定收藏夹ID
}
```
- **响应**:
```json
{
  "success": true,
  "message": "收藏成功"
}
```

### 2.9 取消收藏
- **接口**: `DELETE /posts/:id/collect`
- **描述**: 取消收藏帖子
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "取消收藏成功"
}
```

## 3. 评论相关接口

### 3.1 获取帖子评论
- **接口**: `GET /posts/:id/comments`
- **描述**: 获取帖子的评论列表
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **响应**:
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "userId": 102,
        "username": "评论者用户名",
        "avatar": "评论者头像URL",
        "content": "评论内容",
        "likes": 5,
        "isLiked": false,
        "createdAt": "2023-06-10T12:35:45Z",
        "replies": [
          {
            "id": 2,
            "userId": 103,
            "username": "回复者用户名",
            "avatar": "回复者头像URL",
            "content": "回复内容",
            "likes": 2,
            "isLiked": false,
            "createdAt": "2023-06-10T12:40:45Z"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### 3.2 添加评论
- **接口**: `POST /posts/:id/comments`
- **描述**: 给帖子添加评论
- **认证**: 需要
- **请求体**:
```json
{
  "content": "评论内容",
  "parentId": 1 // 可选，回复的评论ID
}
```
- **响应**:
```json
{
  "success": true,
  "message": "评论发布成功",
  "data": {
    "id": 3,
    "content": "评论内容",
    "createdAt": "2023-06-10T15:30:45Z"
  }
}
```

### 3.3 删除评论
- **接口**: `DELETE /comments/:id`
- **描述**: 删除评论
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "评论删除成功"
}
```

### 3.4 点赞评论
- **接口**: `POST /comments/:id/like`
- **描述**: 给评论点赞
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "点赞成功",
  "data": {
    "likeCount": 6
  }
}
```

### 3.5 取消评论点赞
- **接口**: `DELETE /comments/:id/like`
- **描述**: 取消评论点赞
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "取消点赞成功",
  "data": {
    "likeCount": 5
  }
}
```

## 4. 用户关系接口

### 4.1 关注用户
- **接口**: `POST /users/:id/follow`
- **描述**: 关注指定用户
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "关注成功",
  "data": {
    "followerCount": 16
  }
}
```

### 4.2 取消关注
- **接口**: `DELETE /users/:id/follow`
- **描述**: 取消关注用户
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "取消关注成功",
  "data": {
    "followerCount": 15
  }
}
```

### 4.3 获取用户粉丝列表
- **接口**: `GET /users/:id/followers`
- **描述**: 获取用户的粉丝列表
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **响应**:
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "id": 104,
        "username": "粉丝用户名",
        "avatar": "粉丝头像URL",
        "department": "粉丝学院",
        "isFollowing": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "pages": 1
    }
  }
}
```

### 4.4 获取用户关注列表
- **接口**: `GET /users/:id/following`
- **描述**: 获取用户关注的人列表
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **响应**:
```json
{
  "success": true,
  "data": {
    "following": [
      {
        "id": 105,
        "username": "被关注者用户名",
        "avatar": "被关注者头像URL",
        "department": "被关注者学院",
        "isFollowing": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 20,
      "pages": 1
    }
  }
}
```

## 5. 用户资料接口

### 5.1 获取用户个人主页
- **接口**: `GET /users/:id/profile`
- **描述**: 获取用户的个人主页信息
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": 101,
    "username": "用户名",
    "avatar": "头像URL",
    "department": "学院",
    "bio": "个人简介",
    "tags": ["标签1", "标签2"],
    "postCount": 32,
    "followingCount": 45,
    "followerCount": 28,
    "isFollowing": false
  }
}
```

### 5.2 获取用户发布的帖子
- **接口**: `GET /users/:id/posts`
- **描述**: 获取用户发布的帖子列表
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
- **响应**: 同2.1帖子列表接口

## 6. 收藏夹接口

### 6.1 获取用户收藏夹列表
- **接口**: `GET /collections`
- **描述**: 获取当前用户的收藏夹列表
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "id": 1,
        "name": "收藏夹名称",
        "description": "收藏夹描述",
        "postCount": 15,
        "isPrivate": false,
        "createdAt": "2023-06-01T10:30:45Z"
      }
    ]
  }
}
```

### 6.2 创建收藏夹
- **接口**: `POST /collections`
- **描述**: 创建新收藏夹
- **认证**: 需要
- **请求体**:
```json
{
  "name": "收藏夹名称",
  "description": "收藏夹描述",
  "isPrivate": false
}
```
- **响应**:
```json
{
  "success": true,
  "message": "收藏夹创建成功",
  "data": {
    "id": 2,
    "name": "收藏夹名称",
    "createdAt": "2023-06-15T10:30:45Z"
  }
}
```

### 6.3 获取收藏夹内容
- **接口**: `GET /collections/:id`
- **描述**: 获取收藏夹中的帖子列表
- **认证**: 需要（非私有收藏夹可公开访问）
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
- **响应**: 同2.1帖子列表接口

## 7. 消息通知接口

### 7.1 获取未读消息数
- **接口**: `GET /messages/unread-count`
- **描述**: 获取当前用户未读消息数量
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### 7.2 获取消息列表
- **接口**: `GET /messages`
- **描述**: 获取当前用户的消息列表
- **认证**: 需要
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
  - `type`: 消息类型（like, comment, follow, system，不传则获取全部）
- **响应**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": 1,
        "type": "like",
        "content": "用户A点赞了你的帖子",
        "sender": {
          "id": 102,
          "username": "用户A",
          "avatar": "用户A头像URL"
        },
        "targetId": 1, // 目标帖子或评论ID
        "isRead": false,
        "createdAt": "2023-06-15T10:35:45Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

### 7.3 标记消息为已读
- **接口**: `PUT /messages/:id/read`
- **描述**: 标记单条消息为已读
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "标记成功"
}
```

### 7.4 标记所有消息为已读
- **接口**: `PUT /messages/read-all`
- **描述**: 标记所有消息为已读
- **认证**: 需要
- **响应**:
```json
{
  "success": true,
  "message": "全部标记成功"
}
```

## 8. 搜索接口

### 8.1 全局搜索
- **接口**: `GET /search`
- **描述**: 全局搜索（帖子、用户、话题）
- **参数**:
  - `keyword`: 搜索关键词
  - `type`: 搜索类型（post, user, topic，默认all）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
- **响应**:
```json
{
  "success": true,
  "data": {
    "posts": [...], // 同帖子列表结构
    "users": [...], // 用户列表
    "topics": [...], // 话题列表
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

## 9. 话题接口

### 9.1 获取热门话题
- **接口**: `GET /topics/popular`
- **描述**: 获取热门话题列表
- **参数**:
  - `limit`: 返回数量（默认10）
- **响应**:
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": 1,
        "name": "话题名称",
        "postCount": 156,
        "heatIndex": 94
      }
    ]
  }
}
```

### 9.2 获取话题详情
- **接口**: `GET /topics/:id`
- **描述**: 获取话题详细信息
- **响应**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "话题名称",
    "description": "话题描述",
    "banner": "话题图片URL",
    "postCount": 156,
    "followerCount": 68,
    "isFollowing": false,
    "createdAt": "2023-05-10T10:30:45Z"
  }
}
```

### 9.3 获取话题下的帖子
- **接口**: `GET /topics/:id/posts`
- **描述**: 获取特定话题下的帖子列表
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `sort`: 排序方式（latest, popular，默认popular）
- **响应**: 同2.1帖子列表接口

## 10. 文件上传接口

### 10.1 上传图片
- **接口**: `POST /upload/image`
- **描述**: 上传图片文件
- **认证**: 需要
- **请求**: FormData格式，字段名为image
- **响应**:
```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "url": "图片访问URL",
    "filename": "文件名"
  }
}
```

## 11. 系统配置接口

### 11.1 获取分类列表
- **接口**: `GET /categories`
- **描述**: 获取系统分类列表
- **响应**:
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "推荐",
        "icon": "图标URL",
        "order": 1
      },
      {
        "id": 2,
        "name": "最新动态",
        "icon": "图标URL",
        "order": 2
      }
    ]
  }
}
``` 