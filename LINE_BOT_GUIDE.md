# 🤖 LINE Bot - พิมพ์บันทึกรายจ่ายผ่านไลน์

## 🎯 ฟีเจอร์ที่จะได้

### ✅ พิมพ์ในไลน์ → บันทึกอัตโนมัติ
```
คุณพิมพ์: "ซื้อปุ๋ย 800"
Bot ตอบ: "✅ บันทึกแล้ว!
         💰 ปุ๋ย: 800 บาท
         📅 วันที่: 7 ธ.ค. 2567"
```

### ✅ ถามสรุป
```
คุณพิมพ์: "สรุปวันนี้"
Bot ตอบ: "📊 สรุปรายจ่ายวันนี้
         💸 ยอดรวม: 2,350 บาท
         📝 จำนวน: 5 รายการ"
```

### ✅ ถ่ายรูปใบเสร็จ (ในอนาคต)
```
ส่งรูป → OCR อ่านตัวเลข → บันทึกอัตโนมัติ
```

---

## 🚀 Setup LINE Bot (10 นาที)

### ขั้นตอนที่ 1: สร้าง LINE Bot

1. **ไปที่ LINE Developers Console**
   - เปิด: https://developers.line.biz/console/
   - ล็อกอินด้วยไลน์

2. **สร้าง Provider**
   - คลิก **"Create"** → **"Create a new provider"**
   - Provider name: **"Garden Expense Bot"**
   - คลิก **"Create"**

3. **สร้าง Messaging API Channel**
   - คลิก **"Create a Messaging API channel"**
   - กรอกข้อมูล:
     - **Channel name**: "บอทบัญชีรายจ่ายสวน"
     - **Channel description**: "บันทึกรายจ่ายผ่านไลน์"
     - **Category**: Finance
     - **Subcategory**: Accounting
   - ยอมรับ Terms
   - คลิก **"Create"**

4. **ตั้งค่า Channel**
   - ไปที่ Tab **"Messaging API"**
   - เลื่อนลงหา **"Channel access token"**
   - คลิก **"Issue"** → คัดลอก Token
   - เลื่อนลงหา **"Channel secret"**
   - คลิก **"Show"** → คัดลอก Secret

5. **ตั้งค่า Webhook**
   - ที่ **"Webhook URL"**: ใส่ `https://your-domain.com/webhook/line`
   - (ใช้ ngrok ชั่วคราวก็ได้: `https://xxxx.ngrok.io/webhook/line`)
   - เปิด **"Use webhook"**: ON
   - ปิด **"Auto-reply messages"**: OFF
   - ปิด **"Greeting messages"**: OFF

6. **เพิ่ม Bot เป็นเพื่อน**
   - สแกน QR Code ในหน้า Console
   - หรือค้นหาด้วย **Bot Basic ID**
   - กด **"เพิ่มเพื่อน"**

---

## 💻 Setup Backend

### ขั้นตอนที่ 1: ติดตั้ง Package

```bash
cd backend
npm install @line/bot-sdk
```

### ขั้นตอนที่ 2: เพิ่ม Config ใน .env

เปิดไฟล์ `backend/.env` และเพิ่ม:

```env
# LINE Bot (Messaging API)
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here

# LINE Notify (เดิม - เก็บไว้ได้)
LINE_NOTIFY_TOKEN=your_notify_token_here
```

---

## 📝 โค้ด Backend

### ไฟล์ที่ 1: line-bot.js (ใหม่)

สร้างไฟล์ `backend/line-bot.js`:

```javascript
const line = require('@line/bot-sdk');
const { pool } = require('./database');

// LINE Bot Configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

const client = new line.Client(config);

/**
 * Parse ข้อความเป็นรายจ่าย
 * รูปแบบ: "ซื้อปุ๋ย 800" หรือ "ปุ๋ย 800"
 */
const parseExpenseMessage = (text) => {
  // ลบคำว่า "ซื้อ" ถ้ามี
  const cleaned = text.replace(/^ซื้อ\s*/, '').trim();
  
  // ตรวจสอบรูปแบบ: "คำอธิบาย จำนวนเงิน"
  const regex = /^(.+?)\s+(\d+(?:\.\d{1,2})?)(?:\s*บาท)?$/;
  const match = cleaned.match(regex);
  
  if (!match) {
    return null;
  }
  
  const description = match[1].trim();
  const amount = parseFloat(match[2]);
  
  // หาหมวดหมู่จาก keyword
  const categoryMap = {
    'ปุ๋ย': 1,
    'เมล็ด': 2,
    'พันธุ์': 2,
    'น้ำ': 3,
    'แรง': 4,
    'จ้าง': 4,
    'อุปกรณ์': 5,
    'เครื่องมือ': 5,
    'ยา': 6,
    'พ่น': 6,
    'ขนส่ง': 7,
    'ส่ง': 7,
    'ไฟ': 8,
    'ไฟฟ้า': 8,
    'ซ่อม': 9,
    'บำรุง': 9
  };
  
  let categoryId = 10; // default: อื่นๆ
  for (const [keyword, id] of Object.entries(categoryMap)) {
    if (description.includes(keyword)) {
      categoryId = id;
      break;
    }
  }
  
  return {
    category_id: categoryId,
    amount: amount,
    description: description,
    date: new Date().toISOString().split('T')[0]
  };
};

/**
 * บันทึกรายจ่าย
 */
const saveExpense = async (expenseData) => {
  try {
    const query = `
      INSERT INTO transactions (type, category_id, amount, description, date)
      VALUES ('expense', ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      expenseData.category_id,
      expenseData.amount,
      expenseData.description,
      expenseData.date
    ]);
    
    // ดึงข้อมูลพร้อมชื่อหมวดหมู่
    const [transaction] = await pool.query(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [result.insertId]);
    
    return transaction[0];
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
};

/**
 * ดึงสรุปรายจ่ายวันนี้
 */
const getTodaySummary = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [summary] = await pool.query(`
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE type = 'expense' AND date = ?
    `, [today]);
    
    const [categories] = await pool.query(`
      SELECT 
        c.name,
        SUM(t.amount) as total
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense' AND t.date = ?
      GROUP BY c.id, c.name
      ORDER BY total DESC
      LIMIT 5
    `, [today]);
    
    return {
      total: summary[0].total || 0,
      count: summary[0].count || 0,
      categories: categories
    };
  } catch (error) {
    console.error('Error getting summary:', error);
    throw error;
  }
};

/**
 * จัดรูปแบบข้อความตอบกลับ
 */
const formatSuccessMessage = (transaction) => {
  const amount = parseFloat(transaction.amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const date = new Date(transaction.date).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  return `✅ บันทึกแล้ว!
━━━━━━━━━━━━━━
💰 ${transaction.category_name || 'อื่นๆ'}: ${amount} บาท
📝 ${transaction.description}
📅 ${date}
━━━━━━━━━━━━━━`;
};

const formatSummaryMessage = (data) => {
  const total = parseFloat(data.total).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const today = new Date().toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  let message = `📊 สรุปรายจ่ายวันนี้
${today}
━━━━━━━━━━━━━━
💸 ยอดรวม: ${total} บาท
📝 จำนวน: ${data.count} รายการ`;
  
  if (data.categories.length > 0) {
    message += '\n━━━━━━━━━━━━━━\n\n📂 Top 5 หมวดหมู่:';
    data.categories.forEach(cat => {
      const catAmount = parseFloat(cat.total).toLocaleString('th-TH', {
        minimumFractionDigits: 2
      });
      message += `\n• ${cat.name}: ${catAmount} บาท`;
    });
  }
  
  message += '\n━━━━━━━━━━━━━━';
  return message;
};

const formatHelpMessage = () => {
  return `🌱 บอทบัญชีรายจ่ายสวน

📝 วิธีใช้งาน:

1️⃣ บันทึกรายจ่าย:
   "ซื้อปุ๋ย 800"
   "เมล็ดพันธุ์ 450"
   "ค่าแรง 2000"

2️⃣ ดูสรุป:
   "สรุปวันนี้"
   "สรุป"

3️⃣ ช่วยเหลือ:
   "help"
   "ช่วย"

━━━━━━━━━━━━━━
📂 หมวดหมู่ที่รองรับ:
• ปุ๋ย
• เมล็ดพันธุ์
• น้ำ
• ค่าแรง
• อุปกรณ์
• ยากำจัดศัตรูพืช
• ค่าขนส่ง
• ค่าไฟฟ้า
• ซ่อมบำรุง
• อื่นๆ`;
};

/**
 * Handle ข้อความจาก LINE
 */
const handleMessage = async (event) => {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }
  
  const text = event.message.text.trim();
  const userId = event.source.userId;
  
  try {
    // คำสั่งพิเศษ
    if (['สรุปวันนี้', 'สรุป', 'summary'].includes(text.toLowerCase())) {
      const summary = await getTodaySummary();
      if (summary.count === 0) {
        return { type: 'text', text: 'ยังไม่มีรายจ่ายวันนี้' };
      }
      return { type: 'text', text: formatSummaryMessage(summary) };
    }
    
    if (['help', 'ช่วย', 'ช่วยเหลือ', 'วิธีใช้'].includes(text.toLowerCase())) {
      return { type: 'text', text: formatHelpMessage() };
    }
    
    // พยายาม Parse เป็นรายจ่าย
    const expenseData = parseExpenseMessage(text);
    
    if (!expenseData) {
      return {
        type: 'text',
        text: '❌ รูปแบบไม่ถูกต้อง\n\nกรุณาพิมพ์:\n"ซื้อปุ๋ย 800"\nหรือพิมพ์ "help" ดูวิธีใช้'
      };
    }
    
    // บันทึกรายจ่าย
    const transaction = await saveExpense(expenseData);
    return { type: 'text', text: formatSuccessMessage(transaction) };
    
  } catch (error) {
    console.error('Error handling message:', error);
    return {
      type: 'text',
      text: '❌ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    };
  }
};

module.exports = {
  config,
  client,
  handleMessage,
  parseExpenseMessage,
  saveExpense,
  getTodaySummary
};
```

---

### ไฟล์ที่ 2: แก้ไข server.js

เพิ่มโค้ดนี้ใน `backend/server.js`:

```javascript
// เพิ่มที่บรรทัดบนสุด (หลังจาก require อื่นๆ)
const line = require('@line/bot-sdk');
const lineBot = require('./line-bot');

// เพิ่มก่อน initializeDatabase()
// ==================== LINE Bot Webhook ====================

app.post('/webhook/line', line.middleware(lineBot.config), async (req, res) => {
  try {
    const events = req.body.events;
    
    const results = await Promise.all(
      events.map(async (event) => {
        const message = await lineBot.handleMessage(event);
        
        if (message) {
          return lineBot.client.replyMessage(event.replyToken, message);
        }
      })
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('LINE webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// เพิ่ม endpoint ทดสอบ
app.get('/webhook/line', (req, res) => {
  res.json({ 
    status: 'LINE Bot webhook is ready',
    configured: !!process.env.LINE_CHANNEL_ACCESS_TOKEN
  });
});
```

---

## 🌐 Setup Webhook URL (ใช้ ngrok)

### ติดตั้ง ngrok

1. **ดาวน์โหลด ngrok**
   - ไปที่: https://ngrok.com/download
   - ดาวน์โหลดและติดตั้ง

2. **รัน ngrok**
   ```bash
   # เปิด Terminal ใหม่
   ngrok http 3001
   ```

3. **คัดลอก URL**
   ```
   Forwarding: https://xxxx-xx-xx-xx-xx.ngrok-free.app -> http://localhost:3001
   ```
   คัดลอก URL ที่ขึ้นต้นด้วย `https://`

4. **ใส่ใน LINE Console**
   - กลับไปที่ LINE Developers Console
   - Tab "Messaging API"
   - Webhook URL: `https://xxxx.ngrok-free.app/webhook/line`
   - คลิก "Update"
   - คลิก "Verify" เพื่อทดสอบ

---

## ✅ ทดสอบ

### 1. Restart Backend
```bash
# กด Ctrl+C หยุด Backend
cd backend
npm start
```

ควรเห็น:
```
🚀 Server is running on http://localhost:3001
💬 LINE Notify: ✅ Configured
🤖 LINE Bot: ✅ Configured
```

### 2. ทดสอบ Webhook
```bash
curl http://localhost:3001/webhook/line
```

ควรได้:
```json
{
  "status": "LINE Bot webhook is ready",
  "configured": true
}
```

### 3. ทดสอบในไลน์

เปิดไลน์ → ห้องแชทกับ Bot:

**ทดสอบ 1: บันทึกรายจ่าย**
```
คุณพิมพ์: ซื้อปุ๋ย 800
Bot ตอบ: ✅ บันทึกแล้ว!
        💰 ปุ๋ย: 800.00 บาท
        📝 ซื้อปุ๋ย
        📅 7 ธ.ค. 2567
```

**ทดสอบ 2: ดูสรุป**
```
คุณพิมพ์: สรุปวันนี้
Bot ตอบ: 📊 สรุปรายจ่ายวันนี้
        💸 ยอดรวม: 2,350.00 บาท
        📝 จำนวน: 5 รายการ
```

**ทดสอบ 3: Help**
```
คุณพิมพ์: help
Bot ตอบ: 🌱 บอทบัญชีรายจ่ายสวน
        ...วิธีใช้งาน...
```

---

## 📱 คำสั่งที่ Bot เข้าใจ

### บันทึกรายจ่าย
```
✅ "ซื้อปุ๋ย 800"
✅ "ปุ๋ย 800"
✅ "เมล็ดพันธุ์ 450"
✅ "ค่าแรง 2000"
✅ "น้ำ 350 บาท"
❌ "ปุ๋ย" (ไม่มีจำนวน)
❌ "800 บาท" (ไม่มีรายละเอียด)
```

### ดูสรุป
```
✅ "สรุปวันนี้"
✅ "สรุป"
✅ "summary"
```

### ช่วยเหลือ
```
✅ "help"
✅ "ช่วย"
✅ "ช่วยเหลือ"
✅ "วิธีใช้"
```

---

## 🎯 ตัวอย่างการใช้งานจริง

```
09:00 - คุณ: "ซื้อปุ๋ย 800"
09:00 - Bot: "✅ บันทึกแล้ว! ปุ๋ย: 800 บาท"

10:30 - คุณ: "เมล็ดพันธุ์ 450"
10:30 - Bot: "✅ บันทึกแล้ว! เมล็ดพันธุ์: 450 บาท"

12:00 - คุณ: "ค่าแรง 2000"
12:00 - Bot: "✅ บันทึกแล้ว! ค่าแรง: 2,000 บาท"

20:00 - คุณ: "สรุปวันนี้"
20:00 - Bot: "📊 สรุปรายจ่ายวันนี้
              💸 ยอดรวม: 3,250 บาท
              📝 จำนวน: 3 รายการ"
```

---

## 💰 ค่าใช้จ่าย

### LINE Messaging API
- **ฟรี**: 500 ข้อความ/เดือน
- **Pro**: ~300 บาท/เดือน (ไม่จำกัด)

### ngrok
- **ฟรี**: ใช้ได้ แต่ URL เปลี่ยนทุกครั้งที่รัน
- **Pro**: ~$8/เดือน (URL คงที่)

### แนะนำ:
เริ่มด้วย **ฟรีทั้งหมด** ไปก่อน!

---

## 🚀 Deploy (สำหรับใช้งานจริง)

เมื่อพร้อม Deploy:

1. **Backend** → Railway / Render
2. **Frontend** → Vercel
3. **Database** → PlanetScale / Railway MySQL
4. **Webhook URL** → ใช้ Railway URL แทน ngrok

ดูรายละเอียดที่ **PRODUCTION_ROADMAP.md**

---

## ❓ แก้ไขปัญหา

### Bot ไม่ตอบ

**1. เช็ค Webhook**
```bash
curl https://your-ngrok-url.ngrok-free.app/webhook/line
```

**2. เช็ค LINE Console**
- ตรวจสอบ "Use webhook" เปิดอยู่
- ตรวจสอบ Webhook URL ถูกต้อง
- ลอง "Verify" webhook

**3. เช็ค Backend Log**
```bash
# ดูใน Terminal ที่รัน Backend
# ควรเห็น log เมื่อมีข้อความเข้ามา
```

**4. เช็ค Token**
```env
# ใน .env ต้องมี
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
```

### ngrok หมดอายุ

- ngrok Free จะหมดอายุทุก 2 ชั่วโมง
- รันใหม่แล้ว Update Webhook URL ใน LINE Console

---

## 🎉 สรุป

ตอนนี้คุณมี:
- ✅ พิมพ์ในไลน์ → บันทึกอัตโนมัติ
- ✅ Bot ตอบกลับทันที
- ✅ ถามสรุปได้
- ✅ ใช้งานฟรี!

**ครบทั้ง 2 ระบบ:**
1. LINE Notify → แจ้งเตือนอัตโนมัติ
2. LINE Bot → พิมพ์บันทึกได้

---

**Happy Chatting! 💬🌱**
