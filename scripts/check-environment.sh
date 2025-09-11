#!/bin/bash

# 校园墙环境检查脚本
# 使用方法: chmod +x check-environment.sh && ./check-environment.sh

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查结果计数
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    ((PASSED_CHECKS++))
}

log_failure() {
    echo -e "${RED}[✗]${NC} $1"
    ((FAILED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

# 检查函数
check_command() {
    local cmd=$1
    local name=$2
    local version_flag=$3
    
    ((TOTAL_CHECKS++))
    
    if command -v "$cmd" &> /dev/null; then
        local version=""
        if [[ -n "$version_flag" ]]; then
            version=$($cmd $version_flag 2>/dev/null | head -1)
        fi
        log_success "$name 已安装 $version"
        return 0
    else
        log_failure "$name 未安装"
        return 1
    fi
}

check_service() {
    local service=$1
    local name=$2
    
    ((TOTAL_CHECKS++))
    
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        log_success "$name 服务正在运行"
        return 0
    else
        log_failure "$name 服务未运行"
        return 1
    fi
}

check_port() {
    local port=$1
    local name=$2
    
    ((TOTAL_CHECKS++))
    
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        log_success "$name (端口 $port) 正在监听"
        return 0
    else
        log_failure "$name (端口 $port) 未监听"
        return 1
    fi
}

check_directory() {
    local dir=$1
    local name=$2
    local writable=$3
    
    ((TOTAL_CHECKS++))
    
    if [[ -d "$dir" ]]; then
        if [[ "$writable" == "true" && ! -w "$dir" ]]; then
            log_failure "$name 目录存在但不可写: $dir"
            return 1
        fi
        log_success "$name 目录存在: $dir"
        return 0
    else
        log_failure "$name 目录不存在: $dir"
        return 1
    fi
}

check_file() {
    local file=$1
    local name=$2
    
    ((TOTAL_CHECKS++))
    
    if [[ -f "$file" ]]; then
        log_success "$name 文件存在: $file"
        return 0
    else
        log_failure "$name 文件不存在: $file"
        return 1
    fi
}

# 系统信息
show_system_info() {
    echo "=================================="
    echo "系统环境检查报告"
    echo "=================================="
    echo
    echo "系统信息:"
    echo "  操作系统: $(lsb_release -d 2>/dev/null | cut -f2 || uname -s)"
    echo "  内核版本: $(uname -r)"
    echo "  架构: $(uname -m)"
    echo "  当前用户: $(whoami)"
    echo "  当前时间: $(date)"
    echo
}

# 检查基础软件
check_basic_software() {
    echo "检查基础软件安装状态..."
    echo "--------------------------------"
    
    check_command "node" "Node.js" "--version"
    check_command "npm" "NPM" "--version"
    check_command "git" "Git" "--version"
    check_command "curl" "cURL" "--version"
    check_command "wget" "Wget" "--version"
    check_command "unzip" "Unzip" "-v"
    
    echo
}

# 检查Node.js版本
check_node_version() {
    echo "检查Node.js版本要求..."
    echo "--------------------------------"
    
    ((TOTAL_CHECKS++))
    
    if command -v node &> /dev/null; then
        local node_version=$(node -v | cut -d'v' -f2)
        local required_version="18.0.0"
        
        if printf '%s\n' "$required_version" "$node_version" | sort -C -V; then
            log_success "Node.js版本符合要求: $node_version (>= $required_version)"
        else
            log_failure "Node.js版本过低: $node_version (需要 >= $required_version)"
        fi
    else
        log_failure "Node.js未安装"
    fi
    
    echo
}

# 检查数据库和缓存
check_databases() {
    echo "检查数据库和缓存服务..."
    echo "--------------------------------"
    
    check_command "mysql" "MySQL客户端" "--version"
    check_command "redis-cli" "Redis客户端" "--version"
    
    check_service "mysql" "MySQL"
    check_service "redis-server" "Redis"
    check_service "redis" "Redis"
    
    check_port "3306" "MySQL"
    check_port "6379" "Redis"
    
    echo
}

# 检查Web服务器
check_web_server() {
    echo "检查Web服务器..."
    echo "--------------------------------"
    
    check_command "nginx" "Nginx" "-v"
    check_service "nginx" "Nginx"
    check_port "80" "HTTP"
    check_port "443" "HTTPS"
    
    echo
}

# 检查进程管理器
check_process_manager() {
    echo "检查进程管理器..."
    echo "--------------------------------"
    
    check_command "pm2" "PM2" "--version"
    check_command "systemctl" "Systemd" "--version"
    
    echo
}

# 检查项目目录和文件
check_project_files() {
    echo "检查项目文件和目录..."
    echo "--------------------------------"
    
    local project_dir="/var/www/campus-wall"
    
    check_directory "$project_dir" "项目根目录"
    check_directory "$project_dir/server" "后端目录"
    check_directory "$project_dir/admin" "管理后台目录"
    check_directory "$project_dir/server/uploads" "上传目录" "true"
    check_directory "$project_dir/server/logs" "日志目录" "true"
    
    check_file "$project_dir/server/package.json" "后端package.json"
    check_file "$project_dir/server/src/server.js" "后端主文件"
    check_file "$project_dir/server/ecosystem.config.js" "PM2配置文件"
    check_file "$project_dir/admin/package.json" "管理后台package.json"
    
    echo
}

# 检查配置文件
check_config_files() {
    echo "检查配置文件..."
    echo "--------------------------------"
    
    local config_dir="/var/www/campus-wall/server/config"
    
    check_file "$config_dir/config.json" "数据库配置"
    check_file "/var/www/campus-wall/server/.env" "环境变量文件"
    check_file "/etc/nginx/sites-available/campus-wall-admin" "Nginx配置"
    
    echo
}

# 检查权限
check_permissions() {
    echo "检查文件权限..."
    echo "--------------------------------"
    
    local project_dir="/var/www/campus-wall"
    
    ((TOTAL_CHECKS++))
    if [[ -d "$project_dir" ]]; then
        local owner=$(stat -c '%U' "$project_dir" 2>/dev/null)
        if [[ "$owner" == "$(whoami)" || "$owner" == "www-data" ]]; then
            log_success "项目目录权限正确: $owner"
        else
            log_failure "项目目录权限不正确: $owner (应该是 $(whoami) 或 www-data)"
        fi
    else
        log_failure "项目目录不存在"
    fi
    
    echo
}

# 检查网络连接
check_network() {
    echo "检查网络连接..."
    echo "--------------------------------"
    
    ((TOTAL_CHECKS++))
    if ping -c 1 google.com &> /dev/null; then
        log_success "外网连接正常"
    else
        log_failure "外网连接失败"
    fi
    
    ((TOTAL_CHECKS++))
    if curl -s localhost &> /dev/null; then
        log_success "本地网络连接正常"
    else
        log_failure "本地网络连接失败"
    fi
    
    echo
}

# 检查防火墙
check_firewall() {
    echo "检查防火墙配置..."
    echo "--------------------------------"
    
    if command -v ufw &> /dev/null; then
        ((TOTAL_CHECKS++))
        local ufw_status=$(ufw status 2>/dev/null | head -1)
        if echo "$ufw_status" | grep -q "Status: active"; then
            log_success "UFW防火墙已启用"
            
            # 检查端口开放状态
            local ports=("22/tcp" "80/tcp" "443/tcp")
            for port in "${ports[@]}"; do
                ((TOTAL_CHECKS++))
                if ufw status | grep -q "$port.*ALLOW"; then
                    log_success "端口 $port 已开放"
                else
                    log_failure "端口 $port 未开放"
                fi
            done
        else
            log_warning "UFW防火墙未启用"
        fi
    else
        log_warning "未找到UFW防火墙"
    fi
    
    echo
}

# 检查磁盘空间
check_disk_space() {
    echo "检查磁盘空间..."
    echo "--------------------------------"
    
    local usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    ((TOTAL_CHECKS++))
    if [[ $usage -lt 80 ]]; then
        log_success "磁盘空间充足: ${usage}% 已使用"
    elif [[ $usage -lt 90 ]]; then
        log_warning "磁盘空间紧张: ${usage}% 已使用"
    else
        log_failure "磁盘空间不足: ${usage}% 已使用"
    fi
    
    echo
}

# 检查内存
check_memory() {
    echo "检查内存使用情况..."
    echo "--------------------------------"
    
    local memory_info=$(free -m)
    local total_mem=$(echo "$memory_info" | awk 'NR==2{print $2}')
    local used_mem=$(echo "$memory_info" | awk 'NR==2{print $3}')
    local usage=$((used_mem * 100 / total_mem))
    
    ((TOTAL_CHECKS++))
    if [[ $usage -lt 80 ]]; then
        log_success "内存使用正常: ${usage}% (${used_mem}M/${total_mem}M)"
    elif [[ $usage -lt 90 ]]; then
        log_warning "内存使用较高: ${usage}% (${used_mem}M/${total_mem}M)"
    else
        log_failure "内存使用过高: ${usage}% (${used_mem}M/${total_mem}M)"
    fi
    
    echo
}

# 生成建议
generate_recommendations() {
    echo "部署建议..."
    echo "--------------------------------"
    
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        echo "发现 $FAILED_CHECKS 个问题，建议处理后再进行部署："
        echo
        
        if ! command -v node &> /dev/null; then
            echo "• 安装Node.js: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs"
        fi
        
        if ! command -v mysql &> /dev/null; then
            echo "• 安装MySQL: sudo apt install mysql-server"
        fi
        
        if ! command -v redis-cli &> /dev/null; then
            echo "• 安装Redis: sudo apt install redis-server"
        fi
        
        if ! command -v nginx &> /dev/null; then
            echo "• 安装Nginx: sudo apt install nginx"
        fi
        
        if ! command -v pm2 &> /dev/null; then
            echo "• 安装PM2: npm install -g pm2"
        fi
        
        echo
    fi
    
    echo "性能优化建议："
    echo "• 配置MySQL优化参数"
    echo "• 设置Redis持久化"
    echo "• 配置Nginx gzip压缩"
    echo "• 设置定期备份任务"
    echo "• 配置日志轮转"
    echo
}

# 显示结果摘要
show_summary() {
    echo "=================================="
    echo "检查结果摘要"
    echo "=================================="
    echo
    echo "总检查项: $TOTAL_CHECKS"
    echo -e "通过: ${GREEN}$PASSED_CHECKS${NC}"
    echo -e "失败: ${RED}$FAILED_CHECKS${NC}"
    echo
    
    local success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    if [[ $success_rate -ge 90 ]]; then
        echo -e "${GREEN}✓ 环境状态优秀，可以进行部署${NC}"
    elif [[ $success_rate -ge 75 ]]; then
        echo -e "${YELLOW}⚠ 环境基本就绪，建议解决部分问题后部署${NC}"
    else
        echo -e "${RED}✗ 环境存在较多问题，请解决后再部署${NC}"
    fi
    
    echo
}

# 主函数
main() {
    show_system_info
    check_basic_software
    check_node_version
    check_databases
    check_web_server
    check_process_manager
    check_project_files
    check_config_files
    check_permissions
    check_network
    check_firewall
    check_disk_space
    check_memory
    generate_recommendations
    show_summary
}

# 运行主函数
main "$@"







