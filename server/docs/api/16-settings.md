# 设置模块 API

## 概述

设置模块提供用户隐私设置的查询和更新功能。

**Base URL**: `/api/settings`

> 所有设置接口都需要登录

---

## API 列表

### 1. 获取用户设置

🔐 **需要登录**

```http
GET /api/settings
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "privacy": {
      "anonymousMode": false,
      "allowSearch": true,
      "showLocation": true,
      "allowFollow": true,
      "allowComment": true,
      "allowMessage": true,
      "favoriteVisible": true,
      "followListVisible": true,
      "fansListVisible": true
    }
  }
}
```

---

### 2. 更新用户设置

🔐 **需要登录**

```http
PUT /api/settings
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| privacy | object | 否 | 隐私设置对象 |

#### privacy 对象结构

| 参数 | 类型 | 说明 |
|------|------|------|
| anonymousMode | boolean | 匿名模式 |
| allowSearch | boolean | 允许被搜索 |
| showLocation | boolean | 显示位置 |
| allowFollow | boolean | 允许被关注 |
| allowComment | boolean | 允许评论 |
| allowMessage | boolean | 允许接收私信 |
| favoriteVisible | boolean | 收藏可见 |
| followListVisible | boolean | 关注列表可见 |
| fansListVisible | boolean | 粉丝列表可见 |

#### 请求示例

```json
{
  "privacy": {
    "anonymousMode": false,
    "allowMessage": true,
    "favoriteVisible": false
  }
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "设置更新成功",
  "data": {
    "privacy": {
      "anonymousMode": false,
      "allowSearch": true,
      "showLocation": true,
      "allowFollow": true,
      "allowComment": true,
      "allowMessage": true,
      "favoriteVisible": false,
      "followListVisible": true,
      "fansListVisible": true
    }
  }
}
```

---

### 3. 获取隐私设置

🔐 **需要登录**

```http
GET /api/settings/privacy
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "data": {
    "anonymousMode": false,
    "allowSearch": true,
    "showLocation": true,
    "allowFollow": true,
    "allowComment": true,
    "allowMessage": true,
    "favoriteVisible": true,
    "followListVisible": true,
    "fansListVisible": true
  }
}
```

---

### 4. 更新隐私设置

🔐 **需要登录**

```http
PUT /api/settings/privacy
```

#### 请求参数

所有参数均为可选，只需传递要更新的字段。

| 参数 | 类型 | 说明 |
|------|------|------|
| anonymousMode | boolean | 匿名模式 (开启后发帖默认匿名) |
| allowSearch | boolean | 允许其他用户通过搜索找到你 |
| showLocation | boolean | 在帖子中显示位置信息 |
| allowFollow | boolean | 允许其他用户关注你 |
| allowComment | boolean | 允许其他用户评论你的帖子 |
| allowMessage | boolean | 允许接收私信 |
| favoriteVisible | boolean | 你的收藏列表对其他用户可见 |
| followListVisible | boolean | 你的关注列表对其他用户可见 |
| fansListVisible | boolean | 你的粉丝列表对其他用户可见 |

#### 请求示例

```json
{
  "allowMessage": false,
  "favoriteVisible": false
}
```

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "隐私设置更新成功",
  "data": {
    "anonymousMode": false,
    "allowSearch": true,
    "showLocation": true,
    "allowFollow": true,
    "allowComment": true,
    "allowMessage": false,
    "favoriteVisible": false,
    "followListVisible": true,
    "fansListVisible": true
  }
}
```

---

## 设置项说明

### 匿名模式 (anonymousMode)

- 开启后，发布帖子时默认勾选"匿名发布"
- 匿名帖子不显示作者信息

### 允许搜索 (allowSearch)

- 关闭后，其他用户无法通过搜索功能找到你
- 仍可通过直接链接访问你的主页

### 显示位置 (showLocation)

- 开启后，发布帖子时可以选择添加位置信息
- 关闭后，位置选项不可用

### 允许关注 (allowFollow)

- 关闭后，其他用户无法关注你
- 已关注的用户不受影响

### 允许评论 (allowComment)

- 关闭后，其他用户无法评论你的帖子
- 你仍可以评论他人的帖子

### 允许私信 (allowMessage)

- 关闭后，其他用户无法向你发送私信
- 系统消息不受影响

### 收藏可见 (favoriteVisible)

- 关闭后，其他用户无法查看你的收藏列表
- 你仍可以正常收藏帖子

### 关注列表可见 (followListVisible)

- 关闭后，其他用户无法查看你关注了谁

### 粉丝列表可见 (fansListVisible)

- 关闭后，其他用户无法查看谁关注了你
