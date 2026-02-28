@echo off
echo.
echo ==========================================
echo   BetterMe - Automatic Setup
echo ==========================================
echo.

:: Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Install from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=1 delims=v" %%a in ('node -v') do set NODE_VER=%%a
echo [OK] Node.js found: %NODE_VER%

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python not found! Install 3.12 from https://python.org/downloads/
    echo.
    pause
    exit /b 1
)

:: Check Python version
for /f "tokens=2 delims= " %%a in ('python --version 2^>^&1') do set PY_VER=%%a
echo [OK] Python found: %PY_VER%

:: Warn if Python 3.14
echo %PY_VER% | findstr /B "3.14" >nul
if %errorlevel% equ 0 (
    echo.
    echo [WARNING] Python 3.14 detected - this may cause issues!
    echo [WARNING] Recommended: install Python 3.12 or 3.13 from https://python.org/downloads/
    echo.
    pause
)

:: Install Python dependencies
echo.
echo Installing Python dependencies...
cd "Better Me"
pip install -r api/requirements.txt --quiet
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Python dependencies failed to install!
    echo [FIX] Install Python 3.12 from https://python.org/downloads/
    echo        Then re-run this script.
    pause
    exit /b 1
)
echo [OK] Python dependencies installed

:: Install Node dependencies
echo.
echo Installing Node dependencies...
call npm install --legacy-peer-deps --silent
if %errorlevel% neq 0 (
    echo [ERROR] Node dependencies failed!
    pause
    exit /b 1
)
echo [OK] Node dependencies installed

echo.
echo ==========================================
echo   Setup complete! To start the app:
echo.
echo   cd "Better Me"
echo   npm run start
echo.
echo   Then open http://localhost:5173
echo.
echo   Login: admin@betterme.com / admin123
echo ==========================================
echo.
pause
