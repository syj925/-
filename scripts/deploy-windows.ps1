# 校园墙项目Windows部署脚本
# 使用方法: 以管理员身份运行PowerShell，然后执行 .\deploy-windows.ps1

param(
    [string]$ProjectPath = "C:\campus-wall",
    [string]$Domain = "localhost"
)

# 检查管理员权限
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "请以管理员身份运行此脚本"
    exit 1
}

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    } else {
        $input | Write-Output
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Info($message) {
    Write-ColorOutput Blue "[INFO] $message"
}

function Write-Success($message) {
    Write-ColorOutput Green "[SUCCESS] $message"
}

function Write-Warning($message) {
    Write-ColorOutput Yellow "[WARNING] $message"
}

function Write-Error($message) {
    Write-ColorOutput Red "[ERROR] $message"
}

# 检查软件是否安装
function Test-Command($command) {
    try {
        if (Get-Command $command -ErrorAction Stop) {
            return $true
        }
    } catch {
        return $false
    }
}

# 检查Node.js版本
function Test-NodeVersion {
    if (-not (Test-Command "node")) {
        return $false
    }
    
    $nodeVersion = node --version
    $version = $nodeVersion.Substring(1) # 移除 'v' 前缀
    $requiredVersion = [version]"18.0.0"
    $currentVersion = [version]$version
    
    return $currentVersion -ge $requiredVersion
}

# 安装Chocolatey
function Install-Chocolatey {
    Write-Info "检查Chocolatey安装状态..."
    
    if (-not (Test-Command "choco")) {
        Write-Info "安装Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
        refreshenv
        Write-Success "Chocolatey安装完成"
    } else {
        Write-Success "Chocolatey已安装"
    }
}

# 安装必要软件
function Install-Prerequisites {
    Write-Info "安装必要软件..."
    
    # 检查并安装Node.js
    if (-not (Test-NodeVersion)) {
        Write-Info "安装Node.js..."
        choco install nodejs -y
        refreshenv
    } else {
        Write-Success "Node.js已安装且版本符合要求"
    }
    
    # 检查并安装Git
    if (-not (Test-Command "git")) {
        Write-Info "安装Git..."
        choco install git -y
        refreshenv
    } else {
        Write-Success "Git已安装"
    }
    
    # 检查并安装PM2
    if (-not (Test-Command "pm2")) {
        Write-Info "安装PM2..."
        npm install -g pm2
        npm install -g pm2-windows-startup
        pm2-startup install
    } else {
        Write-Success "PM2已安装"
    }
}

# 安装数据库
function Install-Databases {
    Write-Info "安装数据库服务..."
    
    # 安装MySQL
    Write-Info "安装MySQL..."
    choco install mysql -y
    
    # 安装Redis
    Write-Info "安装Redis..."
    choco install redis-64 -y
    
    Write-Success "数据库服务安装完成"
    Write-Warning "请手动配置MySQL root密码和Redis配置"
}

# 创建项目目录
function New-ProjectDirectory {
    Write-Info "创建项目目录..."
    
    if (-not (Test-Path $ProjectPath)) {
        New-Item -ItemType Directory -Path $ProjectPath -Force
        Write-Success "项目目录创建成功: $ProjectPath"
    } else {
        Write-Warning "项目目录已存在: $ProjectPath"
    }
}

# 部署后端
function Deploy-Backend {
    Write-Info "部署后端服务..."
    
    $serverPath = Join-Path $ProjectPath "server"
    
    if (-not (Test-Path $serverPath)) {
        Write-Error "未找到后端目录: $serverPath"
        return
    }
    
    Set-Location $serverPath
    
    # 安装依赖
    Write-Info "安装后端依赖..."
    npm install --production
    
    # 创建环境变量文件
    $envFile = Join-Path $serverPath ".env"
    if (-not (Test-Path $envFile)) {
        Write-Info "创建环境变量文件..."
        
        $envContent = @"
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_USER=campus_wall
DB_PASSWORD=CHANGE_THIS_PASSWORD
DB_NAME=campus_community
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=CHANGE_THIS_JWT_SECRET
"@
        
        $envContent | Out-File -FilePath $envFile -Encoding UTF8
        Write-Warning "请编辑 $envFile 文件，设置正确的数据库密码"
    }
    
    # 启动服务
    Write-Info "启动后端服务..."
    pm2 start ecosystem.config.js --env production
    pm2 save
    
    Write-Success "后端部署完成"
}

# 部署管理后台
function Deploy-Admin {
    Write-Info "部署管理后台..."
    
    $adminPath = Join-Path $ProjectPath "admin"
    
    if (-not (Test-Path $adminPath)) {
        Write-Error "未找到管理后台目录: $adminPath"
        return
    }
    
    Set-Location $adminPath
    
    # 安装依赖
    Write-Info "安装管理后台依赖..."
    npm install
    
    # 构建
    Write-Info "构建管理后台..."
    npm run build
    
    # 复制构建文件
    $distPath = Join-Path $adminPath "dist"
    $targetPath = Join-Path $ProjectPath "admin-dist"
    
    if (Test-Path $distPath) {
        if (Test-Path $targetPath) {
            Remove-Item $targetPath -Recurse -Force
        }
        Copy-Item $distPath $targetPath -Recurse
        Write-Success "管理后台构建完成"
    } else {
        Write-Error "构建失败，未找到dist目录"
    }
}

# 安装IIS (可选)
function Install-IIS {
    Write-Info "安装IIS..."
    
    $features = @(
        "IIS-WebServerRole",
        "IIS-WebServer",
        "IIS-CommonHttpFeatures",
        "IIS-HttpStaticContent",
        "IIS-DefaultDocument",
        "IIS-DirectoryBrowsing",
        "IIS-ASPNET45"
    )
    
    foreach ($feature in $features) {
        Enable-WindowsOptionalFeature -Online -FeatureName $feature -All
    }
    
    Write-Success "IIS安装完成"
}

# 配置IIS站点
function New-IISSite {
    Write-Info "配置IIS站点..."
    
    Import-Module WebAdministration
    
    $siteName = "CampusWallAdmin"
    $adminDistPath = Join-Path $ProjectPath "admin-dist"
    
    # 删除默认站点
    if (Get-Website -Name "Default Web Site" -ErrorAction SilentlyContinue) {
        Remove-Website -Name "Default Web Site"
    }
    
    # 创建新站点
    if (Get-Website -Name $siteName -ErrorAction SilentlyContinue) {
        Remove-Website -Name $siteName
    }
    
    New-Website -Name $siteName -Port 80 -PhysicalPath $adminDistPath
    
    Write-Success "IIS站点配置完成"
}

# 配置防火墙
function Set-FirewallRules {
    Write-Info "配置防火墙规则..."
    
    # 允许HTTP流量
    New-NetFirewallRule -DisplayName "Allow HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    
    # 允许HTTPS流量
    New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
    
    # 允许Node.js应用
    New-NetFirewallRule -DisplayName "Allow Node.js App" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -ErrorAction SilentlyContinue
    
    Write-Success "防火墙规则配置完成"
}

# 创建Windows服务
function New-WindowsService {
    Write-Info "创建Windows服务..."
    
    $serviceName = "CampusWallAPI"
    $serverPath = Join-Path $ProjectPath "server"
    $serviceScript = Join-Path $serverPath "service.js"
    
    # 创建服务脚本
    $serviceContent = @"
const Service = require('node-windows').Service;

const svc = new Service({
  name: '$serviceName',
  description: '校园墙API服务',
  script: require('path').join(__dirname, 'src', 'server.js'),
  env: {
    name: 'NODE_ENV',
    value: 'production'
  }
});

svc.on('install', function() {
  svc.start();
});

svc.install();
"@
    
    $serviceContent | Out-File -FilePath $serviceScript -Encoding UTF8
    
    # 安装node-windows
    Set-Location $serverPath
    npm install node-windows
    
    # 安装服务
    node $serviceScript
    
    Write-Success "Windows服务创建完成"
}

# 显示部署信息
function Show-DeploymentInfo {
    Write-Success "部署完成！"
    Write-Output ""
    Write-Output "访问地址:"
    Write-Output "  管理后台: http://$Domain"
    Write-Output "  API接口: http://$Domain`:3000"
    Write-Output ""
    Write-Output "重要提醒:"
    Write-Output "1. 请配置MySQL数据库和用户"
    Write-Output "2. 请编辑 $ProjectPath\server\.env 文件"
    Write-Output "3. 请运行数据库迁移: npm run seed-data"
    Write-Output ""
    Write-Output "常用命令:"
    Write-Output "  查看PM2状态: pm2 status"
    Write-Output "  查看日志: pm2 logs"
    Write-Output "  重启服务: pm2 restart campus-wall-api"
    Write-Output ""
}

# 主函数
function Main {
    Write-Info "开始部署校园墙项目 (Windows)..."
    
    try {
        Install-Chocolatey
        Install-Prerequisites
        Install-Databases
        New-ProjectDirectory
        
        if (Test-Path (Join-Path $ProjectPath "server")) {
            Deploy-Backend
        } else {
            Write-Warning "未找到后端代码，请先将项目文件复制到 $ProjectPath"
        }
        
        if (Test-Path (Join-Path $ProjectPath "admin")) {
            Deploy-Admin
            
            # 询问是否使用IIS
            $useIIS = Read-Host "是否使用IIS托管管理后台? (y/N)"
            if ($useIIS -eq "y" -or $useIIS -eq "Y") {
                Install-IIS
                New-IISSite
            }
        } else {
            Write-Warning "未找到管理后台代码"
        }
        
        Set-FirewallRules
        
        # 询问是否创建Windows服务
        $createService = Read-Host "是否将后端创建为Windows服务? (y/N)"
        if ($createService -eq "y" -or $createService -eq "Y") {
            New-WindowsService
        }
        
        Show-DeploymentInfo
        
    } catch {
        Write-Error "部署过程中发生错误: $($_.Exception.Message)"
        exit 1
    }
}

# 运行主函数
Main







