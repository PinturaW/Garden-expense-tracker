#!/bin/bash

echo "========================================"
echo "  บัญชีรายจ่ายสวน - Garden Expense Tracker"
echo "========================================"
echo ""

echo "กำลังเริ่มต้นระบบ..."
echo ""

# เช็คว่าติดตั้ง dependencies แล้วหรือยัง
if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  กำลังติดตั้ง Backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  กำลังติดตั้ง Frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo "[1/2] เริ่ม Backend Server..."
cd backend && npm start &
BACKEND_PID=$!

sleep 3

echo "[2/2] เริ่ม Frontend Server..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "  ระบบเริ่มทำงานแล้ว!"
echo "========================================"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:3001"
echo ""
echo "กด Ctrl+C เพื่อหยุดระบบ"
echo "========================================"

# รอให้ user กด Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
