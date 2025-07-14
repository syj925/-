@echo off
echo === 校园墙应用启动脚本 ===
echo.

REM 检查目录结构
if exist server\app.js (
    echo 警告: 发现嵌套的server目录结构
    echo 正在修复目录结构...
    cd server
)

REM 检查PM2是否已安装
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PM2未安装，正在安装...
    call npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo PM2安装失败，请手动安装后重试
        pause
        exit /b 1
    )
    echo PM2安装成功
)

REM 安装项目依赖
echo 正在安装项目依赖...
call npm install
echo 确保必要的依赖已安装...
call npm install express-session redis sequelize express-rate-limit --save
if %ERRORLEVEL% NEQ 0 (
    echo 依赖安装失败，请检查网络或权限
    pause
    exit /b 1
)

REM 优化数据库索引（可选）
echo 是否要优化数据库索引? (Y/N)
set /p OPTIMIZE=
if /i "%OPTIMIZE%"=="Y" (
    echo 正在优化数据库索引...
    node scripts/add-indexes.js
)

REM 检查是否需要直接启动而不使用PM2
echo 是否直接启动应用(不使用PM2)? (Y/N)
set /p DIRECT=
if /i "%DIRECT%"=="Y" (
    echo 正在直接启动应用...
    node app.js
    pause
    exit /b 0
)

REM 使用PM2启动应用
echo 正在启动应用(生产环境)...
call pm2 start ecosystem.config.js --env production

if %ERRORLEVEL% NEQ 0 (
    echo 应用启动失败，请检查配置和日志
    echo 尝试直接启动应用...
    node app.js
    pause
    exit /b 1
)

echo.
echo === 应用已成功启动 ===
echo.
echo 常用PM2命令:
echo   pm2 list          - 查看所有应用
echo   pm2 monit         - 监控应用
echo   pm2 logs          - 查看日志
echo   pm2 stop campus-wall  - 停止应用
echo   pm2 restart campus-wall - 重启应用
echo.
echo 应用已在后台运行，可以关闭此窗口
pause 