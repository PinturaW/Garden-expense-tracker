# 🌱 ระบบบัญชีรายจ่ายสวน (Garden Expense Tracker)

ระบบบันทึกรายจ่ายสำหรับสวน พร้อม Export Excel และส่งแจ้งเตือนไลน์

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ ฟีเจอร์หลัก

- ✅ บันทึกรายจ่าย 10 หมวดหมู่
- ✅ กราฟวิเคราะห์ (Pie, Bar, Line Chart)
- ✅ Export ข้อมูลเป็น Excel/CSV
- ✅ ส่งแจ้งเตือนไปไลน์ (LINE Notify)
- ✅ จัดการผ่าน phpMyAdmin
- ✅ รองรับภาษาไทย 100%

## 📸 ภาพหน้าจอ

```
┌─────────────────────────────────────┐
│  🌱 บัญชีรายจ่ายสวน                │
│  ระบบบันทึกค่าใช้จ่ายของสวน        │
├─────────────────────────────────────┤
│                                      │
│  💸 รายจ่ายทั้งหมด                  │
│     ฿12,345.00                      │
│                                      │
│  [Export Excel] [ส่งไลน์] [เพิ่ม]  │
│                                      │
│  📝 รายการค่าใช้จ่าย | 📊 กราฟ      │
└─────────────────────────────────────┘
```

## 🚀 เริ่มต้นใช้งาน (Quick Start)

### ความต้องการ

- ✅ Node.js 18+ ([ดาวน์โหลด](https://nodejs.org/))
- ✅ XAMPP (MySQL + phpMyAdmin) ([ดาวน์โหลด](https://www.apachefriends.org/))

### ติดตั้งและรัน (4 ขั้นตอน)

```bash
# 1. เปิด XAMPP และ Start MySQL

# 2. Import ฐานข้อมูล
# เปิด http://localhost/phpmyadmin
# Import ไฟล์ backend/database.sql

# 3. ติดตั้ง Dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. รันระบบ
# Windows
start.bat

# Mac/Linux
./start.sh
```

เปิด Browser: **http://localhost:3000**

## 📂 โครงสร้างโปรเจค

```
garden-expense-tracker/
├── backend/                 # Backend API (Express + MySQL)
│   ├── server.js           # Main server file
│   ├── database.js         # Database connection
│   ├── line-notify.js      # LINE Notify service
│   ├── database.sql        # SQL สำหรับ phpMyAdmin
│   ├── .env                # ตั้งค่า (Database, LINE)
│   └── package.json
│
├── frontend/               # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx        # Main component
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── start.bat              # Windows startup script
├── start.sh               # Mac/Linux startup script
├── USER_GUIDE.md          # คู่มือใช้งานละเอียด
├── MYSQL_SETUP.md         # คู่มือติดตั้ง MySQL
├── LINE_QUICKSTART.md     # เริ่มใช้งาน LINE (5 นาที)
└── README.md              # ไฟล์นี้
```

## 🎯 การใช้งาน

### 1. เพิ่มรายจ่าย

```
1. คลิกปุ่ม "เพิ่มรายจ่าย"
2. เลือกหมวดหมู่ (ปุ๋ย, เมล็ดพันธุ์, ฯลฯ)
3. ใส่จำนวนเงิน
4. ระบุรายละเอียด (ไม่บังคับ)
5. คลิก "บันทึก"
```

### 2. Export Excel

```
1. กรองช่วงวันที่ที่ต้องการ
2. คลิกปุ่ม "Export Excel"
3. เปิดไฟล์ .csv ด้วย Excel
```

### 3. ส่งสรุปไปไลน์

```
1. ตั้งค่า LINE_NOTIFY_TOKEN (ดู LINE_QUICKSTART.md)
2. คลิกปุ่ม "ส่งสรุปไปไลน์"
3. เช็คไลน์ → จะได้รับสรุปรายจ่าย
```

## 🗄️ ฐานข้อมูล

### หมวดหมู่รายจ่าย (10 หมวด)

1. ปุ๋ย
2. เมล็ดพันธุ์
3. น้ำ
4. ค่าแรง
5. อุปกรณ์
6. ยากำจัดศัตรูพืช
7. ค่าขนส่ง
8. ค่าไฟฟ้า
9. ซ่อมบำรุง
10. รายจ่ายอื่นๆ

### Views & Procedures

**Views สำหรับวิเคราะห์:**
- `monthly_expenses` - สรุปรายเดือน
- `category_expenses` - สรุปตามหมวดหมู่
- `recent_expenses` - รายการล่าสุด
- `today_expenses` - รายจ่ายวันนี้

**Stored Procedures:**
```sql
CALL GetExpenseSummary('2024-12-01', '2024-12-31');
CALL GetTopExpenses(10);
CALL AddExpense(1, 800.00, 'ซื้อปุ๋ย', CURDATE());
```

## 💬 LINE Notify (ไม่บังคับ)

### ฟีเจอร์
- แจ้งเตือนเมื่อเพิ่มรายจ่าย
- ส่งสรุปรายจ่ายวันนี้
- Auto-send ทุกวัน 20:00 น.
- Auto-send สรุปเดือนวันที่ 1

### Setup (5 นาที)
ดูคู่มือที่ **LINE_QUICKSTART.md**

## 🔧 API Endpoints

### Transactions
- `GET /api/transactions` - ดึงรายการทั้งหมด
- `POST /api/transactions` - เพิ่มรายการใหม่
- `PUT /api/transactions/:id` - แก้ไขรายการ
- `DELETE /api/transactions/:id` - ลบรายการ

### Statistics
- `GET /api/summary` - สรุปยอดรวม
- `GET /api/stats/by-category` - สถิติตามหมวดหมู่
- `GET /api/stats/monthly` - สถิติรายเดือน

### Export
- `GET /api/export/csv` - ดาวน์โหลด CSV

### LINE
- `POST /api/line/daily-summary` - ส่งสรุปวันนี้
- `POST /api/line/monthly-summary` - ส่งสรุปเดือนนี้

## ⚙️ การตั้งค่า

### Database (.env)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=garden_expense
PORT=3001
```

### LINE Notify (.env)
```env
LINE_NOTIFY_TOKEN=your_token_here
```

Get token: https://notify-bot.line.me/

## 🛠️ เทคโนโลยีที่ใช้

### Backend
- Node.js + Express.js
- MySQL2 (Database)
- Axios (LINE Notify)
- Node-cron (Scheduled tasks)

### Frontend
- React 18
- Vite
- Recharts (Charts)
- Lucide React (Icons)
- Google Fonts (Kanit, Sarabun)

## 📖 เอกสารเพิ่มเติม

- **USER_GUIDE.md** - คู่มือใช้งานละเอียด
- **MYSQL_SETUP.md** - คู่มือติดตั้ง MySQL/phpMyAdmin
- **LINE_QUICKSTART.md** - เริ่มใช้งาน LINE Notify (5 นาที)
- **LINE_INTEGRATION.md** - คู่มือ LINE Notify ละเอียด
- **N8N_INTEGRATION.md** - เชื่อมกับ n8n workflow
- **PRODUCTION_ROADMAP.md** - แผนพัฒนาเป็นแอปจริงจัง
- **CHANGELOG.md** - บันทึกการเปลี่ยนแปลง

## ❓ แก้ไขปัญหา

### Backend ไม่ทำงาน
```bash
# ตรวจสอบ MySQL
# เปิด XAMPP → Start MySQL

# ติดตั้ง dependencies ใหม่
cd backend
npm install
npm start
```

### Frontend ไม่ทำงาน
```bash
# ติดตั้ง dependencies ใหม่
cd frontend
npm install
npm run dev
```

### LINE Notify ไม่ทำงาน
1. ตรวจสอบ `LINE_NOTIFY_TOKEN` ใน `.env`
2. Restart Backend
3. ลองกดปุ่ม "ส่งสรุปไปไลน์"

## 📝 License

MIT License - ใช้งานและแก้ไขได้อย่างอิสระ

## 🙏 ขอบคุณ

- React Team
- Express.js
- Recharts
- MySQL
- LINE Notify API
- Google Fonts

---

## 🚀 สิ่งที่จะมาในอนาคต

- [ ] Authentication (Login/Register)
- [ ] Multi-user support
- [ ] Upload รูปใบเสร็จ
- [ ] ค่าใช้จ่ายประจำ (Recurring)
- [ ] Budget planning
- [ ] Mobile app (React Native)
- [ ] Deploy to Cloud

ดูแผนละเอียดที่ **PRODUCTION_ROADMAP.md**

---

**Made with ❤️ for Garden Lovers 🌱**
