# 校园墙 API 接口文档

## 目录
- [基础信息](#基础信息)
- [接口规范](#接口规范)
- [错误码说明](#错误码说明)
- [认证模块](#认证模块)
- [用户模块](#用户模块)
- [帖子模块](#帖子模块)
- [评论模块](#评论模块)
- [点赞模块](#点赞模块)
- [收藏模块](#收藏模块)
- [关注模块](#关注模块)
- [消息模块](#消息模块)
- [话题模块](#话题模块)
- [分类模块](#分类模块)
- [文件上传](#文件上传)

## 基础信息

### 服务器地址
- 开发环境: `http://172.168.2.101:3000`
- 备用环境: `http://172.168.9.236:3000`
- Android模拟器: `http://10.0.2.2:3000`
- 生产环境: 待定

### 请求头
```
Content-Type: application/json
Authorization: Bearer {token} (需要鉴权的接口)
```

### 响应格式
所有API响应使用JSON格式，基础结构如下：
```json
{
  "code": 0,       // 状态码，0表示成功，非0表示失败
  "msg": "success", // 状态描述
  "data": {}       // 响应数据，不同接口返回不同结构
}
```

## 接口规范

### 分页参数
需要分页的接口，请求参数统一使用：
```
page: 页码，从1开始
pageSize: 每页条数，默认10
```

返回格式统一为：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [],     // 数据列表
    "pagination": {
      "page": 1,    // 当前页码
      "pageSize": 10, // 每页条数
      "total": 100  // 总条数
    }
  }
}
```

### 时间格式
所有时间字段统一使用ISO 8601格式的UTC时间：
```
YYYY-MM-DDTHH:mm:ss.sssZ
```

## 错误码说明

| 错误码 | 说明 |
| ----- | ---- |
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权或授权过期 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 1001 | 用户不存在 |
| 1002 | 密码错误 |
| 1003 | 账号已被禁用 |
| 2001 | 帖子不存在 |
| 2002 | 帖子已被删除 |
| 3001 | 评论不存在 |
| 3002 | 评论已被删除 |
| 4001 | 上传文件失败 |

## 认证模块

### 用户登录
- **接口路径**：`/api/auth/login`
- **请求方式**：`POST`
- **请求参数**：
```json
{
  "username": "string", // 用户名
  "password": "string"  // 密码
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "username": "zhangsan",
      "nickname": "张三",
      "avatar": "https://example.com/avatar.jpg",
      "role": "student",
      "createdAt": "2023-01-15T08:30:00.000Z"
    }
  }
}
```
- **失败响应**：
```json
{
  "code": 1002,
  "msg": "密码错误",
  "data": null
}
```

### 用户注册
- **接口路径**：`/api/auth/register`
- **请求方式**：`POST`
- **请求参数**：
```json
{
  "username": "string", // 用户名，3-50个字符
  "password": "string", // 密码，6-30个字符
  "nickname": "string"  // 昵称，2-20个字符
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "username": "zhangsan",
      "nickname": "张三",
      "avatar": "https://example.com/default-avatar.jpg",
      "role": "student",
      "createdAt": "2023-05-20T08:30:00.000Z"
    }
  }
}
```
- **失败响应**：
```json
{
  "code": 400,
  "msg": "用户名已存在",
  "data": null
}
```

## 用户模块

### 获取当前用户信息
- **接口路径**：`/api/users/me`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "user123",
    "username": "zhangsan",
    "nickname": "张三",
    "avatar": "https://example.com/avatar.jpg",
    "role": "student",
    "gender": "male", // male-男, female-女, other-其他
    "bio": "这个人很懒，什么都没留下",
    "school": "示例大学",
    "department": "计算机学院",
    "createdAt": "2023-01-15T08:30:00.000Z",
    "stats": {
      "postCount": 10,
      "followCount": 20,
      "fansCount": 30,
      "likeCount": 40
    }
  }
}
```
- **失败响应**：
```json
{
  "code": 401,
  "msg": "认证已过期，请重新登录",
  "data": null
}
```

### 获取指定用户信息
- **接口路径**：`/api/users/:id`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "user123",
    "username": "zhangsan",
    "nickname": "张三",
    "avatar": "https://example.com/avatar.jpg",
    "role": "student",
    "gender": "male",
    "bio": "这个人很懒，什么都没留下",
    "school": "示例大学",
    "department": "计算机学院",
    "createdAt": "2023-01-15T08:30:00.000Z",
    "stats": {
      "postCount": 10,
      "followCount": 20,
      "fansCount": 30
    },
    "isFollowing": false // 当前用户是否已关注该用户
  }
}
```
- **失败响应**：
```json
{
  "code": 1001,
  "msg": "用户不存在",
  "data": null
}
```

### 更新用户信息
- **接口路径**：`/api/users/me`
- **请求方式**：`PUT`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "nickname": "string", // 可选
  "avatar": "string",   // 可选，头像URL
  "gender": "male",     // 可选，性别
  "bio": "string",      // 可选，个人简介
  "school": "string",   // 可选，学校
  "department": "string"// 可选，院系
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```
- **失败响应**：
```json
{
  "code": 400,
  "msg": "参数错误",
  "data": null
}
```

### 修改密码
- **接口路径**：`/api/users/change-password`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "oldPassword": "string", // 旧密码
  "newPassword": "string"  // 新密码
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```
- **失败响应**：
```json
{
  "code": 1002,
  "msg": "密码错误",
  "data": null
}
```

## 帖子模块

### 获取帖子列表
- **接口路径**：`/api/posts`
- **请求方式**：`GET`
- **请求参数**：
```
page: 1         // 页码
pageSize: 10    // 每页条数
categoryId: 1   // 可选，分类ID
sort: latest    // 排序方式：latest-最新, hot-热门
keyword: ''     // 可选，搜索关键词
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": "post123",
        "title": "这是一个帖子标题",
        "content": "帖子内容摘要...",
        "images": [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg"
        ],
        "author": {
          "id": "user123",
          "username": "zhangsan",
          "nickname": "张三",
          "avatar": "https://example.com/avatar.jpg"
        },
        "category": {
          "id": 1,
          "name": "学习交流"
        },
        "location": {
          "name": "图书馆",
          "longitude": 116.3,
          "latitude": 39.9
        },
        "stats": {
          "viewCount": 100,
          "likeCount": 30,
          "commentCount": 20,
          "favoriteCount": 10
        },
        "isLiked": false,      // 当前用户是否点赞
        "isFavorited": false,  // 当前用户是否收藏
        "createdAt": "2023-05-20T08:30:00.000Z",
        "updatedAt": "2023-05-20T09:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100
    }
  }
}
```

### 获取热门帖子
- **接口路径**：`/api/posts/hot`
- **请求方式**：`GET`
- **请求参数**：
```
limit: 10  // 返回数量，默认10
```
- **成功响应**：与获取帖子列表相同

### 获取帖子详情
- **接口路径**：`/api/posts/:id`
- **请求方式**：`GET`
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "post123",
    "title": "这是一个帖子标题",
    "content": "帖子的完整内容...",
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "author": {
      "id": "user123",
      "username": "zhangsan",
      "nickname": "张三",
      "avatar": "https://example.com/avatar.jpg",
      "isFollowed": false  // 当前用户是否关注了作者
    },
    "category": {
      "id": 1,
      "name": "学习交流"
    },
    "topics": [
      {
        "id": 1,
        "name": "期末考试"
      }
    ],
    "location": {
      "name": "图书馆",
      "longitude": 116.3,
      "latitude": 39.9
    },
    "stats": {
      "viewCount": 100,
      "likeCount": 30,
      "commentCount": 20,
      "favoriteCount": 10
    },
    "isLiked": false,      // 当前用户是否点赞
    "isFavorited": false,  // 当前用户是否收藏
    "createdAt": "2023-05-20T08:30:00.000Z",
    "updatedAt": "2023-05-20T09:30:00.000Z"
  }
}
```
- **失败响应**：
```json
{
  "code": 2001,
  "msg": "帖子不存在",
  "data": null
}
```

### 创建帖子
- **接口路径**：`/api/posts`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "title": "string",    // 帖子标题，可选
  "content": "string",  // 帖子内容
  "images": [           // 图片URL数组，可选
    "string"
  ],
  "categoryId": 1,      // 分类ID
  "topicIds": [1, 2],   // 话题ID列表，可选
  "location": {         // 位置信息，可选
    "name": "string",
    "longitude": 116.3,
    "latitude": 39.9
  }
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "post123",
    "createdAt": "2023-05-20T08:30:00.000Z"
  }
}
```
- **失败响应**：
```json
{
  "code": 400,
  "msg": "参数错误",
  "data": null
}
```

### 更新帖子
- **接口路径**：`/api/posts/:id`
- **请求方式**：`PUT`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "title": "string",    // 可选
  "content": "string",  // 可选
  "images": [           // 可选
    "string"
  ],
  "categoryId": 1,      // 可选
  "topicIds": [1, 2],   // 可选
  "location": {         // 可选
    "name": "string",
    "longitude": 116.3,
    "latitude": 39.9
  }
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```
- **失败响应**：
```json
{
  "code": 403,
  "msg": "无权限修改此帖子",
  "data": null
}
```

### 删除帖子
- **接口路径**：`/api/posts/:id`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```
- **失败响应**：
```json
{
  "code": 403,
  "msg": "无权限删除此帖子",
  "data": null
}
```

## 评论模块

### 获取帖子评论列表
- **接口路径**：`/api/posts/:id/comments`
- **请求方式**：`GET`
- **请求参数**：
```
page: 1       // 页码
pageSize: 10  // 每页条数
sort: latest  // 排序方式：latest-最新, hot-热门
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": "comment123",
        "content": "这是一条评论",
        "author": {
          "id": "user123",
          "username": "zhangsan",
          "nickname": "张三",
          "avatar": "https://example.com/avatar.jpg"
        },
        "replyTo": {          // 回复的评论，如果不是回复则为null
          "id": "comment456",
          "content": "被回复的评论",
          "author": {
            "id": "user456",
            "username": "lisi",
            "nickname": "李四",
            "avatar": "https://example.com/avatar2.jpg"
          }
        },
        "stats": {
          "likeCount": 12
        },
        "isLiked": false,     // 当前用户是否点赞
        "createdAt": "2023-05-20T09:45:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100
    }
  }
}
```

### 发表评论
- **接口路径**：`/api/comments`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "postId": "string",  // 帖子ID
  "content": "string", // 评论内容
  "replyTo": "string"  // 可选，回复的评论ID
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "comment123",
    "createdAt": "2023-05-20T09:45:00.000Z"
  }
}
```
- **失败响应**：
```json
{
  "code": 400,
  "msg": "评论内容不能为空",
  "data": null
}
```

### 删除评论
- **接口路径**：`/api/comments/:id`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```
- **失败响应**：
```json
{
  "code": 403,
  "msg": "无权限删除此评论",
  "data": null
}
```

## 点赞模块

### 点赞
- **接口路径**：`/api/likes`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "targetType": "string", // 点赞目标类型：post-帖子, comment-评论
  "targetId": "string"    // 目标ID
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "likeCount": 31  // 最新点赞数量
  }
}
```
- **失败响应**：
```json
{
  "code": 400,
  "msg": "已点赞过",
  "data": null
}
```

### 取消点赞
- **接口路径**：`/api/likes`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "targetType": "string", // 点赞目标类型：post-帖子, comment-评论
  "targetId": "string"    // 目标ID
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "likeCount": 30  // 最新点赞数量
  }
}
```

### 检查是否点赞
- **接口路径**：`/api/likes/check/:target_type/:target_id`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "isLiked": true
  }
}
```

## 收藏模块

### 收藏帖子
- **接口路径**：`/api/favorites`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "postId": "string"  // 帖子ID
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "favoriteCount": 11  // 最新收藏数量
  }
}
```
- **失败响应**：
```json
{
  "code": 400,
  "msg": "已收藏过",
  "data": null
}
```

### 取消收藏
- **接口路径**：`/api/favorites`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "postId": "string"  // 帖子ID
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "favoriteCount": 10  // 最新收藏数量
  }
}
```

### 获取用户收藏列表
- **接口路径**：`/api/favorites/user/me`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **请求参数**：
```
page: 1        // 页码
pageSize: 10   // 每页条数
```
- **成功响应**：帖子列表格式同帖子模块

### 检查是否收藏
- **接口路径**：`/api/favorites/check/:post_id`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "isFavorited": true
  }
}
```

## 关注模块

> **🔧 修复状态**：2025-06-28 已修复数据库字段兼容性问题
> **问题**：`signature` 字段不存在导致查询失败
> **解决**：已更新为 `bio` 字段，所有接口正常工作
> **测试状态**：✅ 全部通过

### 关注用户
- **接口路径**：`/api/follows`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "userId": "string"  // 要关注的用户ID
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "followCount": 21,  // 当前用户的关注数
    "fansCount": 11     // 目标用户的粉丝数
  }
}
```
- **失败响应**：
```json
{
  "code": 400,
  "msg": "已关注过",
  "data": null
}
```

### 取消关注
- **接口路径**：`/api/follows`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "userId": "string"  // 要取消关注的用户ID
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "followCount": 20,  // 当前用户的关注数
    "fansCount": 10     // 目标用户的粉丝数
  }
}
```

### 获取我的关注列表
- **接口路径**：`/api/follows/me/followings`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **请求参数**：
```
page: 1        // 页码
pageSize: 10   // 每页条数
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": "user456",
        "username": "lisi",
        "nickname": "李四",
        "avatar": "https://example.com/avatar2.jpg",
        "bio": "这个人很懒，什么都没留下",
        "followTime": "2023-05-20T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 20
    }
  }
}
```

### 获取我的粉丝列表
- **接口路径**：`/api/follows/me/followers`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **请求参数**：
```
page: 1        // 页码
pageSize: 10   // 每页条数
```
- **成功响应**：与关注列表格式相同

### 检查是否关注
- **接口路径**：`/api/follows/check/:user_id`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "isFollowing": true
  }
}
```

## 消息模块

### 获取消息列表
- **接口路径**：`/api/messages`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **请求参数**：
```
page: 1       // 页码
pageSize: 10  // 每页条数
type: all     // 类型：all-全部, comment-评论, like-点赞, system-系统, follow-关注
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": "msg123",
        "type": "comment", // comment-评论, like-点赞, system-系统, follow-关注
        "title": "新的评论",
        "content": "xxx评论了你的帖子",
        "sender": {
          "id": "user456",
          "username": "lisi",
          "nickname": "李四",
          "avatar": "https://example.com/avatar2.jpg"
        },
        "relatedPost": {     // 相关帖子，可能为null
          "id": "post123",
          "title": "帖子标题摘要"
        },
        "relatedComment": {  // 相关评论，可能为null
          "id": "comment123",
          "content": "评论内容摘要"
        },
        "isRead": false,     // 是否已读
        "createdAt": "2023-05-20T10:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100
    },
    "unread": {
      "total": 25,    // 总未读数
      "comment": 10,  // 评论未读数
      "like": 8,      // 点赞未读数
      "system": 5,    // 系统未读数
      "follow": 2     // 关注未读数
    }
  }
}
```

### 获取未读消息数
- **接口路径**：`/api/messages/unread-count`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 25,    // 总未读数
    "comment": 10,  // 评论未读数
    "like": 8,      // 点赞未读数
    "system": 5,    // 系统未读数
    "follow": 2     // 关注未读数
  }
}
```

### 标记消息已读
- **接口路径**：`/api/messages/:id/read`
- **请求方式**：`PUT`
- **请求头**：需要Authorization
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```

### 批量标记消息已读
- **接口路径**：`/api/messages/readAll`
- **请求方式**：`PUT`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "type": "all" // 可选，类型：all-全部, comment-评论, like-点赞, system-系统, follow-关注
}
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "count": 25 // 标记为已读的消息数量
  }
}
```

## 话题模块

### 获取话题列表
- **接口路径**：`/api/topics`
- **请求方式**：`GET`
- **请求参数**：
```
page: 1       // 页码
pageSize: 10  // 每页条数
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "期末考试",
        "postCount": 305,
        "isHot": true
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 50
    }
  }
}
```

### 获取热门话题
- **接口路径**：`/api/topics/hot`
- **请求方式**：`GET`
- **请求参数**：
```
limit: 10  // 返回数量，默认10
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "期末考试",
        "postCount": 305,
        "isHot": true
      },
      {
        "id": 2,
        "name": "校园活动",
        "postCount": 256,
        "isHot": true
      }
    ]
  }
}
```

### 搜索话题
- **接口路径**：`/api/topics/search`
- **请求方式**：`GET`
- **请求参数**：
```
keyword: "考试"  // 搜索关键词
limit: 10       // 返回数量，默认10
```
- **成功响应**：与热门话题格式相同

### 获取话题详情
- **接口路径**：`/api/topics/:id`
- **请求方式**：`GET`
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "name": "期末考试",
    "description": "关于期末考试的讨论",
    "postCount": 305,
    "isHot": true,
    "createdAt": "2023-05-20T08:30:00.000Z"
  }
}
```

### 获取话题下帖子
- **接口路径**：`/api/topics/:id/posts`
- **请求方式**：`GET`
- **请求参数**：
```
page: 1       // 页码
pageSize: 10  // 每页条数
```
- **成功响应**：帖子列表格式同帖子模块

## 分类模块

### 获取分类列表
- **接口路径**：`/api/categories`
- **请求方式**：`GET`
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "学习交流",
        "icon": "https://example.com/icons/study.png",
        "sort": 1
      },
      {
        "id": 2,
        "name": "生活服务",
        "icon": "https://example.com/icons/life.png",
        "sort": 2
      }
    ]
  }
}
```

### 获取分类详情
- **接口路径**：`/api/categories/:id`
- **请求方式**：`GET`
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "name": "学习交流",
    "icon": "https://example.com/icons/study.png",
    "description": "学习相关的交流讨论",
    "sort": 1,
    "postCount": 1024,
    "createdAt": "2023-05-20T08:30:00.000Z"
  }
}
```

## 文件上传

### 上传图片
- **接口路径**：`/api/posts/upload`
- **请求方式**：`POST`
- **请求头**：
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```
- **请求参数**：
```
file: (二进制文件)  // 图片文件
```
- **成功响应**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "url": "https://example.com/uploads/image123.jpg",
    "thumbnailUrl": "https://example.com/uploads/image123_thumb.jpg", // 缩略图
    "size": 102400,  // 文件大小（字节）
    "width": 800,    // 图片宽度
    "height": 600    // 图片高度
  }
}
```
- **失败响应**：
```json
{
  "code": 4001,
  "msg": "上传文件失败",
  "data": null
}
``` 