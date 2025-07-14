$body = @{
    nickname = "测试用户"
    username = "testuser"
    password = "123456"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:12346/api/auth/register" -Method Post -Body $body -ContentType "application/json"
$response | ConvertTo-Json -Depth 4 