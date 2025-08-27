@echo off
chcp 65001 >nul
title Project TT - Server Launcher

echo.
echo ========================================
echo    🚀 Project TT Server Launcher
echo ========================================
echo.

:: Check Node.js installation
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed.
    echo    Please download Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check npm installation
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm is not installed.
    echo    Please reinstall Node.js.
    pause
    exit /b 1
)

:: Check dependencies installation
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Failed to install dependencies.
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed successfully
)

:: Check environment variables file
if not exist ".env" (
    echo ⚠️  .env file not found. Copying from env.example...
    copy "env.example" ".env" >nul
    if %errorlevel% neq 0 (
        echo ❌ Failed to create .env file.
        pause
        exit /b 1
    )
    echo ✅ .env file created successfully
    echo    Please edit .env file with your required settings.
    echo.
)

echo.
echo 📋 Available Servers:
echo    1. 🚀 Start All Servers (API + Webapp + MCP)
echo    2. 🔌 API Server Only (Port 3001)
echo    3. 🌐 Webapp Server Only (Port 3000)
echo    4. 🤖 MCP Server Only
echo    5. 📊 Monitoring Server
echo    6. 🧹 Cleanup & Rollback
echo    0. ❌ Exit
echo.

:menu
set /p choice="Please select (0-6): "

if "%choice%"=="1" goto start_all
if "%choice%"=="2" goto start_api
if "%choice%"=="3" goto start_webapp
if "%choice%"=="4" goto start_mcp
if "%choice%"=="5" goto start_monitor
if "%choice%"=="6" goto cleanup
if "%choice%"=="0" goto exit
echo ❌ Invalid selection. Please try again.
goto menu

:start_all
echo.
echo 🚀 Starting all servers...
echo.
echo 📍 Core API Server: http://localhost:3001
echo 📍 Webapp Server: http://localhost:3000
echo 📍 MCP Server: Port 5058
echo.

:: Start Core API server (포트 3001) in new terminal
echo 🔌 Starting Core API Server (Port 3001)...
start "Project TT - Core API Server (Port 3001)" cmd /k "cd /d %cd% && echo Starting Core API Server on port 3001... && node adapters/http/server.js"

:: Wait for API server to start
echo ⏳ Waiting for Core API Server to start...
timeout /t 5 /nobreak >nul

:: Start webapp server (포트 3000) in new terminal
echo 🌐 Starting Webapp Server (Port 3000)...
start "Project TT - Webapp Server (Port 3000)" cmd /k "cd /d %cd% && echo Starting Webapp Server on port 3000... && node web_server.js"

:: Wait for webapp server to start
echo ⏳ Waiting for Webapp Server to start...
timeout /t 3 /nobreak >nul

:: Start MCP server in new terminal
echo 🤖 Starting MCP Server...
start "Project TT - MCP Server" cmd /k "cd /d %cd% && echo Starting MCP Server... && node adapters/mcp/mcp_server.js"

echo.
echo ✅ All servers have been started!
echo.
echo 🌐 Open your browser and go to http://localhost:3000
echo 📊 Core API Status: http://localhost:3001/healthz
echo 📝 Reports API: http://localhost:3001/v1/reports
echo.
pause
goto menu

:start_api
echo.
echo 🔌 Starting Core API server (포트 3001)...
echo 📍 Port: 3001
echo 📍 Health Check: http://localhost:3001/healthz
echo 📍 Reports API: http://localhost:3001/v1/reports
echo 📍 Projects API: http://localhost:3001/v1/projects
echo.

start "Project TT - Core API Server (Port 3001)" cmd /k "cd /d %cd% && echo Starting Core API Server on port 3001... && node adapters/http/server.js"
echo ✅ Core API server started on port 3001!
echo 📊 Check status at: http://localhost:3001/healthz
pause
goto menu

:start_webapp
echo.
echo 🌐 Starting Webapp server (포트 3000)...
echo 📍 Port: 3000
echo 📍 Access: http://localhost:3000
echo 📍 Reports Form: http://localhost:3000/reports/new
echo 📍 Projects: http://localhost:3000/projects
echo.

start "Project TT - Webapp Server (Port 3000)" cmd /k "cd /d %cd% && echo Starting Webapp Server on port 3000... && node web_server.js"
echo ✅ Webapp server started on port 3000!
echo 🌐 Access at: http://localhost:3000
pause
goto menu

:start_mcp
echo.
echo 🤖 Starting MCP server...
echo 📍 Port: 5058
echo.

start "Project TT - MCP Server" cmd /k "cd /d %cd% && npm run mcp"
echo ✅ MCP server started!
pause
goto menu

:start_monitor
echo.
echo 📊 Starting monitoring server...
echo.

start "Project TT - Monitoring" cmd /k "cd /d %cd% && npm run monitor"
echo ✅ Monitoring server started!
pause
goto menu

:cleanup
echo.
echo 🧹 Cleanup & Rollback Options:
echo    1. 🗑️  Clear Cache
echo    2. 📊 Usage Monitoring
echo    3. 🔄 Rollback
echo    4. 📝 Clear Logs
echo    0. ↩️  Back to Main Menu
echo.

set /p cleanup_choice="Please select (0-4): "

if "%cleanup_choice%"=="1" goto clear_cache
if "%cleanup_choice%"=="2" goto usage_monitor
if "%cleanup_choice%"=="3" goto rollback
if "%cleanup_choice%"=="4" goto clear_logs
if "%cleanup_choice%"=="0" goto menu
echo ❌ Invalid selection.
goto cleanup

:clear_cache
echo.
echo 🗑️  Clearing cache...
npm run cleanup:deprecated
echo ✅ Cache cleared successfully!
pause
goto cleanup

:usage_monitor
echo.
echo 📊 Monitoring usage...
npm run monitor:usage
pause
goto cleanup

:rollback
echo.
echo 🔄 Executing rollback...
npm run rollback:code
echo ✅ Rollback completed!
pause
goto cleanup

:clear_logs
echo.
echo 📝 Clearing logs...
if exist "logs" (
    del /q "logs\*.log" >nul 2>nul
    echo ✅ Logs cleared successfully!
) else (
    echo ℹ️  Logs folder not found.
)
pause
goto cleanup

:exit
echo.
echo 👋 Exiting Project TT...
echo.
timeout /t 2 /nobreak >nul
exit /b 0
