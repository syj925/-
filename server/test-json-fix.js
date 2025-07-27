/**
 * 测试JSON循环引用修复
 */
const JsonUtil = require('./src/utils/json.util');

// 模拟Sequelize模型对象
const mockPost = {
  id: 1,
  title: '测试帖子',
  content: '这是测试内容',
  status: 'published',
  user_id: 'user123',
  created_at: new Date(),
  updated_at: new Date(),
  
  // 模拟Sequelize方法
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      status: this.status,
      user_id: this.user_id,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  },
  
  get(options) {
    if (options && options.plain) {
      return this.toJSON();
    }
    return this;
  }
};

// 模拟循环引用
const mockPostWithCircular = {
  id: 1,
  title: '测试帖子',
  content: '这是测试内容',
  status: 'published',
  user_id: 'user123',
  created_at: new Date(),
  updated_at: new Date()
};

// 创建循环引用
mockPostWithCircular.self = mockPostWithCircular;
mockPostWithCircular.parent = {
  child: mockPostWithCircular,
  include: [mockPostWithCircular]
};

console.log('=== 测试JSON循环引用修复 ===\n');

// 测试1: 正常对象
console.log('1. 测试正常对象:');
try {
  const safeData = JsonUtil.createSafeResponseData(mockPost);
  console.log('✅ 成功:', JSON.stringify(safeData, null, 2));
} catch (error) {
  console.log('❌ 失败:', error.message);
}

// 测试2: 循环引用对象
console.log('\n2. 测试循环引用对象:');
try {
  const safeData = JsonUtil.createSafeResponseData(mockPostWithCircular);
  console.log('✅ 成功:', JSON.stringify(safeData, null, 2));
} catch (error) {
  console.log('❌ 失败:', error.message);
}

// 测试3: 安全序列化
console.log('\n3. 测试安全序列化:');
try {
  const safeJson = JsonUtil.safeStringify(mockPostWithCircular, 2);
  console.log('✅ 成功:', safeJson);
} catch (error) {
  console.log('❌ 失败:', error.message);
}

// 测试4: 深度清理
console.log('\n4. 测试深度清理:');
try {
  const cleanedData = JsonUtil.deepClean(mockPostWithCircular);
  console.log('✅ 成功:', JSON.stringify(cleanedData, null, 2));
} catch (error) {
  console.log('❌ 失败:', error.message);
}

console.log('\n=== 测试完成 ===');
