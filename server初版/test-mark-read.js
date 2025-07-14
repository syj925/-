/**
 * 测试标记消息已读功能
 * 用于验证 Sequelize 实例统一后功能是否正常
 */

const axios = require('axios');
const { sequelize } = require('./config/sequelizeInstance');
const { User } = require('./models/init');
const { Message } = require('./models/init');
const bcrypt = require('bcryptjs');

// 服务器地址
const API_URL = 'http://localhost:12349/api';
let token = '';
let testUserId = null;
let testMessageId = null;

// 测试用户信息
const TEST_USERNAME = 'testadmin';
const TEST_PASSWORD = 'testadmin123';
const TEST_NICKNAME = '测试管理员';

// 检查服务器是否可用
async function checkServerAvailability() {
  try {
    console.log('检查服务器可用性...');
    // 尝试访问健康检查接口
    await axios.get(`${API_URL}/health`, { timeout: 2000 });
    console.log('服务器正常运行');
    return true;
  } catch (error) {
    console.error('服务器未运行或无法访问');
    console.error('请确保服务器在端口 12349 上运行');
    console.error('可以通过运行 node app.js 启动服务器');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('连接被拒绝，服务器可能未启动');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('连接超时');
    } else {
      console.error('错误详情:', error.message);
    }
    return false;
  }
}

// 创建测试用户
async function createTestUser() {
  try {
    console.log('创建测试管理员账户...');
    
    // 首先检查是否已存在
    const existingUser = await User.findOne({
      where: {
        username: TEST_USERNAME
      }
    });
    
    if (existingUser) {
      console.log('测试管理员账户已存在，先删除再重新创建');
      await existingUser.destroy({ force: true }); // 真正删除
    }
    
    // 创建新用户 - 使用纯文本密码，让模型自动加密
    const newUser = await User.create({
      username: TEST_USERNAME,
      password: TEST_PASSWORD, // 模型会自动加密
      nickname: TEST_NICKNAME,
      email: 'testadmin@example.com',
      role: 'admin', // 创建为管理员
      status: 'active'
    });
    
    console.log(`创建测试管理员成功，ID: ${newUser.id}`);
    
    // 验证密码是否可用
    const user = await User.findByPk(newUser.id);
    const isValidPassword = user.checkPassword(TEST_PASSWORD);
    console.log(`密码验证测试: ${isValidPassword ? '通过' : '失败'}`);
    
    return newUser.id;
  } catch (error) {
    console.error('创建测试用户失败:', error);
    return null;
  }
}

// 创建测试消息
async function createTestMessage(userId) {
  try {
    console.log('创建测试消息...');
    
    const message = await Message.create({
      senderId: 1, // 假设ID为1的是系统或管理员
      recipientId: userId,
      type: 'system',
      content: '这是一条测试消息',
      status: 'unread'
    });
    
    console.log(`创建测试消息成功，ID: ${message.id}`);
    return message.id;
  } catch (error) {
    console.error('创建测试消息失败:', error);
    return null;
  }
}

// 登录并获取 token
async function login() {
  try {
    console.log('尝试登录测试管理员账户...');
    console.log('登录参数:', JSON.stringify({
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    }));
    
    let response = await axios.post(`${API_URL}/auth/login`, {
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    });
    
    if (response.data.success) {
      // 从响应中获取token
      token = response.data.data.token || response.data.token;
      console.log('测试管理员登录成功, 获取到 token');
      console.log('Token类型:', typeof token);
      console.log('Token长度:', token?.length);
      console.log('Token前10个字符:', token?.substring(0, 10));
      return true;
    } else {
      console.error('测试管理员登录失败:', response.data.message);
      
      // 打印所有可用测试账户
      console.log('正在检索可用的测试账户...');
      try {
        const users = await User.findAll({
          attributes: ['id', 'username', 'role', 'status'],
          limit: 5
        });
        console.log('数据库中的用户账号(前5个):');
        users.forEach(user => {
          console.log(`- ID:${user.id}, 用户名:${user.username}, 角色:${user.role}, 状态:${user.status}`);
        });
      } catch (err) {
        console.error('无法检索用户列表:', err.message);
      }
      
      return false;
    }
  } catch (error) {
    console.error('登录请求出错:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('没有收到响应，服务器可能未运行');
      console.error('请确保服务器在端口 12349 上运行');
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
}

// 获取消息列表
async function getMessages() {
  try {
    console.log('获取消息列表...');
    const response = await axios.get(`${API_URL}/messages`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.data.success && response.data.data.length > 0) {
      console.log(`找到 ${response.data.data.length} 条消息`);
      return response.data.data[0].id; // 返回第一条消息的 ID
    } else {
      console.log('没有找到消息');
      return null;
    }
  } catch (error) {
    console.error('获取消息失败:', error.response ? error.response.data : error.message);
    return null;
  }
}

// 标记消息为已读
async function markMessageAsRead(messageId) {
  try {
    console.log(`尝试标记消息 ${messageId} 为已读...`);
    console.log('使用的认证头:', `Bearer ${token}`);
    
    const response = await axios.put(`${API_URL}/messages/${messageId}/read`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('消息成功标记为已读');
      return true;
    } else {
      console.error('标记消息为已读失败:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('标记消息已读请求出错:');
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data));
    } else if (error.request) {
      console.error('没有收到响应');
    } else {
      console.error('错误:', error.message);
    }
    return false;
  }
}

// 验证消息状态
async function verifyMessageStatus(messageId) {
  try {
    // 直接从数据库查询消息状态
    const message = await Message.findByPk(messageId);
    if (message) {
      console.log(`消息当前是否已读: ${message.isRead ? '是' : '否'}`);
      return message.isRead === true;
    } else {
      console.error('消息不存在');
      return false;
    }
  } catch (error) {
    console.error('验证消息状态失败:', error);
    return false;
  }
}

// 删除测试数据
async function cleanupTestData() {
  try {
    if (testMessageId) {
      await Message.destroy({ where: { id: testMessageId } });
      console.log(`测试消息 ${testMessageId} 已删除`);
    }
    
    // 删除测试用户
    if (testUserId) {
      await User.destroy({ where: { id: testUserId } });
      console.log(`测试用户 ${testUserId} 已删除`);
    }
  } catch (error) {
    console.error('清理测试数据失败:', error);
  }
}

// 运行测试
async function runTest() {
  console.log('开始测试标记消息已读功能...');
  
  try {
    // 先检查服务器是否可用
    const serverAvailable = await checkServerAvailability();
    if (!serverAvailable) {
      console.log('测试终止：服务器不可用');
      return;
    }
    
    // 创建测试用户
    testUserId = await createTestUser();
    if (!testUserId) {
      console.error('测试失败：无法创建测试用户');
      return;
    }
    
    // 创建测试消息
    testMessageId = await createTestMessage(testUserId);
    if (!testMessageId) {
      console.error('测试失败：无法创建测试消息');
      return;
    }
    
    // 登录
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.error('测试失败：无法登录');
      return;
    }
    
    // 标记消息为已读
    const markSuccess = await markMessageAsRead(testMessageId);
    if (!markSuccess) {
      console.error('测试失败：无法标记消息为已读');
      return;
    }
    
    // 验证消息状态
    const verified = await verifyMessageStatus(testMessageId);
    if (!verified) {
      console.error('测试失败：消息状态未更新为已读');
      return;
    }
    
    console.log('测试成功：消息已成功标记为已读');
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    // 清理测试数据
    await cleanupTestData();
    
    // 关闭数据库连接
    await sequelize.close();
    console.log('测试完成，数据库连接已关闭');
  }
}

// 执行测试
runTest(); 