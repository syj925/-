@echo off
chcp 65001 >nul
echo.
echo 🔧 校园墙项目索引优化 - Windows版本
echo ==========================================
echo.

:: 检查MySQL是否可用
mysql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到MySQL客户端，请确保MySQL已安装并添加到PATH
    pause
    exit /b 1
)

:: 设置变量
set "DB_USER=root"
set "DB_PASS=20060711"
set "DB_NAME=campus_community"
set "BACKUP_FILE=backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%.sql"

echo 📋 执行信息:
echo    数据库: %DB_NAME%
echo    备份文件: %BACKUP_FILE%
echo    清理脚本: final-index-cleanup.sql
echo.

:: 确认执行
set /p confirm="是否继续执行索引优化? (y/N): "
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 🔄 步骤 1/4: 备份数据库...
mysqldump -u %DB_USER% -p%DB_PASS% %DB_NAME% > "%BACKUP_FILE%"
if errorlevel 1 (
    echo ❌ 数据库备份失败！
    pause
    exit /b 1
)
echo ✅ 备份完成: %BACKUP_FILE%

echo.
echo 🔧 步骤 2/4: 执行索引清理...
mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < final-index-cleanup.sql
if errorlevel 1 (
    echo ❌ 索引清理失败！
    echo 💡 可以使用备份文件恢复: mysql -u %DB_USER% -p%DB_PASS% %DB_NAME% < "%BACKUP_FILE%"
    pause
    exit /b 1
)
echo ✅ 索引清理完成

echo.
echo 📊 步骤 3/4: 验证清理结果...
mysql -u %DB_USER% -p%DB_PASS% -D %DB_NAME% -e "SELECT '清理后索引总数' as info, COUNT(*) as total_indexes FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = '%DB_NAME%';"

echo.
echo 🎯 步骤 4/4: 显示优化效果...
mysql -u %DB_USER% -p%DB_PASS% -D %DB_NAME% -e "SELECT '优化效果' as result, '原索引: 156个' as before_cleanup, CONCAT('当前索引: ', COUNT(*), '个') as after_cleanup, CONCAT('清理: ', 156 - COUNT(*), '个') as removed, CONCAT('优化率: ', ROUND(((156 - COUNT(*)) / 156) * 100, 1), '%%') as rate FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = '%DB_NAME%';"

echo.
echo 🎉 索引优化全部完成！
echo.
echo 📋 后续建议:
echo    1. 监控慢查询日志 7 天
echo    2. 观察业务性能指标
echo    3. 如有问题，使用备份文件恢复
echo    4. 备份文件位置: %BACKUP_FILE%
echo.
pause
