#!/usr/bin/env pwsh

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Inventory Liquidity AI - 开发服务器启动器" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# 检查并杀死占用的进程
Write-Host "[检查] 检查端口占用情况..." -ForegroundColor Yellow

$port3001 = netstat -ano | Select-String ":3001" | Select-String "LISTENING"
if ($port3001) {
    Write-Host "[警告] 端口 3001 已被占用，正在杀死原进程..." -ForegroundColor Yellow
    $pid = ($port3001 -split '\s+')[-1]
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Write-Host "[完成] 进程已杀死" -ForegroundColor Green
    Start-Sleep -Seconds 1
}

Write-Host ""
Write-Host "[启动] 正在启动后端 API 服务器 (http://localhost:3001)..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "dev-server.js" -NoNewWindow

Write-Host "[启动] 等待后端启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[启动] 正在启动前端开发服务器 (http://localhost:5173 或 5174)..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "node_modules/vite/bin/vite.js" -NoNewWindow

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "✓ 两个服务器已启动！" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  后端 API:   http://localhost:3001" -ForegroundColor Cyan
Write-Host "  前端应用:   http://localhost:5173 (或 5174)" -ForegroundColor Cyan
Write-Host ""
Write-Host "  默认账户:   admin / 123456" -ForegroundColor Yellow
Write-Host ""
Write-Host "  提示: 在终端中按 Ctrl+C 停止服务器" -ForegroundColor Gray
Write-Host ""
