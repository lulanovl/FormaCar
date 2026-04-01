пше @echo off
title FormaCar — Dev Servers

echo Starting FormaCar...
echo.

:: Kill anything on ports 3001 and 5173
echo Clearing ports...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":3001 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr ":5173 "') do taskkill /PID %%a /F >nul 2>&1
timeout /t 1 /nobreak > nul

:: Start backend
echo Starting backend...
start "FormaCar Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak > nul

:: Start frontend
echo Starting frontend...
start "FormaCar Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo  Backend:  http://localhost:3001
echo  Frontend: http://localhost:5173
echo.
echo Press any key to open in browser...
pause > nul
start http://localhost:5173
