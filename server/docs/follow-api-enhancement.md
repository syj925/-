# 用户关系系统API增强文档

## 概述

本文档描述了用户关系系统的增强功能，包括批量关注状态检查、互相关注检查等高级功能。

## 新增API接口

### 1. 批量检查关注状态

**接口路径**：`POST /api/follows/batch-check`
**请求方式**：`POST`
**需要认证**：是

**请求参数**：
```json
{
  "userIds": ["user_id_1", "user_id_2", "user_id_3"]
}
```

**成功响应**：
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "user_id_1": true,
    "user_id_2": false,
    "user_id_3": true
  }
}
```

**使用场景**：
- 用户列表页面批量显示关注状态
- 推荐用户列表的关注状态检查

### 2. 检查两个用户是否互相关注

**接口路径**：`GET /api/follows/mutual/:user_id1/:user_id2`
**请求方式**：`GET`
**需要认证**：否

**路径参数**：
- `user_id1`: 用户1的ID
- `user_id2`: 用户2的ID

**成功响应**：
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "user1FollowsUser2": true,
    "user2FollowsUser1": true,
    "isMutual": true
  }
}
```

**使用场景**：
- 检查两个用户的关注关系
- 好友关系判断

### 3. 获取当前用户的互相关注列表

**接口路径**：`GET /api/follows/me/mutual`
**请求方式**：`GET`
**需要认证**：是

**查询参数**：
- `page`: 页码（可选，默认1）
- `pageSize`: 每页数量（可选，默认20）

**成功响应**：
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "list": [
      {
        "id": "follow_id",
        "follower_id": "user_id",
        "following_id": "current_user_id",
        "created_at": "2024-12-19T10:30:00Z",
        "follower": {
          "id": "user_id",
          "username": "username",
          "avatar": "avatar_url",
          "school": "学校名称",
          "department": "院系名称",
          "signature": "个人签名"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50
    }
  }
}
```

**使用场景**：
- 好友列表页面
- 互相关注用户推荐

### 4. 获取指定用户的互相关注列表

**接口路径**：`GET /api/follows/user/:user_id/mutual`
**请求方式**：`GET`
**需要认证**：否

**路径参数**：
- `user_id`: 用户ID

**查询参数**：
- `page`: 页码（可选，默认1）
- `pageSize`: 每页数量（可选，默认20）

**成功响应**：同上

## 数据模型增强

### User模型关联关系增强

新增了以下关联关系：

```javascript
// 用户作为关注者的关注关系
User.hasMany(models.Follow, {
  foreignKey: 'follower_id',
  as: 'followings'
});

// 用户作为被关注者的关注关系
User.hasMany(models.Follow, {
  foreignKey: 'following_id',
  as: 'followers'
});

// 用户通过关注关系关联到其他用户（关注的用户）
User.belongsToMany(models.User, {
  through: models.Follow,
  foreignKey: 'follower_id',
  otherKey: 'following_id',
  as: 'followingUsers'
});

// 用户通过关注关系关联到其他用户（粉丝用户）
User.belongsToMany(models.User, {
  through: models.Follow,
  foreignKey: 'following_id',
  otherKey: 'follower_id',
  as: 'followerUsers'
});
```

## 服务层增强

### FollowService新增方法

1. **batchCheckFollowStatus(followerId, userIds)**
   - 批量检查关注状态
   - 返回用户ID到关注状态的映射

2. **checkMutualFollow(userId1, userId2)**
   - 检查两个用户是否互相关注
   - 返回双向关注状态

3. **getMutualFollowings(userId, page, pageSize)**
   - 获取用户的互相关注列表
   - 支持分页

### FollowRepository新增方法

1. **batchCheckFollowStatus(followerId, userIds)**
   - 数据库层批量查询关注状态

2. **findMutualFollowings(userId, page, pageSize)**
   - 数据库层查询互相关注列表

## 性能优化

### 数据库索引

确保Follow表有以下索引：
```sql
-- 复合唯一索引，确保用户只能关注同一用户一次
CREATE UNIQUE INDEX idx_follow_unique ON follows(follower_id, following_id);

-- 关注者索引
CREATE INDEX idx_follow_follower ON follows(follower_id);

-- 被关注者索引
CREATE INDEX idx_follow_following ON follows(following_id);
```

### 查询优化

1. **批量查询**：使用IN操作符批量查询关注状态
2. **关联查询**：使用JOIN减少数据库查询次数
3. **分页查询**：使用LIMIT和OFFSET进行分页

## 错误处理

### 错误码定义

- `USER_NOT_EXIST`: 用户不存在
- `ALREADY_FOLLOWED`: 已关注该用户
- `INVALID_OPERATION`: 无效操作（如关注自己）

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

## 测试覆盖

已创建完整的测试用例，覆盖：
- 关注/取消关注功能
- 批量关注状态检查
- 互相关注检查
- 关注列表查询
- 错误处理

## 使用示例

### 前端调用示例

```javascript
// 批量检查关注状态
const checkFollowStatus = async (userIds) => {
  const response = await fetch('/api/follows/batch-check', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ userIds })
  });
  return response.json();
};

// 检查互相关注
const checkMutualFollow = async (userId1, userId2) => {
  const response = await fetch(`/api/follows/mutual/${userId1}/${userId2}`);
  return response.json();
};

// 获取互相关注列表
const getMutualFollowings = async (page = 1, pageSize = 20) => {
  const response = await fetch(`/api/follows/me/mutual?page=${page}&pageSize=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

## 后续优化建议

1. **缓存优化**：对热门用户的关注状态进行Redis缓存
2. **推送通知**：关注时发送实时通知
3. **推荐算法**：基于互相关注关系推荐用户
4. **隐私设置**：支持关注列表的隐私设置
