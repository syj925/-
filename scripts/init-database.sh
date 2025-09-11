#!/bin/bash

# 校园墙数据库初始化脚本
# 使用方法: chmod +x init-database.sh && ./init-database.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 配置变量
DB_NAME="campus_community"
DB_USER="campus_wall"
DB_HOST="localhost"
DB_PORT="3306"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查MySQL是否运行
check_mysql() {
    log_info "检查MySQL服务状态..."
    
    if ! systemctl is-active --quiet mysql; then
        log_error "MySQL服务未运行，请启动MySQL服务"
        echo "运行命令: sudo systemctl start mysql"
        exit 1
    fi
    
    log_success "MySQL服务正在运行"
}

# 获取MySQL root密码
get_mysql_password() {
    echo -n "请输入MySQL root密码: "
    read -s MYSQL_ROOT_PASSWORD
    echo
    
    # 测试连接
    if ! mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1;" &>/dev/null; then
        log_error "MySQL连接失败，请检查密码"
        exit 1
    fi
    
    log_success "MySQL连接成功"
}

# 获取新用户密码
get_user_password() {
    while true; do
        echo -n "为数据库用户 '$DB_USER' 设置密码: "
        read -s DB_PASSWORD
        echo
        
        echo -n "确认密码: "
        read -s DB_PASSWORD_CONFIRM
        echo
        
        if [[ "$DB_PASSWORD" == "$DB_PASSWORD_CONFIRM" ]]; then
            break
        else
            log_error "密码不匹配，请重新输入"
        fi
    done
}

# 创建数据库和用户
create_database() {
    log_info "创建数据库和用户..."
    
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
-- 创建数据库
CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER IF NOT EXISTS '$DB_USER'@'$DB_HOST' IDENTIFIED BY '$DB_PASSWORD';

-- 授权
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'$DB_HOST';

-- 刷新权限
FLUSH PRIVILEGES;

-- 显示创建结果
SELECT 'Database created successfully' as Result;
SHOW DATABASES LIKE '$DB_NAME';
SELECT User, Host FROM mysql.user WHERE User = '$DB_USER';
EOF

    log_success "数据库 '$DB_NAME' 和用户 '$DB_USER' 创建成功"
}

# 测试数据库连接
test_connection() {
    log_info "测试数据库连接..."
    
    if mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -P "$DB_PORT" "$DB_NAME" -e "SELECT 1;" &>/dev/null; then
        log_success "数据库连接测试成功"
    else
        log_error "数据库连接测试失败"
        exit 1
    fi
}

# 创建配置文件
create_config() {
    log_info "创建数据库配置文件..."
    
    local config_dir="$(dirname "$0")/../server/config"
    local config_file="$config_dir/config.production.json"
    
    if [[ ! -d "$config_dir" ]]; then
        log_warning "配置目录不存在，创建示例配置"
        mkdir -p "$config_dir"
    fi
    
    cat > "$config_file" << EOF
{
  "production": {
    "username": "$DB_USER",
    "password": "$DB_PASSWORD",
    "database": "$DB_NAME",
    "host": "$DB_HOST",
    "port": $DB_PORT,
    "dialect": "mysql",
    "timezone": "+08:00",
    "dialectOptions": {
      "charset": "utf8mb4"
    },
    "define": {
      "charset": "utf8mb4",
      "collate": "utf8mb4_unicode_ci"
    }
  }
}
EOF

    log_success "配置文件已创建: $config_file"
}

# 创建环境变量文件
create_env_file() {
    log_info "创建环境变量文件..."
    
    local env_file="$(dirname "$0")/../server/.env.production"
    
    cat > "$env_file" << EOF
NODE_ENV=production
PORT=3000

# 数据库配置
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Redis配置 (请根据实际情况修改)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT密钥 (请修改为强密钥)
JWT_SECRET=$(openssl rand -base64 32)

# 文件上传配置
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/server.log
EOF

    chmod 600 "$env_file"
    log_success "环境变量文件已创建: $env_file"
    log_warning "请根据实际情况修改Redis配置和其他设置"
}

# 显示MySQL优化建议
show_mysql_optimization() {
    log_info "MySQL优化建议:"
    echo
    echo "1. 编辑MySQL配置文件 /etc/mysql/mysql.conf.d/mysqld.cnf，添加以下配置:"
    echo
    cat << 'EOF'
[mysqld]
# 字符集配置
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# 连接数优化
max_connections = 500
max_connect_errors = 100

# 查询缓存
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M

# InnoDB 优化
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_file_per_table = 1
innodb_flush_log_at_trx_commit = 2

# 慢查询日志
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

[mysql]
default-character-set = utf8mb4

[client]
default-character-set = utf8mb4
EOF
    echo
    echo "2. 重启MySQL服务: sudo systemctl restart mysql"
    echo
}

# 显示部署后续步骤
show_next_steps() {
    log_success "数据库初始化完成！"
    echo
    echo "数据库信息:"
    echo "  数据库名: $DB_NAME"
    echo "  用户名: $DB_USER"
    echo "  主机: $DB_HOST"
    echo "  端口: $DB_PORT"
    echo
    echo "下一步操作:"
    echo "1. 进入项目后端目录: cd server"
    echo "2. 安装依赖: npm install"
    echo "3. 运行数据库迁移: npm run seed-data"
    echo "4. 启动服务: pm2 start ecosystem.config.js --env production"
    echo
    echo "配置文件位置:"
    echo "  数据库配置: server/config/config.production.json"
    echo "  环境变量: server/.env.production"
    echo
}

# 主函数
main() {
    log_info "开始初始化校园墙数据库..."
    
    check_mysql
    get_mysql_password
    get_user_password
    create_database
    test_connection
    create_config
    create_env_file
    show_mysql_optimization
    show_next_steps
}

# 运行主函数
main "$@"







