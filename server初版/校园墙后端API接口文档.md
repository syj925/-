# 校园墙后端API接口文档

## 目录
1. [基础信息](#基础信息)
2. [通用响应格式](#通用响应格式)
3. [用户认证相关接口](#1-用户认证相关接口)
   - [3.1 用户注册](#11-用户注册)
   - [3.2 用户登录](#12-用户登录)
   - [3.3 获取当前用户信息](#13-获取当前用户信息)
   - [3.4 更新用户信息](#14-更新用户信息)
4. [帖子相关接口](#2-帖子相关接口)
   - [4.1 获取帖子列表](#21-获取帖子列表)
   - [4.2 获取单个帖子详情](#22-获取单个帖子详情)
   - [4.3 创建帖子](#23-创建帖子)
   - [4.4 更新帖子](#24-更新帖子)
   - [4.5 删除帖子](#25-删除帖子)
5. [评论相关接口](#3-评论相关接口)
   - [5.1 获取帖子评论列表](#31-获取帖子评论列表)
   - [5.2 添加评论](#32-添加评论)
   - [5.3 删除评论](#33-删除评论)
   - [5.4 点赞评论](#34-点赞评论)
   - [5.5 取消评论点赞](#35-取消评论点赞)
6. [点赞/收藏相关接口](#4-点赞收藏相关接口)
   - [6.1 点赞帖子](#41-点赞帖子)
   - [6.2 取消帖子点赞](#42-取消帖子点赞)
   - [6.3 收藏帖子](#43-收藏帖子)
   - [6.4 取消帖子收藏](#44-取消帖子收藏)
   - [6.5 获取用户点赞的帖子列表](#45-获取用户点赞的帖子列表)
   - [6.6 获取用户收藏的帖子列表](#46-获取用户收藏的帖子列表)
7. [用户关系管理接口](#5-用户关系管理接口)
   - [7.1 关注用户](#51-关注用户)
   - [7.2 取消关注用户](#52-取消关注用户)
   - [7.3 获取用户关注列表](#53-获取用户关注列表)
   - [7.4 获取用户粉丝列表](#54-获取用户粉丝列表)
8. [话题和搜索功能接口](#6-话题和搜索功能接口)
   - [8.1 获取热门话题](#61-获取热门话题)
   - [8.2 获取话题列表](#62-获取话题列表)
   - [8.3 获取话题详情](#63-获取话题详情)
   - [8.4 获取话题下的帖子](#64-获取话题下的帖子)
   - [8.5 创建话题](#65-创建话题仅管理员)
   - [8.6 更新话题](#66-更新话题仅管理员)
   - [8.7 搜索](#67-搜索)
   - [8.8 搜索帖子](#68-搜索帖子)
9. [系统接口](#3-系统接口)
   - [9.1 健康检查](#31-健康检查)
10. [数据模型](#4-数据模型)
11. [错误代码](#5-错误代码)
12. [认证说明](#6-认证说明)
13. [接口开发计划](#7-接口开发计划)

## 基础信息
- 基础URL: `http://localhost:12346/api`
- 所有请求头需要包含: `Content-Type: application/json`
- 认证请求头: `Authorization: Bearer {token}`（需要认证的接口）

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "message": "操作成功消息",
  "data": {
    // 响应数据，具体结构根据接口不同而变化
  }
}
```

### 错误响应
```json
{
  "success": false,
  "message": "错误消息"
}
```

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
- **成功响应**: (状态码: 201)
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
- **错误响应**:
  - 账号已存在: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "该账号已被注册"
  }
  ```
  - 缺少必要字段: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "请提供账号和密码"
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
- **成功响应**: (状态码: 200)
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
- **错误响应**:
  - 账号或密码错误: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "账号或密码错误"
  }
  ```
  - 账号被禁用: (状态码: 403)
  ```json
  {
    "success": false,
    "message": "账号已被禁用，请联系管理员"
  }
  ```

### 1.3 获取当前用户信息
- **接口**: `GET /auth/me`
- **描述**: 获取当前登录用户的详细信息
- **认证**: 需要
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nickname": "用户昵称",
    "username": "账号",
    "avatar": "头像URL",
    "bio": "个人简介",
    "email": "邮箱",
    "role": "user",
    "status": "active",
    "createdAt": "2023-05-10T12:00:00Z",
    "updatedAt": "2023-05-10T12:00:00Z"
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 用户不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "用户不存在"
  }
  ```

### 1.4 更新用户信息
- **接口**: `PUT /auth/me`
- **描述**: 更新当前用户信息
- **认证**: 需要
- **请求体**: (所有字段可选)
```json
{
  "nickname": "新昵称",
  "email": "新邮箱",
  "avatar": "新头像URL",
  "bio": "新个人简介"
}
```
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "id": 1,
    "nickname": "新昵称",
    "avatar": "新头像URL"
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 用户不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "用户不存在"
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
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "content": "帖子内容",
        "images": ["图片URL1", "图片URL2"],
        "topics": ["话题1", "话题2"],
        "categoryId": 1,
        "likes": 56,
        "comments": 7,
        "collections": 12,
        "views": 100,
        "status": "published",
        "createdAt": "2023-06-10T12:30:45Z",
        "updatedAt": "2023-06-10T12:30:45Z",
        "userId": 101,
        "username": "发布者昵称",
        "avatar": "发布者头像URL",
        "isLiked": false,
        "isCollected": false,
        "latestComments": [
          {
            "id": 1,
            "userId": 102,
            "username": "评论者昵称",
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
- **参数**:
  - `id`: 帖子ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "content": "帖子内容",
    "images": ["图片URL1", "图片URL2"],
    "topics": ["话题1", "话题2"],
    "categoryId": 1,
    "likes": 56,
    "comments": 7,
    "collections": 12,
    "views": 101,
    "status": "published",
    "createdAt": "2023-06-10T12:30:45Z",
    "updatedAt": "2023-06-10T12:30:45Z",
    "userId": 101,
    "username": "发布者昵称",
    "avatar": "发布者头像URL",
    "isLiked": false,
    "isCollected": false
  }
}
```
- **错误响应**:
  - 帖子不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "帖子不存在或已被删除"
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
- **成功响应**: (状态码: 201)
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
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 缺少内容: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "请提供帖子内容"
  }
  ```

### 2.4 更新帖子
- **接口**: `PUT /posts/:id`
- **描述**: 更新帖子内容
- **认证**: 需要
- **参数**:
  - `id`: 帖子ID（路径参数）
- **请求体**: (所有字段可选)
```json
{
  "content": "更新的内容",
  "images": ["新图片URL1", "新图片URL2"],
  "topics": ["新话题1", "新话题2"],
  "categoryId": 2
}
```
- **成功响应**: (状态码: 200)
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
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 帖子不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "帖子不存在"
  }
  ```
  - 无权更新: (状态码: 403)
  ```json
  {
    "success": false,
    "message": "无权修改此帖子"
  }
  ```

### 2.5 删除帖子
- **接口**: `DELETE /posts/:id`
- **描述**: 删除帖子
- **认证**: 需要
- **参数**:
  - `id`: 帖子ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "帖子删除成功"
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 帖子不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "帖子不存在"
  }
  ```
  - 无权删除: (状态码: 403)
  ```json
  {
    "success": false,
    "message": "无权删除此帖子"
  }
  ```

## 3. 评论相关接口

### 3.1 获取帖子评论列表
- **接口**: `GET /posts/:postId/comments`
- **描述**: 获取指定帖子的评论列表
- **参数**:
  - `postId`: 帖子ID（路径参数）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "comments": [
      {
        "id": 1,
        "content": "评论内容",
        "likes": 15,
        "createdAt": "2023-06-10T12:30:45Z",
        "userId": 101,
        "username": "评论者昵称",
        "avatar": "评论者头像URL",
        "isLiked": false,
        "replies": [
          {
            "id": 2,
            "content": "回复内容",
            "likes": 5,
            "createdAt": "2023-06-10T12:35:45Z",
            "userId": 102,
            "username": "回复者昵称",
            "avatar": "回复者头像URL",
            "isLiked": false
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
- **错误响应**:
  - 帖子不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "帖子不存在"
  }
  ```

### 3.2 添加评论
- **接口**: `POST /posts/:postId/comments`
- **描述**: 添加评论到指定帖子
- **认证**: 需要
- **参数**:
  - `postId`: 帖子ID（路径参数）
- **请求体**:
```json
{
  "content": "评论内容",
  "parentId": null  // 可选，回复某条评论时提供父评论ID
}
```
- **成功响应**: (状态码: 201)
```json
{
  "success": true,
  "message": "评论发布成功",
  "data": {
    "id": 1,
    "content": "评论内容",
    "createdAt": "2023-06-10T12:30:45Z",
    "userId": 101,
    "username": "评论者昵称",
    "avatar": "评论者头像URL",
    "parentId": null,
    "likes": 0,
    "isLiked": false
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 帖子不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "帖子不存在"
  }
  ```
  - 父评论不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "父评论不存在"
  }
  ```

### 3.3 删除评论
- **接口**: `DELETE /comments/:id`
- **描述**: 删除指定评论
- **认证**: 需要
- **参数**:
  - `id`: 评论ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "评论删除成功"
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 评论不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "评论不存在"
  }
  ```
  - 无权删除: (状态码: 403)
  ```json
  {
    "success": false,
    "message": "无权删除此评论"
  }
  ```

### 3.4 点赞评论
- **接口**: `POST /comments/:id/like`
- **描述**: 点赞指定评论
- **认证**: 需要
- **参数**:
  - `id`: 评论ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "点赞成功",
  "data": {
    "likeCount": 16
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 评论不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "评论不存在"
  }
  ```

### 3.5 取消评论点赞
- **接口**: `DELETE /comments/:id/like`
- **描述**: 取消对指定评论的点赞
- **认证**: 需要
- **参数**:
  - `id`: 评论ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "取消点赞成功",
  "data": {
    "likeCount": 15
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 评论不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "评论不存在"
  }
  ```

## 4. 点赞/收藏相关接口

### 4.1 点赞帖子
- **接口**: `POST /posts/:id/like`
- **描述**: 点赞指定帖子
- **认证**: 需要
- **参数**:
  - `id`: 帖子ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "点赞成功",
  "data": {
    "likeCount": 57
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 帖子不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "帖子不存在"
  }
  ```
  - 已点赞: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "已经点赞过该帖子"
  }
  ```

### 4.2 取消帖子点赞
- **接口**: `DELETE /posts/:id/like`
- **描述**: 取消对指定帖子的点赞
- **认证**: 需要
- **参数**:
  - `id`: 帖子ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "取消点赞成功",
  "data": {
    "likeCount": 56
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 帖子不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "帖子不存在"
  }
  ```
  - 未点赞: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "未点赞过该帖子"
  }
  ```

### 4.3 收藏帖子
- **接口**: `POST /posts/:id/collect`
- **描述**: 收藏指定帖子
- **认证**: 需要
- **参数**:
  - `id`: 帖子ID（路径参数）
- **请求体**:
```json
{
  "name": "自定义收藏夹名称"  // 可选
}
```
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "收藏成功",
  "data": {
    "collectionCount": 13
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 帖子不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "帖子不存在"
  }
  ```
  - 已收藏: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "已经收藏过该帖子"
  }
  ```

### 4.4 取消帖子收藏
- **接口**: `DELETE /posts/:id/collect`
- **描述**: 取消对指定帖子的收藏
- **认证**: 需要
- **参数**:
  - `id`: 帖子ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "取消收藏成功",
  "data": {
    "collectionCount": 12
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 帖子不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "帖子不存在"
  }
  ```
  - 未收藏: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "未收藏过该帖子"
  }
  ```

### 4.5 获取用户点赞的帖子列表
- **接口**: `GET /users/:id/likes/posts`
- **描述**: 获取指定用户点赞的帖子列表
- **认证**: 需要
- **参数**:
  - `id`: 用户ID（路径参数）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "content": "帖子内容",
        "images": ["图片URL1", "图片URL2"],
        "topics": ["话题1", "话题2"],
        "likes": 56,
        "comments": 7,
        "collections": 12,
        "views": 100,
        "createdAt": "2023-06-10T12:30:45Z",
        "author": {
          "id": 101,
          "nickname": "发布者昵称",
          "username": "发布者账号",
          "avatar": "发布者头像URL"
        }
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
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 用户不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "用户不存在"
  }
  ```
  - 无权查看: (状态码: 403)
  ```json
  {
    "success": false,
    "message": "无权查看该用户的点赞列表"
  }
  ```

### 4.6 获取用户收藏的帖子列表
- **接口**: `GET /users/:id/collections`
- **描述**: 获取指定用户收藏的帖子列表
- **认证**: 需要
- **参数**:
  - `id`: 用户ID（路径参数）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "content": "帖子内容",
        "images": ["图片URL1", "图片URL2"],
        "topics": ["话题1", "话题2"],
        "likes": 56,
        "comments": 7,
        "collections": 12,
        "views": 100,
        "createdAt": "2023-06-10T12:30:45Z",
        "author": {
          "id": 101,
          "nickname": "发布者昵称",
          "username": "发布者账号",
          "avatar": "发布者头像URL"
        },
        "collectionName": "自定义收藏夹名称",
        "collectedAt": "2023-06-15T08:45:30Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 35,
      "pages": 2
    }
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 用户不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "用户不存在"
  }
  ```
  - 无权查看: (状态码: 403)
  ```json
  {
    "success": false,
    "message": "无权查看该用户的收藏列表"
  }
  ```

### 4.7 点赞模型
```
{
  id: 整数,
  userId: 整数(点赞用户ID),
  targetType: 枚举('post', 'comment'),
  targetId: 整数(帖子或评论ID),
  createdAt: 日期时间,
  updatedAt: 日期时间
}
```

### 4.8 收藏模型
```
{
  id: 整数,
  userId: 整数(收藏用户ID),
  postId: 整数(帖子ID),
  name: 字符串(收藏夹名称，可选),
  createdAt: 日期时间,
  updatedAt: 日期时间
}
```

### 4.9 关注关系模型
```
{
  id: 整数,
  followerId: 整数(关注者ID),
  followingId: 整数(被关注者ID),
  remark: 字符串(备注名，可选),
  createdAt: 日期时间,
  updatedAt: 日期时间
}
```

### 4.10 话题模型
```
{
  id: 整数,
  name: 字符串(话题名称),
  description: 文本(话题描述),
  coverImage: 字符串(封面图URL),
  usageCount: 整数(使用次数),
  status: 枚举('active', 'hidden', 'deleted'),
  createdAt: 日期时间,
  updatedAt: 日期时间,
  deletedAt: 日期时间(软删除)
}
```

### 4.11 帖子话题关联模型
```
{
  id: 整数,
  postId: 整数(帖子ID),
  topicId: 整数(话题ID),
  createdAt: 日期时间,
  updatedAt: 日期时间
}
```

## 5. 用户关系管理接口

### 5.1 关注用户
- **接口**: `POST /users/:id/follow`
- **描述**: 关注指定用户
- **认证**: 需要
- **参数**:
  - `id`: 被关注用户ID（路径参数）
- **请求体**:
```json
{
  "remark": "备注名称"  // 可选
}
```
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "关注成功"
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 用户不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "用户不存在"
  }
  ```
  - 已关注: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "已经关注过该用户"
  }
  ```
  - 不能关注自己: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "不能关注自己"
  }
  ```

### 5.2 取消关注用户
- **接口**: `DELETE /users/:id/follow`
- **描述**: 取消关注指定用户
- **认证**: 需要
- **参数**:
  - `id`: 被关注用户ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "取消关注成功"
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 未关注: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "未关注过该用户"
  }
  ```

### 5.3 获取用户关注列表
- **接口**: `GET /users/:id/following`
- **描述**: 获取指定用户的关注列表
- **参数**:
  - `id`: 用户ID（路径参数）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "following": [
      {
        "id": 102,
        "nickname": "用户昵称",
        "username": "用户账号",
        "avatar": "用户头像URL",
        "bio": "个人简介",
        "remark": "备注名称",
        "followedAt": "2023-06-20T10:15:30Z",
        "isFollowed": false
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```
- **错误响应**:
  - 用户不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "用户不存在"
  }
  ```

### 5.4 获取用户粉丝列表
- **接口**: `GET /users/:id/followers`
- **描述**: 获取指定用户的粉丝列表
- **参数**:
  - `id`: 用户ID（路径参数）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "followers": [
      {
        "id": 103,
        "nickname": "粉丝昵称",
        "username": "粉丝账号",
        "avatar": "粉丝头像URL",
        "bio": "个人简介",
        "followedAt": "2023-06-21T14:25:10Z",
        "isFollowed": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 60,
      "pages": 3
    }
  }
}
```
- **错误响应**:
  - 用户不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "用户不存在"
  }
  ```

## 6. 话题和搜索功能接口

### 6.1 获取热门话题
- **接口**: `GET /topics/hot`
- **描述**: 获取热门话题列表
- **参数**:
  - `limit`: 获取数量（默认10）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "话题名称",
      "description": "话题描述",
      "coverImage": "话题封面图URL",
      "usageCount": 325,
      "status": "active",
      "createdAt": "2023-05-15T08:30:00Z"
    }
  ]
}
```

### 6.2 获取话题列表
- **接口**: `GET /topics`
- **描述**: 获取话题列表，支持分页和搜索
- **参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
  - `search`: 搜索关键词（可选）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": 1,
        "name": "话题名称",
        "description": "话题描述",
        "coverImage": "话题封面图URL",
        "usageCount": 325,
        "status": "active",
        "createdAt": "2023-05-15T08:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 85,
      "pages": 5
    }
  }
}
```

### 6.3 获取话题详情
- **接口**: `GET /topics/:id`
- **描述**: 获取指定话题的详细信息
- **参数**:
  - `id`: 话题ID（路径参数）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "话题名称",
    "description": "话题描述",
    "coverImage": "话题封面图URL",
    "usageCount": 325,
    "status": "active",
    "createdAt": "2023-05-15T08:30:00Z",
    "updatedAt": "2023-06-20T12:45:30Z"
  }
}
```
- **错误响应**:
  - 话题不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "话题不存在"
  }
  ```

### 6.4 获取话题下的帖子
- **接口**: `GET /topics/:id/posts`
- **描述**: 获取指定话题下的帖子列表
- **参数**:
  - `id`: 话题ID（路径参数）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "topic": {
      "id": 1,
      "name": "话题名称",
      "description": "话题描述",
      "coverImage": "话题封面图URL",
      "usageCount": 325
    },
    "posts": [
      {
        "id": 1,
        "content": "帖子内容",
        "images": ["图片URL1", "图片URL2"],
        "likes": 56,
        "comments": 7,
        "collections": 12,
        "views": 100,
        "status": "published",
        "createdAt": "2023-06-10T12:30:45Z",
        "author": {
          "id": 101,
          "nickname": "发布者昵称",
          "username": "发布者账号",
          "avatar": "发布者头像URL"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```
- **错误响应**:
  - 话题不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "话题不存在或已删除"
  }
  ```

### 6.5 创建话题（仅管理员）
- **接口**: `POST /topics`
- **描述**: 创建新话题
- **认证**: 需要（管理员）
- **请求体**:
```json
{
  "name": "话题名称",
  "description": "话题描述"
}
```
- **成功响应**: (状态码: 201)
```json
{
  "success": true,
  "message": "话题创建成功",
  "data": {
    "id": 1,
    "name": "话题名称",
    "description": "话题描述",
    "usageCount": 0,
    "status": "active",
    "createdAt": "2023-06-25T09:20:15Z"
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 权限不足: (状态码: 403)
  ```json
  {
    "success": false,
    "message": "需要管理员权限才能访问"
  }
  ```
  - 话题已存在: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "话题已存在"
  }
  ```

### 6.6 更新话题（仅管理员）
- **接口**: `PUT /topics/:id`
- **描述**: 更新指定话题
- **认证**: 需要（管理员）
- **参数**:
  - `id`: 话题ID（路径参数）
- **请求体**:
```json
{
  "name": "新话题名称",
  "description": "新话题描述",
  "status": "active",
  "coverImage": "新封面图URL"
}
```
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "话题更新成功",
  "data": {
    "id": 1,
    "name": "新话题名称",
    "description": "新话题描述",
    "coverImage": "新封面图URL",
    "status": "active",
    "updatedAt": "2023-06-26T11:30:20Z"
  }
}
```
- **错误响应**:
  - 未授权: (状态码: 401)
  ```json
  {
    "success": false,
    "message": "未授权访问，请先登录"
  }
  ```
  - 权限不足: (状态码: 403)
  ```json
  {
    "success": false,
    "message": "需要管理员权限才能访问"
  }
  ```
  - 话题不存在: (状态码: 404)
  ```json
  {
    "success": false,
    "message": "话题不存在"
  }
  ```
  - 话题名称已存在: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "话题名称已存在"
  }
  ```

### 6.7 搜索
- **接口**: `GET /search`
- **描述**: 全局搜索帖子、用户和话题
- **参数**:
  - `keyword`: 搜索关键词（必需）
  - `type`: 搜索类型（all, post, user, topic，默认all）
  - `page`: 页码（默认1，当type不为all时有效）
  - `limit`: 每页数量（默认20，当type不为all时有效）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "posts": {
      "data": [
        {
          "id": 1,
          "content": "帖子内容",
          "images": ["图片URL1", "图片URL2"],
          "likes": 56,
          "comments": 7,
          "collections": 12,
          "views": 100,
          "createdAt": "2023-06-10T12:30:45Z",
          "author": {
            "id": 101,
            "nickname": "发布者昵称",
            "username": "发布者账号",
            "avatar": "发布者头像URL"
          }
        }
      ],
      "total": 50
    },
    "users": {
      "data": [
        {
          "id": 103,
          "nickname": "用户昵称",
          "username": "用户账号",
          "avatar": "用户头像URL",
          "bio": "个人简介"
        }
      ],
      "total": 25
    },
    "topics": {
      "data": [
        {
          "id": 1,
          "name": "话题名称",
          "description": "话题描述",
          "coverImage": "话题封面图URL",
          "usageCount": 325
        }
      ],
      "total": 10
    }
  }
}
```
- **错误响应**:
  - 未提供关键词: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "请提供搜索关键词"
  }
  ```

### 6.8 搜索帖子
- **接口**: `GET /search/posts`
- **描述**: 专门搜索帖子，支持话题筛选
- **参数**:
  - `keyword`: 搜索关键词（可选，与topicId至少需要一个）
  - `topicId`: 话题ID（可选，与keyword至少需要一个）
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": 1,
        "content": "帖子内容",
        "images": ["图片URL1", "图片URL2"],
        "likes": 56,
        "comments": 7,
        "collections": 12,
        "views": 100,
        "createdAt": "2023-06-10T12:30:45Z",
        "author": {
          "id": 101,
          "nickname": "发布者昵称",
          "username": "发布者账号",
          "avatar": "发布者头像URL"
        },
        "topicList": [
          {
            "id": 1,
            "name": "话题名称"
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
- **错误响应**:
  - 未提供必要参数: (状态码: 400)
  ```json
  {
    "success": false,
    "message": "请提供搜索关键词或话题ID"
  }
  ```

## 7. 系统接口

### 7.1 健康检查
- **接口**: `GET /health`
- **描述**: 检查API服务状态
- **成功响应**: (状态码: 200)
```json
{
  "success": true,
  "message": "API 服务正常运行",
  "time": "2023-06-10T12:30:45Z"
}
```

## 8. 数据模型

### 8.1 用户模型
```
{
  id: 整数,
  nickname: 字符串,
  username: 字符串,
  password: 字符串(加密存储),
  avatar: 字符串(URL),
  bio: 文本,
  email: 字符串,
  role: 枚举('user', 'admin'),
  status: 枚举('active', 'inactive', 'banned'),
  createdAt: 日期时间,
  updatedAt: 日期时间,
  deletedAt: 日期时间(软删除)
}
```

### 8.2 帖子模型
```
{
  id: 整数,
  content: 文本,
  images: JSON字符串(图片URL数组),
  topics: JSON字符串(话题标签数组),
  categoryId: 整数,
  likes: 整数,
  comments: 整数,
  collections: 整数,
  views: 整数,
  status: 枚举('published', 'draft', 'hidden', 'deleted'),
  userId: 整数(发布者ID),
  createdAt: 日期时间,
  updatedAt: 日期时间,
  deletedAt: 日期时间(软删除)
}
```

### 8.3 评论模型
```
{
  id: 整数,
  content: 文本,
  likes: 整数,
  parentId: 整数(回复的评论ID),
  status: 枚举('active', 'hidden', 'deleted'),
  userId: 整数(评论者ID),
  postId: 整数(帖子ID),
  createdAt: 日期时间,
  updatedAt: 日期时间,
  deletedAt: 日期时间(软删除)
}
```

## 9. 错误代码

| 状态码 | 描述 |
| ----- | ---- |
| 200   | 请求成功 |
| 201   | 创建成功 |
| 400   | 请求参数错误 |
| 401   | 未授权访问 |
| 403   | 权限不足 |
| 404   | 资源不存在 |
| 500   | 服务器内部错误 |

## 10. 认证说明

本API使用JWT（JSON Web Token）进行认证，需要认证的接口必须在HTTP请求头中包含以下信息：

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token在用户登录或注册成功后获取，有效期为7天。

## 11. 接口开发计划

1. ✅ 用户认证（注册、登录、获取/更新用户信息）
2. ✅ 帖子管理（列表、详情、创建、更新、删除）
3. ✅ 评论功能
4. ✅ 点赞/收藏功能
5. ✅ 用户关系管理
6. ✅ 话题和搜索功能 