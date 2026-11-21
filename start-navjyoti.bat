
@echo off
title NavJyoti Launcher

cd /d "%~dp0"

echo Starting NavJyoti Backend...
start "NavJyoti Backend" cmd /k "cd backend && set NAVJYOTI_ENV_FILE=.env.neon && python -m uvicorn main:app --reload"

echo Starting NavJyoti Frontend...
start "NavJyoti Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo NavJyoti servers are starting!
echo Backend: http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
pause
