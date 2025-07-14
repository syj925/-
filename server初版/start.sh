#!/bin/bash

echo "=== 校园墙应用启动脚本 ==="
echo

# 检查PM2是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "PM2未安装，正在安装..."
    npm install -g pm2
    if [ $? -ne 0 ]; then
        echo "PM2安装失败，请手动安装后重试"
        exit 1
    fi
    echo "PM2安装成功"
fi

# 安装项目依赖
echo "正在安装项目依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "依赖安装失败，请检查网络或权限"
    exit 1
fi

# 优化数据库索引（可选）
read -p "是否要优化数据库索引? (y/n): " OPTIMIZE
if [[ $OPTIMIZE == "y" || $OPTIMIZE == "Y" ]]; then
    echo "正在优化数据库索引..."
    node scripts/add-indexes.js
fi

# 使用PM2启动应用
echo "正在启动应用(生产环境)..."
pm2 start ecosystem.config.js --env production

if [ $? -ne 0 ]; then
    echo "应用启动失败，请检查配置和日志"
    exit 1
fi

echo
echo "=== 应用已成功启动 ==="
echo
echo "常用PM2命令:"
echo "  pm2 list          - 查看所有应用"
echo "  pm2 monit         - 监控应用"
echo "  pm2 logs          - 查看日志"
echo "  pm2 stop campus-wall  - 停止应用"
echo "  pm2 restart campus-wall - 重启应用"
echo
echo "应用已在后台运行，可以关闭此终端" 