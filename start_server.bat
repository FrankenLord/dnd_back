@echo off
chcp 65001 > nul
cd /d "%~dp0"

echo ========================================
echo DCC Initiative local server
echo ========================================
echo.
echo Server URL on this computer:
echo   http://127.0.0.1:8000
echo.
echo For phones in the same Wi-Fi, find your IPv4 below and open:
echo   http://YOUR_IPV4:8000
echo.
ipconfig | findstr /C:"IPv4"
echo.
echo REST API logs will appear in this window.
echo Stop server: Ctrl+C
echo.

if exist "C:\Users\Master\AppData\Local\Python\pythoncore-3.14-64\python.exe" (
    "C:\Users\Master\AppData\Local\Python\pythoncore-3.14-64\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
) else (
    python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
)

echo.
echo Server stopped. Press any key to close this window.
pause > nul
