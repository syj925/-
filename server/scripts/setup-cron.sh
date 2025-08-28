#!/bin/bash

# =====================================================
# 推荐系统定时任务设置脚本
# 用途：自动设置推荐分数更新的定时任务
# =====================================================

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NODE_PATH=$(which node)

# 检查Node.js是否已安装
if [ -z "$NODE_PATH" ]; then
    echo "❌ 错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

echo "📋 推荐系统定时任务设置"
echo "项目路径: $PROJECT_ROOT"
echo "Node.js路径: $NODE_PATH"
echo ""

# 定时任务配置
CRON_JOB_HOURLY="0 * * * * cd $PROJECT_ROOT && $NODE_PATH scripts/update-recommendation-scores.js >> logs/recommendation-cron.log 2>&1"
CRON_JOB_DAILY="0 2 * * * cd $PROJECT_ROOT && $NODE_PATH scripts/update-recommendation-scores.js --force >> logs/recommendation-cron.log 2>&1"

echo "🕐 建议的定时任务配置:"
echo ""
echo "1️⃣ 每小时更新（推荐）:"
echo "$CRON_JOB_HOURLY"
echo ""
echo "2️⃣ 每日凌晨2点强制全量更新:"
echo "$CRON_JOB_DAILY"
echo ""

# 询问用户是否要自动添加定时任务
read -p "是否自动添加这些定时任务到crontab? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 创建日志目录
    mkdir -p "$PROJECT_ROOT/logs"
    
    # 备份现有的crontab
    crontab -l > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "# 新建crontab" > /tmp/crontab_backup_$(date +%Y%m%d_%H%M%S)
    
    # 添加新的定时任务
    (crontab -l 2>/dev/null; echo ""; echo "# 推荐系统定时任务"; echo "$CRON_JOB_HOURLY"; echo "$CRON_JOB_DAILY") | crontab -
    
    echo "✅ 定时任务添加成功!"
    echo "📁 日志文件位置: $PROJECT_ROOT/logs/recommendation-cron.log"
    echo ""
    echo "🔍 查看当前定时任务:"
    crontab -l | grep -A 3 "推荐系统定时任务"
else
    echo "⏭️ 跳过自动设置，请手动添加定时任务"
fi

echo ""
echo "📖 手动管理说明:"
echo "• 查看定时任务: crontab -l"
echo "• 编辑定时任务: crontab -e"  
echo "• 删除定时任务: crontab -r"
echo "• 手动执行: cd $PROJECT_ROOT && node scripts/update-recommendation-scores.js"
echo "• 强制更新: cd $PROJECT_ROOT && node scripts/update-recommendation-scores.js --force"
echo ""
echo "🎯 定时任务说明:"
echo "• 每小时任务：更新最近变动的帖子分数"
echo "• 每日任务：强制重新计算所有帖子分数"
echo "• 日志会记录在 logs/recommendation-cron.log 文件中"
echo ""
echo "✅ 设置完成!"
