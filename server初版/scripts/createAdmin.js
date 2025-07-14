const { sequelize } = require('../config/db');
const User = require('../models/User');

// 创建管理员账户
async function createAdminUser() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接成功!');
    
    // 检查管理员是否存在
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    
    if (existingAdmin) {
      console.log('管理员账户已存在，正在更新...');
      
      // 更新为管理员角色和激活状态
      await existingAdmin.update({
        role: 'admin',
        status: 'active',
        nickname: '系统管理员',
        password: 'admin123'  // 会通过模型的setter方法自动加密
      });
      
      console.log('管理员账户已更新');
      console.log(`用户名: ${existingAdmin.username}`);
      console.log(`角色: ${existingAdmin.role}`);
    } else {
      console.log('创建新的管理员账户...');
      
      // 创建新管理员
      const newAdmin = await User.create({
        username: 'admin',
        password: 'admin123',  // 会通过模型的setter方法自动加密
        nickname: '系统管理员',
        role: 'admin',
        status: 'active'
      });
      
      console.log('管理员账户创建成功');
      console.log(`ID: ${newAdmin.id}`);
      console.log(`用户名: ${newAdmin.username}`);
      console.log(`角色: ${newAdmin.role}`);
    }
  } catch (error) {
    console.error('创建管理员账户出错:', error);
  } finally {
    // 关闭数据库连接
    await sequelize.close();
  }
}

// 执行创建管理员账户函数
createAdminUser(); 