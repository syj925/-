# 上传模块 API

## 概述

上传模块提供文件上传功能，支持图片上传。

**Base URL**: `/api/upload`

---

## API 列表

### 1. 上传单张图片 (通用)

🔐 **需要登录**

```http
POST /api/upload
```

#### 请求参数

- Content-Type: `multipart/form-data`
- 字段名: `file`

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "url": "/uploads/images/2024/01/xxx.png",
    "originalname": "photo.png",
    "mimetype": "image/png",
    "size": 102400
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 500 | 上传失败 |
| 501 | 不支持的文件类型 |
| 502 | 文件大小超出限制 |

---

### 2. 上传单张图片

🔐 **需要登录**

```http
POST /api/upload/image
```

#### 请求参数

- Content-Type: `multipart/form-data`
- 字段名: `file`

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": {
    "url": "/uploads/images/2024/01/xxx.png",
    "originalname": "avatar.jpg",
    "mimetype": "image/jpeg",
    "size": 51200
  }
}
```

---

### 3. 上传多张图片

🔐 **需要登录**

```http
POST /api/upload/images
```

#### 请求参数

- Content-Type: `multipart/form-data`
- 字段名: `files`
- 最多 9 张图片

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "成功",
  "data": [
    {
      "url": "/uploads/images/2024/01/xxx1.png",
      "originalname": "photo1.png",
      "mimetype": "image/png",
      "size": 102400
    },
    {
      "url": "/uploads/images/2024/01/xxx2.png",
      "originalname": "photo2.png",
      "mimetype": "image/png",
      "size": 98304
    }
  ]
}
```

---

### 4. 上传轮播图

🔐 **需要登录**

```http
POST /api/upload/banner
```

#### 请求参数

- Content-Type: `multipart/form-data`
- 字段名: `file`
- 仅支持图片类型
- 最大 5MB

#### 响应示例

```json
{
  "success": true,
  "code": 0,
  "msg": "轮播图上传成功",
  "data": {
    "url": "/uploads/banners/2024/01/xxx.png",
    "originalname": "banner.png",
    "mimetype": "image/png",
    "size": 512000,
    "path": "/uploads/banners/2024/01/xxx.png"
  }
}
```

#### 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 只能上传图片文件 |
| 400 | 图片大小不能超过5MB |
| 500 | 轮播图上传失败 |

---

## 文件限制

| 类型 | 限制 |
|------|------|
| 支持格式 | jpg, jpeg, png, gif, webp |
| 单文件大小 | 最大 5MB |
| 批量上传 | 最多 9 张 |

---

## 使用说明

### 前端上传示例

```javascript
const formData = new FormData();
formData.append('file', file);

const response = await fetch('/api/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
if (result.code === 0) {
  console.log('上传成功:', result.data.url);
}
```

### 图片 URL 说明

- 返回的 `url` 是相对路径
- 前端需要拼接服务器 Base URL
- 示例: `http://localhost:3000` + `/uploads/images/xxx.png`
