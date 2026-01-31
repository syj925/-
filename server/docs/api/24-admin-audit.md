# 审核管理 API

## 1. 批量审核

- **接口地址**: `/api/admin/audit/batch`
- **请求方式**: `POST`
- **认证方式**: Bearer Token (Admin)

### 请求参数

| 参数名 | 类型 | 必选 | 说明 |
| :--- | :--- | :--- | :--- |
| targetType | string | 是 | 目标类型: 'post', 'comment', 'user' |
| items | array | 是 | 审核项列表 |

**items 结构**:
```json
[
  {
    "id": "uuid",
    "action": "approve | reject | ban",
    "reason": "拒绝或封禁原因"
  }
]
```

### 响应示例

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "success": ["uuid1", "uuid2"],
    "failed": []
  }
}
```

## 2. 获取审核日志

- **接口地址**: `/api/admin/audit/logs`
- **请求方式**: `GET`
- **认证方式**: Bearer Token (Admin)

### 请求参数

| 参数名 | 类型 | 必选 | 说明 |
| :--- | :--- | :--- | :--- |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| adminId | string | 否 | 筛选操作管理员 |
| targetType | string | 否 | 筛选目标类型 |
| action | string | 否 | 筛选动作 |

### 响应示例

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "list": [
      {
        "id": "uuid",
        "admin_id": "uuid",
        "target_type": "post",
        "target_id": "uuid",
        "action": "reject",
        "reason": "包含违规内容",
        "created_at": "2024-02-01T12:00:00Z",
        "admin": {
          "nickname": "Admin"
        }
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "pageSize": 20
    }
  }
}
```
