# 🌱 Garden Expense Tracker

A comprehensive expense tracking system designed for garden management, featuring a React dashboard, Express.js backend, MySQL database, and LINE Bot integration with AI-powered natural language processing.

![Version](https://img.shields.io/badge/version-2.0.0-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)
![MySQL](https://img.shields.io/badge/mysql-8.0+-orange.svg)

---

## ✨ Features

### 📊 Web Dashboard
- **Real-time Expense Tracking**: Monitor all garden-related expenses
- **Category Management**: Track 10 expense categories (fertilizer, seeds, water, labor, equipment, pesticides, transportation, electricity, maintenance, miscellaneous)
- **Data Visualization**: Charts and graphs for expense analysis
- **CSV Export**: Export data for Excel with UTF-8 encoding
- **Monthly Reports**: Automated summary generation

### 🤖 LINE Bot Integration
- **Natural Language Processing**: Powered by Claude AI (Anthropic)
- **Multi-line Transaction Support**: Add multiple expenses at once
- **Flex Message UI**: Beautiful card-based interface
- **Smart Parsing**: Automatically detects categories and calculates amounts
- **Interactive Buttons**: Edit and delete transactions with one tap
- **Monthly Dashboard**: PowerBI-style analytics with 3 carousel cards
  - Overview card (total, count, average)
  - Bar chart by category
  - Top 5 highest expenses

### 🔔 Automated Notifications
- **Daily Summary**: Automatic expense summary at 8:00 PM (Bangkok time)
- **Monthly Report**: First day of month at 9:00 AM
- **Real-time Alerts**: Instant notification when expenses are added via web

---

## 🏗️ Architecture

```
garden-expense-tracker/
├── frontend/               # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── App.js        # Main application
│   │   └── index.js      # Entry point
│   └── package.json
│
├── backend/               # Express.js server
│   ├── server.js         # Main server file
│   ├── database.js       # MySQL connection & schema
│   ├── line-bot.js       # LINE Bot logic with AI
│   ├── line-notify.js    # LINE Notify integration
│   └── package.json
│
└── README.md
```

---

## 🔧 Technologies

### Frontend
- **Framework**: React 18.2.0
- **UI Library**: Tailwind CSS
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL 8.0+ / MariaDB
- **ORM**: mysql2
- **Scheduler**: node-cron
- **AI Integration**: Anthropic Claude API
- **LINE SDK**: @line/bot-sdk

### Database Schema
- **transactions**: Expense/income records with quantity, unit, and notes
- **categories**: 10 predefined categories for classification
- **users**: LINE user profiles (optional)

---

## 📦 Installation

### Prerequisites
```bash
- Node.js >= 18.0.0
- npm >= 9.0.0
- MySQL >= 8.0 or MariaDB >= 10.5
```

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/garden-expense-tracker.git
cd garden-expense-tracker
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=garden_expenses

# LINE Bot (Optional)
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
LINE_CHANNEL_SECRET=your_channel_secret

# LINE Notify (Optional)
LINE_NOTIFY_TOKEN=your_notify_token

# Anthropic AI (Optional - for smart parsing)
ANTHROPIC_API_KEY=your_anthropic_api_key

# Server
PORT=3001
```

Start backend:
```bash
npm start
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm start
```

The app will open at `http://localhost:3000`

---

## 🤖 LINE Bot Setup

### 1. Create LINE Bot
1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create a new Messaging API channel
3. Get **Channel Access Token** and **Channel Secret**

### 2. Configure Webhook
```
Webhook URL: https://your-domain.com/webhook/line
```

Use ngrok for local testing:
```bash
ngrok http 3001
# Copy the HTTPS URL to LINE webhook settings
```

### 3. Enable Features
- Enable Webhooks
- Disable "Auto-reply messages"
- Disable "Greeting messages"

### 4. LINE Notify (Optional)
1. Go to [LINE Notify](https://notify-bot.line.me/)
2. Generate an access token
3. Add to `.env` file

---

## 💬 LINE Bot Commands

### Basic Commands
```
ปุ๋ย 800                          # Add expense: Fertilizer 800 baht
ซื้อปุ๋ย 15-15-15 7 กระสอบ กระสอบละ 500   # Detailed expense with formula
รายการ                            # Show recent transactions
สรุปวันนี้                         # Today's summary
dashboard                         # Monthly dashboard (3 cards)
help                              # Show all commands
```

### Multi-line Transactions
```
ปุ๋ย 7 กระสอบ กระสอบละ 500
ยา 2 ลิตร ลิตรละ 200
คนตัดหญ้า 600
```

### Edit & Delete
- **Edit**: Tap "✏️ แก้ไข" button on transaction card
- **Delete**: Tap "🗑️ ลบ" button (uses Postback - no need to type ID)

---

## 📊 Dashboard Preview

### Monthly Dashboard (3 Carousel Cards)

**Card 1: Overview**
```
┌─────────────────────────────┐
│ 📊 Dashboard                 │
│ Dec 2024                     │
├─────────────────────────────┤
│ 💰 Total Amount              │
│ ฿12,450.00                   │
│                              │
│ ┌───────┐  ┌───────┐        │
│ │ 📝 15  │  │ 📈฿830│        │
│ │ items  │  │ avg   │        │
│ └───────┘  └───────┘        │
└─────────────────────────────┘
```

**Card 2: Bar Chart**
```
┌─────────────────────────────┐
│ 📂 By Category               │
├─────────────────────────────┤
│ Fertilizer      ฿8,500       │
│ ████████████████░░░░ 68.2%  │
│                              │
│ Labor           ฿2,000       │
│ ████░░░░░░░░░░░░░ 16.1%     │
└─────────────────────────────┘
```

**Card 3: Top 5**
```
┌─────────────────────────────┐
│ 🏆 Top 5 Expenses            │
├─────────────────────────────┤
│ 🥇 Fertilizer 15-15-15       │
│    ฿3,500                    │
│                              │
│ 🥈 Labor - Cut grass         │
│    ฿2,000                    │
└─────────────────────────────┘
```

---

## 🎨 Flex Message Features

### Success Card
- ✅ Confirmation message with transaction details
- 💰 Amount displayed prominently
- 📂 Category badge
- 📦 Quantity & unit (if applicable)
- 💵 Unit price calculation
- 📋 Notes/formula display
- 📅 Date stamp

### Transaction Carousel
- Swipeable cards for up to 10 recent transactions
- Each card includes:
  - Category name
  - Amount in red
  - Description
  - Quantity & unit
  - Notes
  - Date
  - Edit & Delete buttons

---

## 🔐 Security Features

- Environment variables for sensitive data
- MySQL prepared statements (SQL injection protection)
- User ID validation for transactions
- Read-only mounted directories for skills
- Network egress restrictions

---

## 📈 API Endpoints

### Transactions
```
GET    /api/transactions              # Get all transactions
POST   /api/transactions              # Add new transaction
PUT    /api/transactions/:id          # Update transaction
DELETE /api/transactions/:id          # Delete transaction
```

### Summary
```
GET    /api/summary                   # Get overview statistics
GET    /api/stats/by-category         # Category breakdown
GET    /api/stats/monthly             # Monthly trends
```

### Export
```
GET    /api/export/csv                # Export to CSV (UTF-8 with BOM)
```

### LINE Integration
```
POST   /webhook/line                  # LINE Bot webhook
GET    /webhook/line                  # Webhook status check
POST   /api/line/daily-summary        # Trigger daily summary
POST   /api/line/monthly-summary      # Trigger monthly summary
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Anthropic Claude](https://www.anthropic.com/) - AI-powered natural language processing
- [LINE Messaging API](https://developers.line.biz/) - Chat platform integration
- [Recharts](https://recharts.org/) - Data visualization library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

## 🐛 Known Issues

- Dashboard command requires proper `handlePostback` integration in server.js
- Multi-line parsing works best with consistent formatting
- LINE Flex Messages have a 10-card limit for carousels

---

## 🗺️ Roadmap

- [ ] Receipt photo upload & OCR
- [ ] Recurring expense automation
- [ ] Multi-user authentication
- [ ] Mobile app (React Native)
- [ ] Budget planning & alerts
- [ ] Income tracking
- [ ] Multi-language support

---

## 💡 Tips

1. **For best AI parsing**: Use consistent format like "ปุ๋ย 7 กระสอบ กระสอบละ 500"
2. **Multi-line**: Separate each expense with a new line
3. **Categories**: System auto-detects from keywords (ปุ๋ย, ยา, คน, etc.)
4. **Dashboard**: Type "dashboard" or "สรุปเดือนนี้" to see monthly analytics

---

## ⚡ Quick Start (TL;DR)

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Edit with your credentials
npm start

# Frontend (new terminal)
cd frontend
npm install
npm start

# Access
# Web: http://localhost:3000
# API: http://localhost:3001
# LINE: Configure webhook to your ngrok URL
```

---

**Made with ❤️ for garden management**

---

## 👩🏻‍💻 Developed by

**Wichuon Charoensombat (PinturaW)**

📧 Reach me on [LinkedIn](https://www.linkedin.com/in/wichuon-charoensombat) or [GitHub](https://github.com/PinturaW)
