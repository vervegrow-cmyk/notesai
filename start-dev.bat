@echo off
setlocal enabledelayedexpansion

echo.
echo ====================================================
echo   Inventory Liquidity AI - 开发服务器启动器
echo ====================================================
echo.

REM 检查端口是否被占用
echo [检查] 检查端口占用情况...
netstat -ano | findstr :3001 >nul 2>&1
if !errorlevel! equ 0 (
    echo [警告] 端口 3001 已被占用，正在杀死原进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
        echo [完成] 进程已杀死
    )
)

netstat -ano | findstr :5173 >nul 2>&1
if !errorlevel! equ 0 (
    echo [警告] 端口 5173 已被占用，前端将使用其他端口
)

echo.
echo [启动] 正在启动后端 API 服务器 (http://localhost:3001)...
start "Backend API Server" node dev-server.js

echo [启动] 等待后端启动...
timeout /t 2 /nobreak

echo.
echo [启动] 正在启动前端开发服务器 (http://localhost:5173 或 5174)...
start "Frontend Vite Server" node node_modules/vite/bin/vite.js

echo.
echo ====================================================
echo   ✓ 两个服务器已启动！
echo ====================================================
echo.
echo   后端 API:   http://localhost:3001
echo   前端应用:   http://localhost:5173 (或 5174)
echo.
echo   默认账户:   admin / 123456
echo.
echo   按 Ctrl+C 停止服务器
echo.
