# 配置管理系统 API 文档

## 📋 概述

本文档描述了校园墙配置管理系统的所有API接口，包括前端App使用的公开接口和后台管理系统使用的管理接口。

## 🔗 基础信息

- **Base URL**: `http://localhost:3000`
- **API Version**: v1.0.0
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (管理接口)

## 📱 前端App接口

### 1. 获取配置版本信息

**接口描述**: 前端App用于检查配置版本更新

```http
GET /api/config-version
```

**请求参数**: 无

**响应示例**:
```json
{
  "code": 0,
  "message": "获取版本信息成功",
  "data": {
    "version": "1.1.0",
    "updateTime": "2025-01-25T10:30:00Z",
    "description": "优化敏感词过滤规则，调整发布限制",
    "forceUpdate": false,
    "downloadUrl": "/api/content-rules",
    "downloadCount": 156
  }
}
```

**字段说明**:
- `version`: 当前配置版本号
- `updateTime`: 版本发布时间
- `description`: 版本更新说明
- `forceUpdate`: 是否强制更新
- `downloadUrl`: 配置文件下载地址
- `downloadCount`: 下载次数统计

### 2. 获取配置内容

**接口描述**: 下载具体的配置规则内容

```http
GET /api/content-rules
```

**请求参数**: 无

**响应示例**:
```json
{
  "code": 0,
  "message": "获取验证规则成功",
  "data": {
    "minPostLength": 5,
    "maxPostLength": 1000,
    "enableSensitiveFilter": true,
    "sensitiveWords": ["广告", "推广", "微信", "QQ"],
    "sensitiveWordAction": "block",
    "dailyPostLimit": 10,
    "dailyCommentLimit": 50,
    "allowAnonymous": true,
    "maxImagesPerPost": 9,
    "maxImageSize": 5,
    "allowedImageTypes": ["jpg", "jpeg", "png", "gif", "webp"],
    "maxReplyLevel": 3
  }
}
```

## 🔧 管理后台接口

### 1. 获取当前配置版本

**接口描述**: 后台管理系统获取当前版本信息

```http
GET /api/admin/config-version
```

**请求头**:
```http
Authorization: Bearer <admin_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "version": "1.1.0",
    "updateTime": "2025-01-25T10:30:00Z",
    "description": "优化敏感词过滤规则",
    "forceUpdate": false,
    "downloadCount": 156
  }
}
```

### 2. 获取版本历史

**接口描述**: 获取所有配置版本的历史记录

```http
GET /api/admin/config-versions
```

**请求头**:
```http
Authorization: Bearer <admin_token>
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "version": "1.1.0",
      "updateTime": "2025-01-25T10:30:00Z",
      "description": "优化敏感词过滤规则",
      "forceUpdate": false,
      "downloadCount": 156
    },
    {
      "version": "1.0.0",
      "updateTime": "2025-01-20T09:00:00Z",
      "description": "初始版本",
      "forceUpdate": false,
      "downloadCount": 89
    }
  ]
}
```

### 3. 发布新配置版本

**接口描述**: 发布新的配置版本

```http
POST /api/admin/config-version
```

**请求头**:
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "version": "1.2.0",
  "description": "新增图片上传限制配置",
  "forceUpdate": false,
  "config": {
    "minPostLength": 5,
    "maxPostLength": 1000,
    "enableSensitiveFilter": true,
    "sensitiveWords": ["广告", "推广", "微信", "QQ"],
    "sensitiveWordAction": "block",
    "dailyPostLimit": 10,
    "dailyCommentLimit": 50,
    "allowAnonymous": true,
    "maxImagesPerPost": 6,
    "maxImageSize": 3,
    "allowedImageTypes": ["jpg", "jpeg", "png"],
    "maxReplyLevel": 3
  }
}
```

**字段说明**:
- `version`: 新版本号 (必填)
- `description`: 更新说明 (必填)
- `forceUpdate`: 是否强制更新 (可选，默认false)
- `config`: 具体配置内容 (必填)

**响应示例**:
```json
{
  "success": true,
  "message": "配置版本发布成功",
  "data": {
    "version": "1.2.0",
    "updateTime": "2025-01-25T15:00:00Z",
    "description": "新增图片上传限制配置",
    "forceUpdate": false,
    "downloadCount": 0
  }
}
```

### 4. 版本回滚

**接口描述**: 回滚到指定的历史版本

```http
POST /api/admin/config-rollback
```

**请求头**:
```http
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**请求体**:
```json
{
  "targetVersion": "1.0.0"
}
```

**响应示例**:
```json
{
  "success": true,
  "message": "配置回滚成功",
  "data": {
    "version": "1.0.0",
    "updateTime": "2025-01-25T16:00:00Z",
    "description": "回滚到版本 1.0.0: 初始版本",
    "forceUpdate": false,
    "downloadCount": 89
  }
}
```

## 📊 错误码说明

### 通用错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 0 | 成功 | - |
| 400 | 请求参数错误 | 检查请求参数格式 |
| 401 | 未授权 | 检查认证令牌 |
| 403 | 权限不足 | 确认管理员权限 |
| 404 | 资源不存在 | 检查请求路径 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 业务错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 1001 | 版本号格式错误 | 使用正确的版本号格式 |
| 1002 | 版本号已存在 | 使用新的版本号 |
| 1003 | 配置数据验证失败 | 检查配置数据格式 |
| 1004 | 目标版本不存在 | 确认回滚目标版本 |
| 1005 | 强制更新冲突 | 等待当前强制更新完成 |

## 🔍 请求示例

### cURL示例

```bash
# 获取配置版本 (前端App)
curl -X GET "http://localhost:3000/api/config-version"

# 获取配置内容 (前端App)
curl -X GET "http://localhost:3000/api/content-rules"

# 获取版本历史 (管理后台)
curl -X GET "http://localhost:3000/api/admin/config-versions" \
  -H "Authorization: Bearer your_admin_token"

# 发布新版本 (管理后台)
curl -X POST "http://localhost:3000/api/admin/config-version" \
  -H "Authorization: Bearer your_admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.2.0",
    "description": "更新配置",
    "forceUpdate": false,
    "config": {
      "minPostLength": 5,
      "maxPostLength": 1000
    }
  }'
```

### JavaScript示例

```javascript
// 前端App - 检查配置更新
async function checkConfigUpdate() {
  try {
    const response = await fetch('/api/config-version');
    const result = await response.json();
    
    if (result.code === 0) {
      console.log('当前版本:', result.data.version);
      return result.data;
    }
  } catch (error) {
    console.error('检查配置更新失败:', error);
  }
}

// 管理后台 - 发布新版本
async function publishNewVersion(versionData) {
  try {
    const response = await fetch('/api/admin/config-version', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(versionData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('版本发布成功:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('发布版本失败:', error);
    throw error;
  }
}
```

## 🔒 安全说明

### 认证机制
- **前端App接口**: 无需认证，公开访问
- **管理后台接口**: 需要有效的管理员JWT令牌

### 权限控制
- 只有具有管理员权限的用户才能发布和回滚配置版本
- 配置版本信息对所有用户可见，但配置内容可能包含敏感信息

### 频率限制
- 前端App接口：每个IP每分钟最多60次请求
- 管理后台接口：每个用户每分钟最多30次请求

## 📝 更新日志

### v1.0.0 (2025-01-25)
- ✅ 初始版本发布
- ✅ 基础配置管理接口
- ✅ 版本控制功能
- ✅ 回滚机制

---

**文档版本**: v1.0.0  
**更新时间**: 2025-01-25  
**维护团队**: 校园墙开发组
