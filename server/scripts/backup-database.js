/**
 * 校园墙数据库备份脚本
 * 在系统重装前备份重要数据
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 数据库配置
const config = {
  database: process.env.DB_NAME || 'campus_community',
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '20060711',
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306
};

class DatabaseBackup {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  }

  async createBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log('✅ 备份目录创建成功');
    }
  }

  async backupDatabase() {
    console.log('🗄️ 开始备份数据库...');
    
    const backupFile = path.join(this.backupDir, `campus_wall_backup_${this.timestamp}.sql`);
    
    // 构建mysqldump命令
    const mysqldumpCmd = `mysqldump -h${config.host} -P${config.port} -u${config.username} -p${config.password} --single-transaction --routines --triggers ${config.database}`;
    
    return new Promise((resolve, reject) => {
      exec(mysqldumpCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 数据库备份失败:', error.message);
          reject(error);
          return;
        }
        
        if (stderr) {
          console.warn('⚠️ 备份警告:', stderr);
        }
        
        // 写入备份文件
        fs.writeFileSync(backupFile, stdout);
        console.log(`✅ 数据库备份完成: ${backupFile}`);
        resolve(backupFile);
      });
    });
  }

  async backupUploads() {
    console.log('📁 开始备份上传文件...');
    
    const uploadsDir = path.join(__dirname, '../uploads');
    const backupUploadsDir = path.join(this.backupDir, `uploads_${this.timestamp}`);
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('⚠️ uploads目录不存在，跳过文件备份');
      return null;
    }
    
    // 复制uploads目录
    const copyCmd = process.platform === 'win32' 
      ? `xcopy "${uploadsDir}" "${backupUploadsDir}" /E /I /H /Y`
      : `cp -r "${uploadsDir}" "${backupUploadsDir}"`;
    
    return new Promise((resolve, reject) => {
      exec(copyCmd, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 文件备份失败:', error.message);
          reject(error);
          return;
        }
        
        console.log(`✅ 文件备份完成: ${backupUploadsDir}`);
        resolve(backupUploadsDir);
      });
    });
  }

  async createRestoreScript() {
    console.log('📝 创建恢复脚本...');
    
    const restoreScript = `
-- 校园墙数据库恢复脚本
-- 备份时间: ${new Date().toLocaleString()}
-- 数据库: ${config.database}

-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS \`${config.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 使用数据库
USE \`${config.database}\`;

-- 3. 导入备份数据
-- 请使用以下命令导入备份文件:
-- mysql -h${config.host} -P${config.port} -u${config.username} -p${config.password} ${config.database} < campus_wall_backup_${this.timestamp}.sql

-- 4. 验证数据
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM posts;
-- SELECT COUNT(*) FROM comments;

-- 恢复完成后，请运行以下命令创建管理员账户:
-- node scripts/seed-data.js
`;

    const scriptFile = path.join(this.backupDir, `restore_instructions_${this.timestamp}.sql`);
    fs.writeFileSync(scriptFile, restoreScript);
    console.log(`✅ 恢复脚本创建完成: ${scriptFile}`);
    
    return scriptFile;
  }

  async createBackupInfo() {
    const info = {
      timestamp: new Date().toISOString(),
      database: config.database,
      host: config.host,
      port: config.port,
      username: config.username,
      backupFiles: {
        database: `campus_wall_backup_${this.timestamp}.sql`,
        uploads: `uploads_${this.timestamp}`,
        restoreScript: `restore_instructions_${this.timestamp}.sql`
      },
      instructions: {
        restore: [
          '1. 确保MySQL服务运行',
          '2. 创建数据库: CREATE DATABASE campus_community;',
          `3. 导入数据: mysql -u${config.username} -p ${config.database} < campus_wall_backup_${this.timestamp}.sql`,
          '4. 复制uploads文件夹到server目录',
          '5. 运行: node scripts/seed-data.js 创建管理员账户'
        ]
      }
    };

    const infoFile = path.join(this.backupDir, `backup_info_${this.timestamp}.json`);
    fs.writeFileSync(infoFile, JSON.stringify(info, null, 2));
    console.log(`✅ 备份信息文件创建完成: ${infoFile}`);
    
    return infoFile;
  }

  async backup() {
    try {
      console.log('🚀 开始校园墙数据库备份...');
      console.log('');
      console.log('📊 配置信息:');
      console.log(`   数据库: ${config.database}`);
      console.log(`   主机: ${config.host}:${config.port}`);
      console.log(`   用户: ${config.username}`);
      console.log(`   备份时间: ${this.timestamp}`);
      console.log('');

      await this.createBackupDirectory();
      
      const dbBackupFile = await this.backupDatabase();
      const uploadsBackupDir = await this.backupUploads().catch(() => null);
      const restoreScript = await this.createRestoreScript();
      const infoFile = await this.createBackupInfo();

      console.log('');
      console.log('🎉 备份完成！');
      console.log('');
      console.log('📁 备份文件:');
      console.log(`   - 数据库: ${path.basename(dbBackupFile)}`);
      if (uploadsBackupDir) {
        console.log(`   - 上传文件: ${path.basename(uploadsBackupDir)}`);
      }
      console.log(`   - 恢复脚本: ${path.basename(restoreScript)}`);
      console.log(`   - 备份信息: ${path.basename(infoFile)}`);
      console.log('');
      console.log('📝 恢复说明:');
      console.log('   1. 重装系统后，将备份文件复制到新系统');
      console.log('   2. 安装MySQL和Node.js');
      console.log('   3. 运行恢复脚本中的命令');
      console.log('   4. 使用 restore-campus-wall.bat 恢复项目环境');
      console.log('');
      console.log('💾 备份目录:', this.backupDir);

    } catch (error) {
      console.error('❌ 备份失败:', error.message);
      throw error;
    }
  }
}

// 主函数
async function main() {
  const backup = new DatabaseBackup();
  
  try {
    await backup.backup();
    process.exit(0);
  } catch (error) {
    console.error('备份过程中发生错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = DatabaseBackup;
