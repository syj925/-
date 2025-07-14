# 图片重命名脚本
# 根据映射关系复制并重命名图片文件

# 映射关系定义
$imageMap = @{
    # static/icons目录
    "关注.png" = "follow.png"
    "分享.png" = "share.png"
    "失物招领.png" = "lost-found.png"
    "学习交流.png" = "study-exchange.png"
    "我的帖子.png" = "my-posts.png"
    "招聘信息.png" = "recruitment.png"
    "更多.png" = "more.png"
    "校园活动.png" = "campus-activity.png"
    "粉丝.png" = "fans.png"
    "获赞.png" = "likes.png"
    "评论小.png" = "comment-small.png"
    "我的页_我的收藏.png" = "my-favorites.png"
    "设置.png" = "settings.png"

    # src/static/icons目录
    "icon_左退出.png" = "icon_back.png"
    "向下.png" = "arrow-down.png"
    "密码.png" = "password.png"
    "收藏.png" = "favorite.png"
    "账号.png" = "account.png"

    # src/static/images目录
    "_意见反馈.png" = "feedback.png"
    "关于我们.png" = "about-us.png"
    "清除缓存.png" = "clear-cache.png"
    "黑名单管理.png" = "blacklist-manage.png"
    "账号安全.png" = "account-security.png"
    "隐私设置.png" = "privacy-settings.png"
    
    # 其他可能在代码中引用的中文图片
    "系统通知.png" = "system-notification.png"
}

# 处理 static 目录下的图片
Write-Host "开始处理 static 目录下的图片..."
$staticImages = Get-ChildItem -Recurse -Path "..\static" -Filter "*.png" | Where-Object { $_.Name -match '[^\x00-\x7F]' }

foreach ($image in $staticImages) {
    $chineseName = $image.Name
    if ($imageMap.ContainsKey($chineseName)) {
        $englishName = $imageMap[$chineseName]
        $sourceDir = $image.DirectoryName
        $targetPath = Join-Path -Path $sourceDir -ChildPath $englishName
        
        Write-Host "复制文件: $($image.FullName) -> $targetPath"
        Copy-Item -Path $image.FullName -Destination $targetPath -Force
    }
    else {
        Write-Host "警告: $chineseName 没有对应的英文名称映射"
    }
}

# 处理 src/static 目录下的图片
Write-Host "`n开始处理 src/static 目录下的图片..."
$srcStaticImages = Get-ChildItem -Recurse -Path "..\src\static" -Filter "*.png" | Where-Object { $_.Name -match '[^\x00-\x7F]' }

foreach ($image in $srcStaticImages) {
    $chineseName = $image.Name
    if ($imageMap.ContainsKey($chineseName)) {
        $englishName = $imageMap[$chineseName]
        $sourceDir = $image.DirectoryName
        $targetPath = Join-Path -Path $sourceDir -ChildPath $englishName
        
        Write-Host "复制文件: $($image.FullName) -> $targetPath"
        Copy-Item -Path $image.FullName -Destination $targetPath -Force
    }
    else {
        Write-Host "警告: $chineseName 没有对应的英文名称映射"
    }
}

Write-Host "`n图片复制重命名完成!" 