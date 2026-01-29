# 校园墙表情系统 - 业务逻辑文档

> 版本: v1.0  
> 更新日期: 2026-01-21

---

## 一、核心业务流程

### 1.1 流程总览

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           表情系统业务流程                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         管理员流程                                   │   │
│  │                                                                     │   │
│  │  创建表情包 ──► 上传表情 ──► 配置关键字 ──► 发布版本 ──► 推送更新   │   │
│  │                                                                     │   │
│  │  审核用户表情 ──► 通过/拒绝 ──► 生成正式表情 ──► 通知用户           │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         用户流程                                     │   │
│  │                                                                     │   │
│  │  初始化 ──► 版本检查 ──► 增量/全量更新 ──► 本地缓存                 │   │
│  │                                                                     │   │
│  │  选择表情 ──► 插入内容 ──► 提交 ──► 记录使用                        │   │
│  │                                                                     │   │
│  │  上传自定义 ──► 等待审核 ──► 获得通知 ──► 全站可用                  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 二、客户端初始化流程

### 2.1 流程图

```
┌─────────────────┐
│   客户端启动     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 读取本地缓存版本 │
│ (LocalStorage)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 请求 /emojis/init│
│ ?client_version=N│
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│            服务端版本对比                 │
├─────────────────────────────────────────┤
│                                         │
│  client_version == current_version ?    │
│         │                │              │
│        是               否              │
│         │                │              │
│         ▼                ▼              │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │update_type: │  │ 版本差距 > 10 ? │  │
│  │   "none"    │  └───────┬─────────┘  │
│  └─────────────┘          │            │
│                    ┌──────┴──────┐     │
│                   是            否     │
│                    │             │     │
│                    ▼             ▼     │
│            ┌─────────────┐ ┌─────────┐ │
│            │update_type: │ │增量更新  │ │
│            │   "full"    │ │changes[]│ │
│            │ + packs[]   │ └─────────┘ │
│            └─────────────┘             │
│                                         │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  客户端处理响应  │
├─────────────────┤
│ none: 使用本地   │
│ full: 全量替换   │
│ incr: 合并变更   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 更新本地缓存     │
│ 构建映射表       │
│ 编译正则表达式   │
└─────────────────┘
```

### 2.2 伪代码

```javascript
async function initEmojiSystem() {
  // 1. 读取本地缓存
  const localVersion = storage.get('emoji_version') || 0;
  const localPacks = storage.get('emoji_packs') || [];
  const localMap = storage.get('emoji_map') || {};
  
  // 2. 请求服务端
  const response = await api.emojis.init(localVersion);
  
  // 3. 处理响应
  if (response.update_type === 'none') {
    // 无需更新，使用本地数据
    return { packs: localPacks, map: localMap };
  }
  
  if (response.update_type === 'full') {
    // 全量更新
    const packs = response.packs;
    const map = buildEmojiMap(packs);
    storage.set('emoji_version', response.current_version);
    storage.set('emoji_packs', packs);
    storage.set('emoji_map', map);
    return { packs, map };
  }
  
  if (response.update_type === 'incremental') {
    // 增量更新
    const packs = applyChanges(localPacks, response.changes);
    const map = buildEmojiMap(packs);
    storage.set('emoji_version', response.current_version);
    storage.set('emoji_packs', packs);
    storage.set('emoji_map', map);
    return { packs, map };
  }
}

function applyChanges(packs, changes) {
  changes.forEach(change => {
    if (change.type === 'add') {
      // 新增表情包或表情
      const pack = packs.find(p => p.id === change.pack_id);
      if (pack) {
        pack.emojis = [...pack.emojis, ...change.emojis];
      } else {
        packs.push({ id: change.pack_id, name: change.pack_name, emojis: change.emojis });
      }
    } else if (change.type === 'update') {
      // 更新表情
      change.emojis.forEach(newEmoji => {
        const pack = packs.find(p => p.id === change.pack_id);
        if (pack) {
          const index = pack.emojis.findIndex(e => e.id === newEmoji.id);
          if (index >= 0) pack.emojis[index] = newEmoji;
        }
      });
    } else if (change.type === 'delete') {
      // 删除表情
      const pack = packs.find(p => p.id === change.pack_id);
      if (pack) {
        const deleteIds = new Set(change.emojis.map(e => e.id));
        pack.emojis = pack.emojis.filter(e => !deleteIds.has(e.id));
      }
    }
  });
  return packs;
}

function buildEmojiMap(packs) {
  const map = {};
  packs.forEach(pack => {
    pack.emojis.forEach(emoji => {
      map[emoji.code] = {
        id: emoji.id,
        url: emoji.url,
        name: emoji.name,
        type: emoji.type
      };
    });
  });
  return map;
}
```

---

## 三、表情渲染流程

### 3.1 文本渲染流程

```
┌─────────────────┐
│  原始文本输入    │
│ "你好[doge]"    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 正则表达式匹配   │
│ /(\[xxx\]|\[yyy\])/g │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  遍历匹配结果    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐ ┌───────────┐
│ 文本  │ │ 表情代码   │
│ 部分  │ │ [doge]    │
└───┬───┘ └─────┬─────┘
    │           │
    │           ▼
    │    ┌─────────────┐
    │    │ 查找映射表   │
    │    │ map[code]   │
    │    └──────┬──────┘
    │           │
    │      ┌────┴────┐
    │      │         │
    │      ▼         ▼
    │  ┌───────┐ ┌───────┐
    │  │ 找到  │ │ 未找到│
    │  │ emoji │ │ 保留  │
    │  └───┬───┘ └───┬───┘
    │      │         │
    │      ▼         │
    │  ┌───────────┐ │
    │  │生成<img>  │ │
    │  │标签       │ │
    │  └─────┬─────┘ │
    │        │       │
    └────────┼───────┘
             │
             ▼
┌─────────────────────────────┐
│         渲染结果             │
│ "你好<img src='doge.png'>" │
└─────────────────────────────┘
```

### 3.2 渲染代码示例

```javascript
// 服务端渲染（返回HTML）
function renderEmojiToHtml(text, emojiMap, regex) {
  if (!text || !regex) return text;
  
  return text.replace(regex, (match) => {
    const emoji = emojiMap[match];
    if (emoji) {
      return `<img class="emoji-img" src="${emoji.url}" alt="${match}" title="${emoji.name}">`;
    }
    return match; // 未找到则保留原文
  });
}

// 客户端渲染（uni-app rich-text）
function renderEmojiToNodes(text, emojiMap, regex) {
  if (!text || !regex) return [{ type: 'text', text }];
  
  const nodes = [];
  let lastIndex = 0;
  let match;
  
  regex.lastIndex = 0; // 重置正则状态
  
  while ((match = regex.exec(text)) !== null) {
    // 添加前面的文本
    if (match.index > lastIndex) {
      nodes.push({
        type: 'text',
        text: text.slice(lastIndex, match.index)
      });
    }
    
    // 添加表情
    const emoji = emojiMap[match[0]];
    if (emoji) {
      nodes.push({
        name: 'img',
        attrs: {
          src: emoji.url,
          class: 'emoji-inline',
          style: 'width:20px;height:20px;vertical-align:middle;'
        }
      });
    } else {
      nodes.push({ type: 'text', text: match[0] });
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // 添加剩余文本
  if (lastIndex < text.length) {
    nodes.push({
      type: 'text',
      text: text.slice(lastIndex)
    });
  }
  
  return nodes;
}
```

---

## 四、用户自定义表情审核流程

### 4.1 完整流程图

```
┌─────────────────┐
│  用户上传表情    │
│  POST /custom   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│              文件校验                    │
├─────────────────────────────────────────┤
│ ✓ 文件类型 (PNG/GIF/WEBP)               │
│ ✓ 文件大小 (静态≤500KB, GIF≤2MB)        │
│ ✓ 图片尺寸 (≤500x500)                   │
│ ✓ 每日上传限制 (≤10个)                  │
└─────────────────────────────────────────┘
         │
         │ 校验失败 ──────► 返回错误
         │
         ▼ 校验通过
┌─────────────────┐
│ 保存到临时目录   │
│ /custom/{user}/ │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 创建审核记录     │
│ status: pending │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 返回成功响应     │
│ "等待审核"      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│              管理员审核                  │
├─────────────────────────────────────────┤
│                                         │
│  GET /admin/emojis/pending              │
│           │                             │
│           ▼                             │
│  ┌─────────────────┐                   │
│  │ 查看待审核列表   │                   │
│  │ 预览表情图片     │                   │
│  └────────┬────────┘                   │
│           │                             │
│           ▼                             │
│  POST /admin/emojis/:id/review          │
│           │                             │
│     ┌─────┴─────┐                      │
│     │           │                       │
│     ▼           ▼                       │
│  ┌──────┐   ┌──────┐                   │
│  │ 通过 │   │ 拒绝 │                   │
│  └──┬───┘   └──┬───┘                   │
│     │          │                        │
│     ▼          ▼                        │
│  ┌──────────────────────────────┐      │
│  │ 通过流程:                     │      │
│  │ 1. 生成表情代码               │      │
│  │    [用户名_表情名]            │      │
│  │ 2. 移动图片到正式目录         │      │
│  │ 3. 创建emojis记录             │      │
│  │ 4. 更新custom_emoji.emoji_id  │      │
│  │ 5. 更新status: approved       │      │
│  │ 6. 版本号+1                   │      │
│  │ 7. 清除缓存                   │      │
│  │ 8. 通知用户                   │      │
│  └──────────────────────────────┘      │
│                                         │
│  ┌──────────────────────────────┐      │
│  │ 拒绝流程:                     │      │
│  │ 1. 记录拒绝原因               │      │
│  │ 2. 更新status: rejected       │      │
│  │ 3. 通知用户                   │      │
│  │ 4. (可选)删除临时文件         │      │
│  └──────────────────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  用户收到通知    │
│  查看审核结果    │
└─────────────────┘
```

### 4.2 审核状态机

```
                    ┌─────────────┐
                    │   pending   │
                    │   (待审核)   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            │            ▼
       ┌─────────────┐     │     ┌─────────────┐
       │  approved   │     │     │  rejected   │
       │   (通过)    │     │     │   (拒绝)    │
       └─────────────┘     │     └─────────────┘
              │            │
              │            │ 用户删除
              │            ▼
              │     ┌─────────────┐
              │     │  (已删除)   │
              │     └─────────────┘
              │
              ▼
       ┌─────────────┐
       │ 生成正式表情 │
       │ (全站可用)  │
       └─────────────┘
```

### 4.3 审核逻辑代码

```javascript
async function reviewCustomEmoji(customEmojiId, action, options = {}) {
  const { reason, code, packId } = options;
  
  // 1. 查找待审核记录
  const customEmoji = await UserCustomEmoji.findByPk(customEmojiId, {
    include: [{ model: User, as: 'uploader' }]
  });
  
  if (!customEmoji) {
    throw new Error('记录不存在');
  }
  
  if (customEmoji.status !== 'pending') {
    throw new Error('该表情不在待审核状态');
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    if (action === 'reject') {
      // 拒绝处理
      await customEmoji.update({
        status: 'rejected',
        reject_reason: reason,
        reviewer_id: adminUserId,
        reviewed_at: new Date()
      }, { transaction });
      
      await transaction.commit();
      
      // 通知用户
      await notifyUser(customEmoji.user_id, 'emoji_rejected', {
        emoji_name: customEmoji.name,
        reason
      });
      
      return { status: 'rejected', reason };
    }
    
    if (action === 'approve') {
      // 通过处理
      
      // 2. 生成表情代码
      const emojiCode = code || `[${customEmoji.uploader.username}_${customEmoji.name}]`;
      
      // 3. 检查代码是否已存在
      const exists = await Emoji.findOne({ where: { code: emojiCode } });
      if (exists) {
        throw new Error('表情代码已存在');
      }
      
      // 4. 移动文件到正式目录
      const targetPackId = packId || await getOrCreateUserEmojiPack();
      const newUrl = await moveToOfficialDir(customEmoji.url, targetPackId);
      
      // 5. 创建正式表情记录
      const emoji = await Emoji.create({
        pack_id: targetPackId,
        code: emojiCode,
        name: customEmoji.name,
        url: newUrl,
        type: customEmoji.type,
        file_size: customEmoji.file_size,
        status: 'active'
      }, { transaction });
      
      // 6. 更新审核记录
      await customEmoji.update({
        status: 'approved',
        emoji_id: emoji.id,
        reviewer_id: adminUserId,
        reviewed_at: new Date()
      }, { transaction });
      
      // 7. 版本号+1
      await incrementEmojiVersion(transaction);
      
      await transaction.commit();
      
      // 8. 清除缓存
      await emojiCacheService.clearAllCache();
      
      // 9. 通知用户
      await notifyUser(customEmoji.user_id, 'emoji_approved', {
        emoji_name: customEmoji.name,
        emoji_code: emojiCode
      });
      
      // 10. WebSocket广播版本更新
      webSocketService.broadcast({
        type: 'emoji_version_update',
        version: await emojiCacheService.getVersion()
      });
      
      return { 
        status: 'approved', 
        emoji_id: emoji.id,
        emoji_code: emojiCode
      };
    }
    
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
```

---

## 五、表情搜索逻辑

### 5.1 搜索流程

```
┌─────────────────┐
│  用户输入关键字  │
│  例如: "笑"     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 1. 查询Redis缓存│
│ key: search:笑  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 命中缓存   未命中
    │         │
    │         ▼
    │    ┌─────────────────────────────┐
    │    │ 2. 查询MySQL                 │
    │    │                             │
    │    │ SELECT * FROM emojis        │
    │    │ WHERE status = 'active'     │
    │    │ AND (                       │
    │    │   name LIKE '%笑%'          │
    │    │   OR keywords LIKE '%笑%'   │
    │    │   OR code LIKE '%笑%'       │
    │    │ )                           │
    │    │ ORDER BY use_count DESC     │
    │    │ LIMIT 20                    │
    │    │                             │
    │    │ 或使用全文索引:              │
    │    │ MATCH(name, keywords)       │
    │    │ AGAINST('笑' IN NATURAL     │
    │    │ LANGUAGE MODE)              │
    │    └───────────┬─────────────────┘
    │                │
    │                ▼
    │         ┌─────────────┐
    │         │ 3. 缓存结果  │
    │         │ TTL: 10分钟  │
    │         └──────┬──────┘
    │                │
    └────────────────┘
             │
             ▼
┌─────────────────┐
│  返回搜索结果    │
└─────────────────┘
```

### 5.2 搜索代码

```javascript
async function searchEmojis(keyword, limit = 20) {
  if (!keyword || keyword.length < 1) {
    return [];
  }
  
  // 1. 尝试从缓存获取
  const cacheKey = `emoji:search:${keyword}`;
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // 2. 数据库查询
  const emojis = await Emoji.findAll({
    where: {
      status: 'active',
      [Op.or]: [
        { name: { [Op.like]: `%${keyword}%` } },
        { keywords: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ]
    },
    include: [{
      model: EmojiPack,
      as: 'pack',
      attributes: ['id', 'name']
    }],
    order: [['use_count', 'DESC']],
    limit
  });
  
  // 3. 格式化结果
  const result = emojis.map(emoji => ({
    id: emoji.id,
    code: emoji.code,
    name: emoji.name,
    url: emoji.url,
    type: emoji.type,
    pack: emoji.pack ? { id: emoji.pack.id, name: emoji.pack.name } : null
  }));
  
  // 4. 缓存结果
  await redisClient.set(cacheKey, result, 10 * 60); // 10分钟
  
  return result;
}
```

---

## 六、使用统计逻辑

### 6.1 统计流程

```
┌─────────────────┐
│  用户使用表情    │
│  POST /use      │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│           异步处理（不阻塞响应）          │
├─────────────────────────────────────────┤
│                                         │
│  1. 更新用户最近使用列表                 │
│     Redis LPUSH + LTRIM (LRU)           │
│                                         │
│  2. 更新表情使用计数                     │
│     Redis HINCRBY + 定时同步DB          │
│                                         │
│  3. 更新用户使用历史表                   │
│     emoji_usage_history                 │
│                                         │
└─────────────────────────────────────────┘
```

### 6.2 统计代码

```javascript
async function recordEmojiUse(userId, emojiId) {
  // 立即返回，异步处理
  setImmediate(async () => {
    try {
      // 1. 更新用户最近使用（Redis）
      const recentKey = `emoji:recent:${userId}`;
      await redisClient.lrem(recentKey, 0, emojiId); // 先移除已有的
      await redisClient.lpush(recentKey, emojiId);   // 添加到头部
      await redisClient.ltrim(recentKey, 0, 29);     // 保留30个
      await redisClient.expire(recentKey, 24 * 60 * 60); // 24小时过期
      
      // 2. 更新表情使用计数（Redis计数，定时同步DB）
      const countKey = 'emoji:use_counts';
      await redisClient.hincrby(countKey, emojiId, 1);
      
      // 3. 更新用户使用历史表
      await EmojiUsageHistory.upsert({
        user_id: userId,
        emoji_id: emojiId,
        usage_count: sequelize.literal('usage_count + 1'),
        last_used_at: new Date()
      });
      
    } catch (error) {
      logger.error('记录表情使用失败:', error);
    }
  });
}

// 定时同步使用计数到数据库（每5分钟）
async function syncUseCountsToDB() {
  const countKey = 'emoji:use_counts';
  const counts = await redisClient.hgetall(countKey);
  
  if (!counts || Object.keys(counts).length === 0) {
    return;
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    for (const [emojiId, count] of Object.entries(counts)) {
      await Emoji.increment('use_count', {
        by: parseInt(count),
        where: { id: emojiId },
        transaction
      });
    }
    
    await transaction.commit();
    
    // 清除已同步的计数
    await redisClient.del(countKey);
    
    logger.info(`同步了 ${Object.keys(counts).length} 个表情的使用计数`);
    
  } catch (error) {
    await transaction.rollback();
    logger.error('同步使用计数失败:', error);
  }
}
```

---

## 七、版本发布逻辑

### 7.1 发布流程

```
┌─────────────────┐
│ 管理员发布版本   │
│ POST /publish   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│              版本发布处理                │
├─────────────────────────────────────────┤
│                                         │
│  1. 获取当前版本号                       │
│     current_version                     │
│                                         │
│  2. 收集自上次发布以来的变更             │
│     - 新增的表情                        │
│     - 修改的表情                        │
│     - 删除的表情                        │
│                                         │
│  3. 创建版本记录                        │
│     emoji_versions                      │
│                                         │
│  4. 版本号 + 1                          │
│     Redis INCR                          │
│                                         │
│  5. 清除所有表情缓存                     │
│                                         │
│  6. WebSocket广播更新通知                │
│                                         │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│           客户端收到通知                 │
├─────────────────────────────────────────┤
│                                         │
│  1. 显示更新提示（可选）                 │
│                                         │
│  2. 下次打开表情面板时自动更新           │
│     或立即后台更新                      │
│                                         │
└─────────────────────────────────────────┘
```

### 7.2 版本记录结构

```javascript
// emoji_versions 记录示例
{
  id: 'version-uuid',
  version: 8,
  change_type: 'mixed',  // add | update | delete | mixed
  changes: [
    {
      type: 'add',
      pack_id: 'pack-uuid',
      emoji_ids: ['emoji-1', 'emoji-2']
    },
    {
      type: 'update',
      pack_id: 'pack-uuid-2',
      emoji_ids: ['emoji-3']
    }
  ],
  description: '新增10个表情，更新2个表情',
  created_at: '2026-01-21T12:00:00Z'
}
```

---

## 八、缓存失效策略

### 8.1 缓存键及失效场景

| 缓存键 | 失效场景 |
|--------|----------|
| emoji:packs | 表情包增删改、发布版本 |
| emoji:map | 表情增删改、发布版本 |
| emoji:version | 永不主动失效，只增不减 |
| emoji:search:* | 表情增删改（清除所有搜索缓存）|
| emoji:hot | 定时失效(15分钟)或手动清除 |
| emoji:recent:{userId} | 用户使用表情时自动更新 |

### 8.2 缓存清除代码

```javascript
async function clearEmojiCache(options = {}) {
  const { 
    clearPacks = true, 
    clearMap = true, 
    clearSearch = true,
    clearHot = true 
  } = options;
  
  const keysToDelete = [];
  
  if (clearPacks) keysToDelete.push('emoji:packs');
  if (clearMap) keysToDelete.push('emoji:map');
  if (clearHot) keysToDelete.push('emoji:hot');
  
  // 删除固定键
  if (keysToDelete.length > 0) {
    await redisClient.del(...keysToDelete);
  }
  
  // 删除搜索缓存（模式匹配）
  if (clearSearch) {
    await redisClient.deletePattern('emoji:search:*');
  }
  
  logger.info('表情缓存已清除', { clearPacks, clearMap, clearSearch, clearHot });
}
```

---

## 九、错误处理策略

### 9.1 错误类型及处理

| 错误类型 | 处理方式 |
|----------|----------|
| 缓存不可用 | 降级到数据库查询 |
| 数据库查询失败 | 返回缓存数据或空数组 |
| 文件上传失败 | 返回错误，不创建记录 |
| 审核操作失败 | 事务回滚，返回错误 |
| WebSocket推送失败 | 记录日志，不影响主流程 |

### 9.2 降级策略

```javascript
async function getEmojiPacks() {
  // 1. 尝试Redis
  try {
    const cached = await redisClient.get('emoji:packs');
    if (cached) return cached;
  } catch (redisError) {
    logger.warn('Redis不可用，降级到数据库:', redisError);
  }
  
  // 2. 查询数据库
  try {
    const packs = await EmojiPack.findAll({
      where: { status: 'active' },
      include: [{ model: Emoji, as: 'emojis', where: { status: 'active' } }],
      order: [['sort_order', 'ASC']]
    });
    
    // 尝试回填缓存
    try {
      await redisClient.set('emoji:packs', packs, 30 * 60);
    } catch (e) {
      // 忽略缓存写入失败
    }
    
    return packs;
  } catch (dbError) {
    logger.error('数据库查询失败:', dbError);
    return []; // 返回空数组，前端可使用本地缓存
  }
}
```

---

## 十、安全考虑

### 10.1 上传安全

1. **文件类型验证**: 检查文件头魔数，不仅检查扩展名
2. **文件大小限制**: 服务端二次校验
3. **图片尺寸限制**: 防止巨大图片消耗资源
4. **频率限制**: 每用户每天限制上传数量
5. **存储隔离**: 待审核文件与正式文件分开存储

### 10.2 内容安全

1. **人工审核**: 所有用户上传必须审核
2. **关键词过滤**: 表情名称检查敏感词
3. **举报机制**: 支持用户举报违规表情
4. **快速下架**: 支持紧急下架违规表情

### 10.3 代码示例

```javascript
// 文件头验证
const fileSignatures = {
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46]
};

function validateFileType(buffer, expectedType) {
  const signature = fileSignatures[expectedType];
  if (!signature) return false;
  
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

// 上传频率限制
async function checkUploadLimit(userId) {
  const today = new Date().toISOString().split('T')[0];
  const key = `emoji:upload:${userId}:${today}`;
  
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, 24 * 60 * 60);
  }
  
  if (count > 10) {
    throw new Error('每日上传已达上限');
  }
  
  return count;
}
```

---

## 附录：关键配置

```javascript
// config/emoji.js
module.exports = {
  upload: {
    maxStaticSize: 500 * 1024,      // 静态图片 500KB
    maxGifSize: 2 * 1024 * 1024,    // GIF 2MB
    maxDimension: 500,              // 最大尺寸 500px
    allowedTypes: ['image/png', 'image/gif', 'image/webp'],
    dailyLimit: 10                  // 每日上传限制
  },
  cache: {
    packsTTL: 30 * 60,              // 表情包缓存 30分钟
    mapTTL: 60 * 60,                // 映射表缓存 1小时
    searchTTL: 10 * 60,             // 搜索缓存 10分钟
    hotTTL: 15 * 60,                // 热门缓存 15分钟
    recentLimit: 30,                // 最近使用数量
    recentTTL: 24 * 60 * 60         // 最近使用缓存 24小时
  },
  version: {
    incrementalThreshold: 10        // 增量更新阈值
  }
};
```
