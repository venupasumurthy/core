@echo off
echo ======================================================================
echo    HackFusion 2026 - Multi-Robot Task Negotiation Engine
echo    Starting FastAPI Backend and Next.js Operations Dashboard...
echo ======================================================================

echo.
echo [1/2] Launching FastAPI Backend on port 8000...
start "HackFusion Backend (:8000)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [2/2] Launching Next.js Dashboard on port 3000...
start "HackFusion Frontend (:3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo ======================================================================
echo    Systems are starting up:
echo    - Operations Dashboard: http://localhost:3000/dashboard
echo    - Backend API & WS:    http://localhost:8000
echo    - API Docs:            http://localhost:8000/docs
echo ======================================================================
echo.
pause
