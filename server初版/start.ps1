# PowerShell启动脚本 - 专为Windows PowerShell设计

Write-Host "=== 校园墙应用启动脚本 (PowerShell版) ===" -ForegroundColor Green
Write-Host ""

# 检查目录结构
if (Test-Path "server\app.js") {
    Write-Host "警告: 发现嵌套的server目录结构" -ForegroundColor Yellow
    Write-Host "正在修复目录结构..." -ForegroundColor Yellow
    Set-Location server
}

# 检查PM2是否已安装
$pm2Installed = $null
try {
    $pm2Installed = Get-Command pm2 -ErrorAction Stop
} 
catch {
    Write-Host "PM2未安装，正在安装..." -ForegroundColor Yellow
    npm install -g pm2
    if (-not $?) {
        Write-Host "PM2安装失败，请手动安装后重试" -ForegroundColor Red
        Read-Host "按Enter键继续..."
        exit 1
    }
    Write-Host "PM2安装成功" -ForegroundColor Green
}

# 安装项目依赖
Write-Host "正在安装项目依赖..." -ForegroundColor Cyan
npm install

Write-Host "确保必要的依赖已安装..." -ForegroundColor Cyan
npm install express-session redis sequelize express-rate-limit --save

if (-not $?) {
    Write-Host "依赖安装失败，请检查网络或权限" -ForegroundColor Red
    Read-Host "按Enter键继续..."
    exit 1
}

# 优化数据库索引（可选）
$optimize = Read-Host "是否要优化数据库索引? (Y/N)"
if ($optimize -eq "Y" -or $optimize -eq "y") {
    Write-Host "正在优化数据库索引..." -ForegroundColor Cyan
    node scripts/add-indexes.js
}

# 检查是否需要直接启动而不使用PM2
$direct = Read-Host "是否直接启动应用(不使用PM2)? (Y/N)"
if ($direct -eq "Y" -or $direct -eq "y") {
    Write-Host "正在直接启动应用..." -ForegroundColor Green
    node app.js
    Read-Host "按Enter键继续..."
    exit 0
}

# 使用PM2启动应用
Write-Host "正在启动应用(生产环境)..." -ForegroundColor Green
pm2 start ecosystem.config.js --env production

if (-not $?) {
    Write-Host "应用启动失败，请检查配置和日志" -ForegroundColor Red
    Write-Host "尝试直接启动应用..." -ForegroundColor Yellow
    node app.js
    Read-Host "按Enter键继续..."
    exit 1
}

Write-Host ""
Write-Host "=== 应用已成功启动 ===" -ForegroundColor Green
Write-Host ""
Write-Host "常用PM2命令:" -ForegroundColor Cyan
Write-Host "  pm2 list          - 查看所有应用" -ForegroundColor Gray
Write-Host "  pm2 monit         - 监控应用" -ForegroundColor Gray
Write-Host "  pm2 logs          - 查看日志" -ForegroundColor Gray
Write-Host "  pm2 stop campus-wall  - 停止应用" -ForegroundColor Gray
Write-Host "  pm2 restart campus-wall - 重启应用" -ForegroundColor Gray
Write-Host ""
Write-Host "应用已在后台运行，可以关闭此窗口" -ForegroundColor Green
Read-Host "按Enter键继续..."

# 服务器启动脚本 (PowerShell)
Write-Host "正在启动服务器..." -ForegroundColor Green

# 首先执行数据库迁移修复
Write-Host "正在修复数据库结构..." -ForegroundColor Yellow
node fix-migration.js

# 启动服务器
Write-Host "启动后端服务..." -ForegroundColor Green
node app.js 