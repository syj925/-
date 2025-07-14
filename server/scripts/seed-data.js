const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// 使用现有的模型，而不是手动创建表
const { User } = require('../src/models');

async function seedAdminUser() {
  try {
    console.log('开始创建管理员用户...');

    // 检查是否已存在管理员用户
    const existingAdmin = await User.scope('withPassword').findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('管理员用户已存在，跳过创建');

      // 检查是否需要更新角色
      if (existingAdmin.role !== 'admin') {
        await existingAdmin.update({ role: 'admin' });
        console.log('已将现有用户角色更新为管理员');
      }

      console.log('管理员信息:');
      console.log(`- 用户名: ${existingAdmin.username}`);
      console.log(`- 昵称: ${existingAdmin.nickname}`);
      console.log(`- 邮箱: ${existingAdmin.email}`);
      console.log(`- 角色: ${existingAdmin.role}`);
      return;
    }

    // 创建管理员用户
    const adminPassword = await bcrypt.hash('admin123', 10);

    const adminUser = await User.create({
      id: uuidv4(),
      username: 'admin',
      password: adminPassword,
      nickname: '系统管理员',
      email: 'admin@campus-wall.com',
      role: 'admin',
      bio: '校园墙系统管理员',
      is_disabled: false
    });

    console.log('✅ 管理员用户创建成功！');
    console.log('管理员登录信息:');
    console.log(`- 用户名: admin`);
    console.log(`- 密码: admin123`);
    console.log(`- 昵称: ${adminUser.nickname}`);
    console.log(`- 邮箱: ${adminUser.email}`);
    console.log(`- 角色: ${adminUser.role}`);
    console.log(`- 用户ID: ${adminUser.id}`);

    // 可选：创建一个测试用户
    const existingTestUser = await User.findOne({
      where: { username: 'testuser' }
    });

    if (!existingTestUser) {
      const testPassword = await bcrypt.hash('test123', 10);

      const testUser = await User.create({
        id: uuidv4(),
        username: 'testuser',
        password: testPassword,
        nickname: '测试用户',
        email: 'test@campus-wall.com',
        role: 'student',
        bio: '这是一个测试用户',
        is_disabled: false
      });

      console.log('✅ 测试用户创建成功！');
      console.log('测试用户登录信息:');
      console.log(`- 用户名: testuser`);
      console.log(`- 密码: test123`);
      console.log(`- 昵称: ${testUser.nickname}`);
    } else {
      console.log('测试用户已存在，跳过创建');
    }

  } catch (error) {
    console.error('❌ 创建管理员用户时出错:', error);

    // 提供更详细的错误信息
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.error('用户名或邮箱已存在，请检查数据库中的现有数据');
    } else if (error.name === 'SequelizeValidationError') {
      console.error('数据验证失败:', error.errors.map(e => e.message));
    } else {
      console.error('详细错误:', error.message);
    }

    process.exit(1);
  }
}

// 主函数
async function main() {
  try {
    console.log('🚀 开始初始化管理员数据...');
    await seedAdminUser();
    console.log('🎉 管理员数据初始化完成！');
    console.log('\n现在您可以使用以下信息登录管理后台:');
    console.log('- 访问地址: http://localhost:8888');
    console.log('- 用户名: admin');
    console.log('- 密码: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化过程中发生错误:', error);
    process.exit(1);
  }
}

// 执行主函数
main();