@echo off
echo Starting Study Planner...
echo.

start "Backend" cmd /k "cd /d "%~dp0backend" && node server.js"

timeout /t 2 /nobreak >nul

start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

start http://localhost:5173

echo.
echo Study Planner is running!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window (servers keep running)...
pause >nul
