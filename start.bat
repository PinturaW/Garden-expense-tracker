@echo off
echo ========================================
echo   บัญชีรายจ่ายสวน - Garden Expense Tracker
echo ========================================
echo.

echo กำลังเริ่มต้นระบบ...
echo.

echo [1/2] เริ่ม Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak > nul

echo [2/2] เริ่ม Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   ระบบเริ่มทำงานแล้ว!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3001
echo.
echo กด Ctrl+C ใน Terminal เพื่อหยุดระบบ
echo ========================================
