# 🌱 Garden Expense Tracker

A comprehensive expense tracking system for garden management with Excel export and LINE integration.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- ✅ Track expenses across 10 categories
- ✅ Beautiful charts (Pie, Bar, Line)
- ✅ Export to Excel/CSV
- ✅ LINE Notify integration (auto notifications)
- ✅ LINE Bot integration (chat to record expenses)
- ✅ phpMyAdmin database management
- ✅ Thai language support
- ✅ 100% Free & Open Source

## 📸 Screenshots

```
┌─────────────────────────────────────┐
│  🌱 Garden Expense Tracker          │
│  Manage your garden expenses        │
├─────────────────────────────────────┤
│                                      │
│  💸 Total Expenses                  │
│     ฿12,345.00                      │
│                                      │
│  [Export] [LINE Notify] [Add]       │
│                                      │
│  📝 Transactions | 📊 Charts         │
└─────────────────────────────────────┘
```

## 🚀 Quick Start

### Requirements

- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ XAMPP (MySQL + phpMyAdmin) ([Download](https://www.apachefriends.org/))

### Installation (4 Steps)

```bash
# 1. Start XAMPP MySQL

# 2. Import Database
# Open http://localhost/phpmyadmin
# Import file: backend/database.sql

# 3. Install Dependencies
cd backend && npm install
cd ../frontend && npm install

# 4. Run
# Windows
start.bat

# Mac/Linux
./start.sh
```

Open Browser: **http://localhost:3000**

## 📂 Project Structure

```
garden-expense-tracker/
├── backend/                 # Express API + MySQL
│   ├── server.js           # Main server file
│   ├── database.js         # Database connection
│   ├── line-notify.js      # LINE Notify service
│   ├── line-bot.js         # LINE Bot service
│   ├── database.sql        # SQL for phpMyAdmin
│   └── .env                # Configuration
│
├── frontend/               # React + Vite
│   ├── src/
│   │   ├── App.jsx        # Main component
│   │   └── index.css      # Styles
│   └── package.json
│
└── Documentation (10 files)
    ├── README.md              # This file
    ├── README_EN.md          # English version
    ├── QUICK_SUMMARY.md      # Quick overview
    ├── USER_GUIDE.md         # Complete guide (Thai)
    ├── LINE_QUICKSTART.md    # LINE Notify setup (5 min)
    ├── LINE_BOT_GUIDE.md     # LINE Bot setup (10 min)
    └── More...
```

## 🎯 Usage

### 1. Add Expense

```
1. Click "Add Expense" button
2. Select category (Fertilizer, Seeds, etc.)
3. Enter amount
4. Add description (optional)
5. Click "Save"
```

### 2. Export to Excel

```
1. Select date range
2. Click "Export Excel"
3. Open CSV file in Excel
```

### 3. LINE Integration (Optional)

**Option 1: LINE Notify (Auto notifications)**
- Get notified when expenses are added
- Send daily/monthly summaries
- Setup time: 5 minutes
- Read: LINE_QUICKSTART.md

**Option 2: LINE Bot (Chat to record)**
- Type in LINE: "Buy fertilizer 800"
- Bot replies: "✅ Recorded! Fertilizer: 800 THB"
- Setup time: 10 minutes
- Read: LINE_BOT_GUIDE.md

## 🗄️ Database

### Expense Categories (10 Categories)

1. Fertilizer (ปุ๋ย)
2. Seeds (เมล็ดพันธุ์)
3. Water (น้ำ)
4. Labor (ค่าแรง)
5. Equipment (อุปกรณ์)
6. Pesticides (ยากำจัดศัตรูพืช)
7. Transportation (ค่าขนส่ง)
8. Electricity (ค่าไฟฟ้า)
9. Maintenance (ซ่อมบำรุง)
10. Miscellaneous (รายจ่ายอื่นๆ)

### Database Views

```sql
-- Monthly summary
SELECT * FROM monthly_expenses;

-- Summary by category
SELECT * FROM category_expenses;

-- Recent transactions
SELECT * FROM recent_expenses;

-- Today's expenses
SELECT * FROM today_expenses;
```

### Stored Procedures

```sql
-- Get summary for date range
CALL GetExpenseSummary('2024-12-01', '2024-12-31');

-- Get top 10 expenses
CALL GetTopExpenses(10);

-- Add new expense
CALL AddExpense(1, 800.00, 'Buy fertilizer', CURDATE());
```

## 🔧 API Endpoints

### Transactions
- `GET /api/transactions` - List all transactions
- `POST /api/transactions` - Add new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Statistics
- `GET /api/summary` - Get summary
- `GET /api/stats/by-category` - Stats by category
- `GET /api/stats/monthly` - Monthly stats

### Export
- `GET /api/export/csv` - Download CSV

### LINE Integration
- `POST /api/line/daily-summary` - Send today's summary
- `POST /api/line/monthly-summary` - Send monthly summary
- `POST /webhook/line` - LINE Bot webhook

## ⚙️ Configuration

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

### LINE Bot (.env)
```env
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
LINE_CHANNEL_SECRET=your_secret
```
Get from: https://developers.line.biz/console/

## 🛠️ Tech Stack

### Backend
- Node.js + Express.js
- MySQL2 (Database)
- Axios (HTTP client)
- Node-cron (Scheduled tasks)
- @line/bot-sdk (LINE Bot)

### Frontend
- React 18
- Vite
- Recharts (Charts library)
- Lucide React (Icons)

## 📖 Documentation

- **QUICK_SUMMARY.md** - Quick overview (Thai)
- **USER_GUIDE.md** - Complete user guide (Thai)
- **LINE_QUICKSTART.md** - LINE Notify setup (Thai)
- **LINE_BOT_GUIDE.md** - LINE Bot setup (Thai)
- **MYSQL_SETUP.md** - MySQL setup guide (Thai)
- **PRODUCTION_ROADMAP.md** - Production deployment plan (Thai)

## 💰 Pricing

### Free (100%)
- Web application: Free
- LINE Notify: Free
- LINE Bot: Free (500 messages/month)
- MySQL (XAMPP): Free
- Hosting (Local): Free

### Cloud Deployment (Optional)
- Free Tier: 0 THB
- Professional: 300-1,000 THB/month (~$10-30)
- Enterprise: 3,000+ THB/month (~$100+)

See PRODUCTION_ROADMAP.md for details

## ❓ Troubleshooting

### Backend not working
```bash
cd backend
npm install
npm start
```

### Frontend not working
```bash
cd frontend
npm install
npm run dev
```

### LINE Notify not working
1. Check `LINE_NOTIFY_TOKEN` in `.env`
2. Restart Backend
3. Test by clicking "Send to LINE" button

### LINE Bot not working
1. Check tokens in `.env`
2. Verify webhook URL in LINE Console
3. Check ngrok is running
4. Check Backend logs

## 🚀 Future Plans

- [ ] User authentication
- [ ] Multi-user support
- [ ] Receipt photo upload
- [ ] Recurring expenses
- [ ] Budget planning
- [ ] Mobile app (React Native)
- [ ] Cloud deployment

See PRODUCTION_ROADMAP.md for detailed plan

## 📝 License

MIT License - Free to use and modify

## 🙏 Credits

- React Team
- Express.js
- Recharts
- MySQL
- LINE Notify API
- LINE Messaging API

---

## 🌐 Language Support

- 🇹🇭 Thai (Primary)
- 🇬🇧 English (This file)

For Thai documentation, see:
- README.md (Thai)
- USER_GUIDE.md (Thai)
- All other .md files (Thai)

---

**Made with ❤️ for Garden Lovers 🌱**

**Version**: 2.0.0  
**Last Updated**: 2024-12-07  
**License**: MIT
