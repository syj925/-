# 🎯 推荐系统 v2.0 部署指南

## 📋 概述

推荐系统已从复杂的实时计算架构重构为简化的预计算架构，大幅提升性能并降低系统复杂度。

### 🆚 版本对比

| 特性 | v1.0 (旧版) | v2.0 (新版) |
|------|-------------|-------------|
| **架构** | 实时计算 + 双重缓存 | 预计算 + 简单查询 |
| **性能** | 复杂查询，性能不稳定 | 索引友好，性能稳定 |
| **维护性** | 代码分散，难以维护 | 职责单一，易于维护 |
| **配置化** | 复杂配置，参数分散 | 保持配置化，参数统一 |
| **Bug风险** | 状态同步复杂，容易出错 | 逻辑简化，稳定可靠 |

---

## 🚀 部署步骤

### 1️⃣ 数据库迁移

```bash
# 1. 执行数据库迁移脚本
mysql -u [username] -p [database_name] < server/migrations/add_recommendation_fields.sql

# 2. 验证字段是否创建成功
mysql -u [username] -p [database_name] -e "
SELECT COLUMN_NAME, DATA_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'posts' 
AND COLUMN_NAME IN ('auto_recommended', 'recommend_score', 'score_updated_at');
"
```

### 2️⃣ 设置定时任务

```bash
# 自动设置定时任务
cd server
chmod +x scripts/setup-cron.sh
./scripts/setup-cron.sh

# 或手动添加到crontab
crontab -e
# 添加以下行：
# 每小时更新推荐分数
0 * * * * cd /path/to/your/project/server && node scripts/update-recommendation-scores.js >> logs/recommendation-cron.log 2>&1
# 每日凌晨2点强制全量更新
0 2 * * * cd /path/to/your/project/server && node scripts/update-recommendation-scores.js --force >> logs/recommendation-cron.log 2>&1
```

### 3️⃣ 初始化推荐分数

```bash
# 首次部署需要初始化所有帖子的推荐分数
cd server
node scripts/update-recommendation-scores.js --force

# 验证初始化结果
node -e "
const { Post } = require('./src/models');
(async () => {
  const stats = await Post.findAll({
    where: { status: 'published' },
    attributes: [
      [Post.sequelize.fn('COUNT', Post.sequelize.col('id')), 'total'],
      [Post.sequelize.fn('COUNT', Post.sequelize.literal('CASE WHEN auto_recommended = true THEN 1 END')), 'recommended'],
      [Post.sequelize.fn('AVG', Post.sequelize.col('recommend_score')), 'avgScore']
    ],
    raw: true
  });
  console.log('📊 初始化统计:', stats[0]);
  process.exit(0);
})();
"
```

### 4️⃣ 重启应用服务

```bash
# 重启Node.js应用
pm2 restart campus-wall
# 或
sudo systemctl restart campus-wall
```

---

## 🎛️ 管理员配置

### 推荐参数配置

通过管理员后台可以配置以下参数：

```javascript
{
  // 🎯 算法权重
  "likeWeight": 2.0,         // 点赞权重
  "commentWeight": 3.0,      // 评论权重  
  "collectionWeight": 4.0,   // 收藏权重
  "viewWeight": 0.5,         // 浏览权重
  
  // ⏰ 时间因子
  "timeDecayDays": 10,       // 时间衰减天数
  "maxAgeDays": 30,          // 最大帖子年龄
  
  // 🎯 推荐阈值
  "scoreThreshold": 15.0,    // 推荐分数阈值
  
  // 🆕 质量加分
  "newPostBonus": 5.0,       // 新帖保护加分
  "imageBonus": 3.0,         // 有图片加分
  "contentBonus": 2.0,       // 长内容加分
  "topicBonus": 1.0,         // 有话题加分
  
  // 🔄 多样性控制
  "maxSameAuthorRatio": 0.3, // 同一作者最大占比
  "diversityPeriodHours": 24 // 多样性检查周期
}
```

### 管理员API接口

```bash
# 获取推荐设置
GET /api/admin/recommendation/settings

# 更新推荐设置  
PUT /api/admin/recommendation/settings

# 获取推荐统计
GET /api/admin/recommendation/stats

# 触发分数重新计算
POST /api/admin/recommendation/recalculate

# 清除推荐缓存
DELETE /api/admin/recommendation/cache

# 测试推荐算法
GET /api/admin/recommendation/test?strategy=mixed&pageSize=10
```

---

## 🔍 监控和维护

### 日志监控

```bash
# 查看定时任务日志
tail -f server/logs/recommendation-cron.log

# 查看应用日志中的推荐相关信息
tail -f server/logs/app.log | grep "推荐"
```

### 性能监控

```javascript
// 推荐API性能监控
GET /api/posts/recommended?page=1&pageSize=10

// 预期响应时间：< 100ms（有索引支持）
// 预期内存使用：稳定，无内存泄漏
```

### 数据一致性检查

```bash
# 检查推荐数据一致性
node -e "
const { Post } = require('./server/src/models');
(async () => {
  // 检查分数异常的帖子
  const anomalies = await Post.findAll({
    where: {
      status: 'published',
      auto_recommended: true,
      recommend_score: { [require('sequelize').Op.lt]: 15 }
    }
  });
  
  console.log('🚨 分数异常帖子数量:', anomalies.length);
  if (anomalies.length > 0) {
    console.log('建议重新计算推荐分数');
  }
  process.exit(0);
})();
"
```

---

## 🐛 故障排除

### 常见问题

1. **推荐列表为空**
   ```bash
   # 检查是否有推荐帖子
   mysql -u [user] -p [db] -e "SELECT COUNT(*) FROM posts WHERE auto_recommended = 1 OR is_recommended = 1;"
   
   # 如果为0，手动触发分数计算
   node server/scripts/update-recommendation-scores.js --force
   ```

2. **定时任务未执行**
   ```bash
   # 检查crontab是否正确设置
   crontab -l | grep recommendation
   
   # 检查日志文件权限
   ls -la server/logs/recommendation-cron.log
   
   # 手动执行测试
   cd server && node scripts/update-recommendation-scores.js
   ```

3. **推荐分数未更新**
   ```bash
   # 检查最后更新时间
   mysql -u [user] -p [db] -e "SELECT MAX(score_updated_at) FROM posts;"
   
   # 强制重新计算
   curl -X POST http://localhost:3000/api/admin/recommendation/recalculate \
        -H "Authorization: Bearer [admin_token]"
   ```

### 回滚方案

如果新版本出现问题，可以回滚到旧版本：

```bash
# 1. 恢复旧版推荐服务
cd server/src/services
cp recommendation.service.old.js recommendation.service.js

# 2. 重启应用
pm2 restart campus-wall

# 3. 如需要，可以删除新添加的数据库字段
# 注意：这会丢失推荐分数数据
mysql -u [user] -p [db] -e "
ALTER TABLE posts DROP COLUMN auto_recommended;
ALTER TABLE posts DROP COLUMN recommend_score;  
ALTER TABLE posts DROP COLUMN score_updated_at;
"
```

---

## 🎯 性能优化

### 数据库优化

```sql
-- 确保索引存在
SHOW INDEX FROM posts WHERE Key_name LIKE '%recommend%';

-- 如果索引缺失，手动创建
CREATE INDEX idx_posts_recommendation ON posts(auto_recommended, recommend_score DESC, created_at DESC);
CREATE INDEX idx_posts_manual_recommend ON posts(is_recommended, created_at DESC);
```

### 缓存策略

- ✅ **移除了复杂的双重缓存机制**
- ✅ **只保留必要的配置缓存（5分钟TTL）**
- ✅ **查询直接使用数据库索引，性能稳定**

---

## 📈 预期效果

部署完成后，您应该看到：

1. **🚀 性能提升**
   - 推荐API响应时间从 200-500ms 降至 < 100ms
   - 内存使用更加稳定
   - CPU使用率降低

2. **🛠️ 维护简化** 
   - 代码逻辑更清晰
   - Bug数量显著减少
   - 新功能更容易添加

3. **📊 功能增强**
   - 推荐质量提升（新帖保护、质量加分、多样性控制）
   - 管理员可以实时调整算法参数
   - 完整的统计和监控能力

---

## 📞 技术支持

如果在部署过程中遇到问题，请检查：

1. 📋 **部署日志** - 记录详细的执行过程
2. 🔍 **应用日志** - 查看运行时错误
3. 📊 **数据库状态** - 确认字段和索引正确创建
4. ⏰ **定时任务** - 验证cron设置正确

**部署完成后，推荐系统将更加稳定、高效、易维护！** 🎉
