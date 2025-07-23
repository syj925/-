# API配置使用说明

## 📁 文件结构

```
admin/src/config/
├── api-config.js     # API配置文件（字段映射、状态码等）
└── README.md         # 使用说明文档

admin/src/utils/
├── api-helper.js     # API辅助工具函数
└── api.js           # 原始API接口定义
```

## 🔧 配置文件说明

### api-config.js

统一管理API相关配置，包括：

- **响应格式配置**：统一的成功/失败判断标准
- **字段映射配置**：前端驼峰命名 ↔ 后端下划线命名
- **状态码配置**：各种业务状态码定义
- **分页配置**：分页参数的默认值和限制
- **业务状态配置**：活动状态、报名状态等枚举值

### api-helper.js

提供统一的API调用和数据处理方法：

- **handleListApi**：处理列表查询API
- **handleMutationApi**：处理创建/更新API
- **handleDetailApi**：处理详情查询API
- **handleDeleteApi**：处理删除API
- **handleBatchApi**：处理批量操作API

## 🚀 使用方法

### 1. 基础用法

```javascript
import { 
  isApiSuccess, 
  getApiMessage, 
  transformToBackend,
  transformToFrontend 
} from '@/config/api-config';
import { handleListApi, handleMutationApi } from '@/utils/api-helper';

// 获取列表数据
const fetchData = async () => {
  const result = await handleListApi(api.events.getList, params, 'event');
  if (result.success) {
    // 数据已自动转换为前端格式
    list.value = result.data.events;
    total.value = result.data.pagination.total;
  } else {
    ElMessage.error(result.message);
  }
};

// 创建/更新数据
const saveData = async (data) => {
  const result = await handleMutationApi(api.events.create, data, 'event');
  if (result.success) {
    ElMessage.success('操作成功');
  } else {
    ElMessage.error(result.message);
  }
};
```

### 2. 字段映射使用

```javascript
// 前端数据（驼峰命名）
const frontendData = {
  startTime: '2025-07-22 10:00:00',
  endTime: '2025-07-22 18:00:00',
  isRecommended: true,
  maxParticipants: 100
};

// 转换为后端格式（下划线命名）
const backendData = transformToBackend(frontendData, 'event');
// 结果：
// {
//   start_time: '2025-07-22 10:00:00',
//   end_time: '2025-07-22 18:00:00',
//   is_recommended: true,
//   max_participants: 100
// }

// 反向转换
const convertedFrontendData = transformToFrontend(backendData, 'event');
```

### 3. 状态码使用

```javascript
import { EVENT_STATUS, EVENT_STATUS_LABELS } from '@/config/api-config';

// 使用状态枚举
const eventStatus = EVENT_STATUS.UPCOMING; // 1

// 显示状态标签
const statusLabel = EVENT_STATUS_LABELS[eventStatus]; // '报名中'
```

## 📝 添加新的字段映射

当需要添加新的字段映射时，只需在 `api-config.js` 中的 `FIELD_MAPPING` 对象中添加：

```javascript
export const FIELD_MAPPING = {
  event: {
    // 现有字段...
    newFrontendField: 'new_backend_field',
    anotherField: 'another_backend_field'
  },
  
  // 添加新的数据类别
  newCategory: {
    fieldName: 'field_name',
    createdAt: 'created_at'
  }
};
```

## 🔄 迁移现有代码

### 替换前：
```javascript
const res = await api.events.getList(params);
if (res.code === 0) {
  eventList.value = res.data.events.map(event => ({
    ...event,
    startTime: event.start_time,
    endTime: event.end_time,
    isRecommended: event.is_recommended
  }));
}
```

### 替换后：
```javascript
const result = await handleListApi(api.events.getList, params, 'event');
if (result.success) {
  eventList.value = result.data.events; // 已自动转换字段名
}
```

## ⚠️ 注意事项

1. **数据类别**：调用API辅助函数时，请正确指定数据类别（event、user、post、comment）
2. **字段映射**：新增字段时，记得同时添加到字段映射配置中
3. **向后兼容**：现有代码可以逐步迁移，不需要一次性全部修改
4. **错误处理**：API辅助函数已包含基础错误处理，但复杂业务逻辑仍需自行处理

## 🎯 最佳实践

1. **统一使用API辅助函数**：避免直接调用原始API
2. **及时更新字段映射**：新增字段时及时添加映射配置
3. **使用枚举值**：使用配置文件中的状态枚举，避免硬编码
4. **错误信息统一**：使用 `getApiMessage` 获取统一的错误信息
5. **分页参数格式化**：使用 `formatPaginationParams` 格式化分页参数
