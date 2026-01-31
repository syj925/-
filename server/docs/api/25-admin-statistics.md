# 数据统计 API

## 1. 获取综合统计数据

- **接口地址**: `/api/admin/statistics`
- **请求方式**: `GET`
- **认证方式**: Bearer Token (Admin)

### 请求参数

| 参数名 | 类型 | 必选 | 说明 |
| :--- | :--- | :--- | :--- |
| days | number | 否 | 统计天数，默认7 |

### 响应示例

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "growth": {
      "dates": ["2024-01-25", "2024-01-26"],
      "users": [10, 15],
      "posts": [50, 60]
    },
    "contentDist": [
      { "name": "校园生活", "value": 100 },
      { "name": "二手交易", "value": 50 }
    ],
    "activity": {
      "hours": ["0点", "1点", ...],
      "posts": [0, 0, ...],
      "comments": [0, 0, ...]
    }
  }
}
```
