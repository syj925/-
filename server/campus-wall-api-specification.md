# 校园墙小程序后端API接口规范
这是一个基于node.js的后端项目我的数据库是mysql数据库在本地密码是20060711数据库的名字不要用campus_wall这个名字因为有别的在使用这个名字，项目需要同时保持2000人以上保持同时不卡顿，可以用redis来做缓存，需要高并发，复合索引，ORM等后面需要添加更多功能，配置一下pm2集群模式更好利用cpu和内存，redis的地址是192.168.159.130，没有密码
## 目录
- [基础说明](#基础说明)
- [接口规范](#接口规范)
- [错误码说明](#错误码说明)
- [用户模块](#用户模块)
- [帖子模块](#帖子模块)
- [评论模块](#评论模块)
- [消息模块](#消息模块)
- [文件上传](#文件上传)
- [分类与话题模块](#分类与话题模块)

## 基础说明

### 接口基础地址
```
开发环境: https://dev-api.campuswall.example.com
生产环境: https://api.campuswall.example.com
```

### 请求头要求
```
Content-Type: application/json
Authorization: Bearer {token} (需要鉴权的接口)
```

### 响应格式
所有API响应均使用JSON格式，基础结构如下：
```json
{
  "code": 0,       // 状态码，0表示成功，非0表示失败
  "msg": "success", // 状态描述
  "data": {}       // 响应数据，不同接口返回不同结构
}
```

## 接口规范

### 分页参数格式
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

示例：`"2023-05-20T08:30:45.123Z"`

### 认证方式
基于JWT的Token认证：
- 客户端登录成功后获取token
- 后续请求在Header中添加：`Authorization: Bearer {token}`
- token过期返回401状态码，客户端需重新登录

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

## 用户模块

### 用户登录
- **接口路径**：`/api/auth/login`
- **请求方式**：`POST`
- **请求参数**：
```json
{
  "username": "string", // 用户名/手机号/邮箱
  "password": "string"  // 密码
}
```
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "username": "张三",
      "avatar": "https://example.com/avatar.jpg",
      "phone": "1391234****", // 脱敏
      "email": "zh****@example.com", // 脱敏
      "role": "student",
      "createdAt": "2023-01-15T08:30:00.000Z"
    }
  }
}
```

### 用户注册
- **接口路径**：`/api/auth/register`
- **请求方式**：`POST`
- **请求参数**：
```json
{
  "username": "string", // 用户名，长度3-20个字符
  "password": "string", // 密码，长度6-20个字符
  "phone": "string",    // 手机号
  "email": "string",    // 邮箱
  "verifyCode": "string" // 验证码
}
```
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user123",
      "username": "张三",
      "avatar": "https://example.com/default-avatar.jpg",
      "phone": "1391234****", // 脱敏
      "email": "zh****@example.com", // 脱敏
      "role": "student",
      "createdAt": "2023-05-20T08:30:00.000Z"
    }
  }
}
```

### 发送验证码
- **接口路径**：`/api/auth/sendVerifyCode`
- **请求方式**：`POST`
- **请求参数**：
```json
{
  "phone": "string", // 手机号
  "type": "register"  // 类型：register-注册，resetPwd-重置密码
}
```
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "expireTime": 300 // 验证码有效期（秒）
  }
}
```

### 重置密码
- **接口路径**：`/api/auth/resetPassword`
- **请求方式**：`POST`
- **请求参数**：
```json
{
  "phone": "string",    // 手机号
  "verifyCode": "string", // 验证码
  "newPassword": "string" // 新密码
}
```
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```

### 获取用户信息
- **接口路径**：`/api/users/info`
- **请求方式**：`GET`
- **请求参数**：无（从token中获取用户ID）
- **请求头**：需要Authorization
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": "user123",
    "username": "张三",
    "avatar": "https://example.com/avatar.jpg",
    "phone": "1391234****",
    "email": "zh****@example.com",
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

### 更新用户信息
- **接口路径**：`/api/users/info`
- **请求方式**：`PUT`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "username": "string", // 可选
  "avatar": "string",   // 可选，头像URL
  "gender": "male",     // 可选，性别
  "bio": "string",      // 可选，个人简介
  "school": "string",   // 可选，学校
  "department": "string"// 可选，院系
}
```
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```

### 获取用户帖子列表
- **接口路径**：`/api/users/posts`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **请求参数**：
```
page: 1         // 页码
pageSize: 10    // 每页条数
type: published // 类型：published-已发布, drafts-草稿, favorite-收藏
```
- **响应结果**：同帖子列表接口

### 检查Token有效性
- **接口路径**：`/api/auth/checkToken`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "valid": true
  }
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
schoolId: 1     // 可选，学校ID
```
- **响应结果**：
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
          "username": "张三",
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

### 获取帖子详情
- **接口路径**：`/api/posts/{id}`
- **请求方式**：`GET`
- **请求参数**：路径参数id
- **响应结果**：
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
      "username": "张三",
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
- **响应结果**：
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

### 更新帖子
- **接口路径**：`/api/posts/{id}`
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
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```

### 删除帖子
- **接口路径**：`/api/posts/{id}`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```

### 点赞帖子
- **接口路径**：`/api/likes/posts/{id}/like`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "likeCount": 31  // 最新点赞数量
  }
}
```

### 取消点赞帖子
- **接口路径**：`/api/likes/posts/{id}/like`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "likeCount": 30  // 最新点赞数量
  }
}
```

### 收藏帖子
- **接口路径**：`/api/favorites/posts/{id}/favorite`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "favoriteCount": 11  // 最新收藏数量
  }
}
```

### 取消收藏帖子
- **接口路径**：`/api/favorites/posts/{id}/favorite`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "favoriteCount": 10  // 最新收藏数量
  }
}
```

## 评论模块

### 获取评论列表
- **接口路径**：`/api/comments/posts/{postId}/comments`
- **请求方式**：`GET`
- **请求参数**：
```
page: 1       // 页码
pageSize: 10  // 每页条数
sort: latest  // 排序方式：latest-最新, hot-热门
```
- **响应结果**：
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
          "username": "张三",
          "avatar": "https://example.com/avatar.jpg"
        },
        "replyTo": {          // 回复的评论，如果不是回复则为null
          "id": "comment456",
          "content": "被回复的评论",
          "author": {
            "id": "user456",
            "username": "李四",
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
- **接口路径**：`/api/comments/posts/{postId}/comments`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：
```json
{
  "content": "string",  // 评论内容
  "replyTo": "string"   // 可选，回复的评论ID
}
```
- **响应结果**：
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

### 删除评论
- **接口路径**：`/api/comments/{id}`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```

### 点赞评论
- **接口路径**：`/api/likes/comments/{id}/like`
- **请求方式**：`POST`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "likeCount": 13  // 最新点赞数量
  }
}
```

### 取消点赞评论
- **接口路径**：`/api/likes/comments/{id}/like`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "likeCount": 12  // 最新点赞数量
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
- **响应结果**：
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
          "username": "李四",
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
- **接口路径**：`/api/messages/unread`
- **请求方式**：`GET`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
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
- **接口路径**：`/api/messages/{id}/read`
- **请求方式**：`PUT`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
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
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "count": 25 // 标记为已读的消息数量
  }
}
```

### 删除消息
- **接口路径**：`/api/messages/{id}`
- **请求方式**：`DELETE`
- **请求头**：需要Authorization
- **请求参数**：无
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": null
}
```

## 文件上传

### 上传图片
- **接口路径**：`/api/upload/image`
- **请求方式**：`POST`
- **请求头**：
```
Content-Type: multipart/form-data
Authorization: Bearer {token}
```
- **请求参数**：
```
file: (二进制文件)  // 图片文件
type: post         // 可选，用途: post-帖子, avatar-头像
```
- **响应结果**：
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

## 分类与话题模块

### 获取分类列表
- **接口路径**：`/api/categories`
- **请求方式**：`GET`
- **请求参数**：无
- **响应结果**：
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

### 获取热门话题
- **接口路径**：`/api/topics/hot`
- **请求方式**：`GET`
- **请求参数**：
```
limit: 10  // 返回数量，默认10
```
- **响应结果**：
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
- **响应结果**：
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
        "id": 3,
        "name": "考试复习",
        "postCount": 120,
        "isHot": false
      }
    ]
  }
}
```

## 搜索模块

### 搜索帖子
- **接口路径**：`/api/search/posts`
- **请求方式**：`GET`
- **请求参数**：
```
keyword: "考试"  // 搜索关键词
page: 1         // 页码
pageSize: 10    // 每页条数
categoryId: 1   // 可选，分类ID
```
- **响应结果**：同帖子列表接口

### 获取热搜关键词
- **接口路径**：`/api/search/hotKeywords`
- **请求方式**：`GET`
- **请求参数**：
```
limit: 10  // 返回数量，默认10
```
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "keyword": "期末考试",
        "count": 1256
      },
      {
        "keyword": "社团招新",
        "count": 987
      }
    ]
  }
}
```

## 系统配置

### 获取应用配置
- **接口路径**：`/api/config`
- **请求方式**：`GET`
- **请求参数**：无
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "version": "1.0.0",
    "forceUpdate": false,
    "updateUrl": "https://example.com/download",
    "aboutUs": "https://example.com/about",
    "userAgreement": "https://example.com/agreement",
    "privacyPolicy": "https://example.com/privacy",
    "contactEmail": "support@example.com",
    "banner": [
      {
        "id": 1,
        "imageUrl": "https://example.com/banner1.jpg",
        "linkUrl": "https://example.com/activity1",
        "title": "校园活动"
      }
    ]
  }
}
```

### 获取学校列表
- **接口路径**：`/api/schools`
- **请求方式**：`GET`
- **请求参数**：
```
keyword: "北京"  // 可选，搜索关键词
page: 1         // 页码
pageSize: 10    // 每页条数
```
- **响应结果**：
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "北京大学",
        "shortName": "北大",
        "logo": "https://example.com/pku-logo.png",
        "location": {
          "province": "北京市",
          "city": "北京市",
          "address": "北京市海淀区颐和园路5号"
        }
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

## 数据模型参考

### 用户模型
```json
{
  "id": "string",        // 用户ID
  "username": "string",  // 用户名
  "password": "string",  // 密码（后端存储时加密）
  "avatar": "string",    // 头像URL
  "phone": "string",     // 手机号
  "email": "string",     // 邮箱
  "role": "string",      // 角色：student-学生, teacher-教师, admin-管理员
  "gender": "string",    // 性别：male-男, female-女, other-其他
  "bio": "string",       // 个人简介
  "school": "string",    // 学校
  "department": "string",// 院系
  "isDisabled": "boolean", // 是否禁用
  "createdAt": "string", // 创建时间
  "updatedAt": "string"  // 更新时间
}
```

### 帖子模型
```json
{
  "id": "string",        // 帖子ID
  "title": "string",     // 帖子标题
  "content": "string",   // 帖子内容
  "images": ["string"],  // 图片URL数组
  "authorId": "string",  // 作者ID
  "categoryId": "number", // 分类ID
  "status": "string",    // 状态：published-已发布, draft-草稿, deleted-已删除
  "location": {          // 位置信息
    "name": "string",    // 位置名称
    "longitude": "number", // 经度
    "latitude": "number"   // 纬度
  },
  "viewCount": "number", // 浏览量
  "likeCount": "number", // 点赞数
  "commentCount": "number", // 评论数
  "favoriteCount": "number", // 收藏数
  "isTop": "boolean",    // 是否置顶
  "createdAt": "string", // 创建时间
  "updatedAt": "string"  // 更新时间
}
```

### 评论模型
```json
{
  "id": "string",        // 评论ID
  "content": "string",   // 评论内容
  "authorId": "string",  // 作者ID
  "postId": "string",    // 帖子ID
  "replyTo": "string",   // 回复的评论ID（可选）
  "likeCount": "number", // 点赞数
  "status": "string",    // 状态：normal-正常, deleted-已删除
  "createdAt": "string", // 创建时间
  "updatedAt": "string"  // 更新时间
}
```

### 消息模型
```json
{
  "id": "string",        // 消息ID
  "type": "string",      // 类型：comment-评论, like-点赞, system-系统, follow-关注
  "title": "string",     // 标题
  "content": "string",   // 内容
  "senderId": "string",  // 发送者ID（可选）
  "receiverId": "string", // 接收者ID
  "postId": "string",    // 相关帖子ID（可选）
  "commentId": "string", // 相关评论ID（可选）
  "isRead": "boolean",   // 是否已读
  "createdAt": "string", // 创建时间
  "updatedAt": "string"  // 更新时间
}
```

## 基础URL

所有API路径基于以下基础URL:

- 开发环境: http://172.168.2.101:3000 或 http://localhost:3000
- 测试环境: [待定]
- 生产环境: [待定]

## API路径前缀

所有API使用`/api`前缀，并根据资源类型进一步分组:

- 认证API: `/api/auth/...`
- 用户API: `/api/users/...`
- 帖子API: `/api/posts/...`
- 评论API: `/api/comments/...`
- 点赞API: `/api/likes/...`
- 收藏API: `/api/favorites/...`
- 关注API: `/api/follows/...`
- 消息API: `/api/messages/...`
- 话题API: `/api/topics/...`
- 分类API: `/api/categories/...`
- 上传API: `/api/upload/...`