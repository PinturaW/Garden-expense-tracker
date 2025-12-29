const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const line = require('@line/bot-sdk');
const { pool, initializeDatabase } = require('./database');
const {
  sendLineNotify,
  formatExpenseMessage,
  formatDailySummary,
  formatMonthlySummary
} = require('./line-notify');
const lineBot = require('./line-bot');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ==================== API Endpoints ====================

// 📊 ดึงสถิติภาพรวม
app.get('/api/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        type,
        SUM(amount) as total
      FROM transactions
      WHERE 1=1
    `;
    
    const params = [];
    if (startDate && endDate) {
      query += ' AND date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' GROUP BY type';

    const [rows] = await pool.query(query, params);
    
    const summary = {
      income: 0,
      expense: 0,
      balance: 0
    };
    
    rows.forEach(row => {
      summary[row.type] = parseFloat(row.total) || 0;
    });
    
    summary.balance = summary.income - summary.expense;
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📝 ดึงรายการทั้งหมด
app.get('/api/transactions', async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    let query = `
      SELECT t.*, c.name as category_name, c.color as category_color
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND t.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ➕ เพิ่มรายการใหม่
app.post('/api/transactions', async (req, res) => {
  try {
    const { type, category_id, amount, description, date } = req.body;
    
    if (!type || !amount || !date) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
    }

    const query = `
      INSERT INTO transactions (type, category_id, amount, description, date)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [type, category_id, amount, description, date]);
    
    // ดึงข้อมูลที่เพิ่งสร้าง พร้อมชื่อหมวดหมู่
    const [newTransaction] = await pool.query(`
      SELECT t.*, c.name as category_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `, [result.insertId]);

    // 🔔 ส่งแจ้งเตือนไปไลน์ (เฉพาะรายจ่าย)
    if (type === 'expense' && newTransaction[0]) {
      const message = formatExpenseMessage(newTransaction[0]);
      sendLineNotify(message).catch(err => {
        console.error('Failed to send LINE notification:', err);
      });
    }

    res.json({ id: result.insertId, message: 'เพิ่มรายการสำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✏️ แก้ไขรายการ
app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, category_id, amount, description, date } = req.body;

    const query = `
      UPDATE transactions 
      SET type = ?, category_id = ?, amount = ?, description = ?, date = ?
      WHERE id = ?
    `;

    await pool.query(query, [type, category_id, amount, description, date, id]);
    res.json({ message: 'แก้ไขรายการสำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🗑️ ลบรายการ
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM transactions WHERE id = ?', [id]);
    res.json({ message: 'ลบรายการสำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📂 ดึงหมวดหมู่
app.get('/api/categories', async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = 'SELECT * FROM categories';
    const params = [];
    
    if (type) {
      query += ' WHERE type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY name';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ➕ เพิ่มหมวดหมู่
app.post('/api/categories', async (req, res) => {
  try {
    const { name, type, color } = req.body;
    const query = 'INSERT INTO categories (name, type, color) VALUES (?, ?, ?)';
    const [result] = await pool.query(query, [name, type, color || '#6b7280']);
    res.json({ id: result.insertId, message: 'เพิ่มหมวดหมู่สำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 สถิติตามหมวดหมู่
app.get('/api/stats/by-category', async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    let query = `
      SELECT 
        c.name,
        c.color,
        SUM(t.amount) as total,
        COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND t.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    if (type) {
      query += ' AND t.type = ?';
      params.push(type);
    }
    
    query += ' GROUP BY c.id, c.name, c.color ORDER BY total DESC';

    const [rows] = await pool.query(query, params);
    
    const results = rows.map(row => ({
      ...row,
      total: parseFloat(row.total)
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📈 สถิติรายเดือน
app.get('/api/stats/monthly', async (req, res) => {
  try {
    const { year } = req.query;
    
    let query = `
      SELECT 
        DATE_FORMAT(date, '%Y-%m') as month,
        type,
        SUM(amount) as total
      FROM transactions
    `;
    
    const params = [];
    
    if (year) {
      query += " WHERE YEAR(date) = ?";
      params.push(year);
    }
    
    query += ' GROUP BY month, type ORDER BY month';

    const [rows] = await pool.query(query, params);
    
    const results = rows.map(row => ({
      ...row,
      total: parseFloat(row.total)
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📥 Export ข้อมูลเป็น CSV
app.get('/api/export/csv', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let query = `
      SELECT 
        t.date as 'วันที่',
        c.name as 'หมวดหมู่',
        t.amount as 'จำนวนเงิน',
        t.description as 'รายละเอียด'
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense'
    `;
    
    const params = [];
    
    if (startDate && endDate) {
      query += ' AND t.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    
    query += ' ORDER BY t.date DESC';

    const [rows] = await pool.query(query, params);
    
    // สร้าง CSV with UTF-8 BOM
    const headers = ['วันที่', 'หมวดหมู่', 'จำนวนเงิน', 'รายละเอียด'];
    let csv = '\uFEFF' + headers.join(',') + '\n';
    
    rows.forEach(row => {
      const values = [
        row['วันที่'],
        `"${row['หมวดหมู่'] || '-'}"`,
        row['จำนวนเงิน'],
        `"${(row['รายละเอียด'] || '-').replace(/"/g, '""')}"`
      ];
      csv += values.join(',') + '\n';
    });
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LINE Notify Endpoints ====================

// 📊 ส่งสรุปรายจ่ายวันนี้ไปไลน์
app.post('/api/line/daily-summary', async (req, res) => {
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
    `, [today]);

    const data = {
      total: summary[0].total || 0,
      count: summary[0].count || 0,
      categories
    };

    if (data.count === 0) {
      return res.json({ 
        success: false, 
        message: 'ไม่มีรายจ่ายวันนี้' 
      });
    }

    const message = formatDailySummary(data);
    const sent = await sendLineNotify(message);

    if (sent) {
      res.json({ success: true, message: 'ส่งสรุปไปไลน์แล้ว' });
    } else {
      res.status(500).json({ success: false, message: 'ไม่ได้ตั้งค่า LINE_NOTIFY_TOKEN' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 📊 ส่งสรุปรายจ่ายเดือนนี้ไปไลน์
app.post('/api/line/monthly-summary', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    const [summary] = await pool.query(`
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE type = 'expense' 
        AND YEAR(date) = ? 
        AND MONTH(date) = ?
    `, [year, month]);

    const data = {
      total: summary[0].total || 0,
      count: summary[0].count || 0
    };

    if (data.count === 0) {
      return res.json({ 
        success: false, 
        message: 'ไม่มีรายจ่ายเดือนนี้' 
      });
    }

    const message = formatMonthlySummary(data, year, month);
    const sent = await sendLineNotify(message);

    if (sent) {
      res.json({ success: true, message: 'ส่งสรุปไปไลน์แล้ว' });
    } else {
      res.status(500).json({ success: false, message: 'ไม่ได้ตั้งค่า LINE_NOTIFY_TOKEN' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LINE Bot Webhook ====================

// POST webhook - รับข้อความจาก LINE
// ==================== LINE Bot Webhook ====================

// POST webhook - รับข้อความจาก LINE (แก้ไขสำหรับ ngrok)
app.post('/webhook/line', express.json(), async (req, res) => {
  try {
    if (!lineBot.client) {
      return res.status(400).json({ error: 'LINE Bot not configured' });
    }

    const events = req.body.events;
    
    if (!events || events.length === 0) {
      return res.json({ success: true });
    }
    
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

// GET webhook - สำหรับทดสอบ
app.get('/webhook/line', (req, res) => {
  res.json({ 
    status: 'LINE Bot webhook is ready',
    configured: !!(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET)
  });
});


// ==================== Cron Jobs ====================

// ส่งสรุปรายจ่ายทุกวันเวลา 20:00 น.
cron.schedule('0 20 * * *', async () => {
  console.log('⏰ Running daily summary cron job...');
  
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
    `, [today]);

    if (summary[0].count > 0) {
      const data = {
        total: summary[0].total || 0,
        count: summary[0].count || 0,
        categories
      };

      const message = formatDailySummary(data);
      await sendLineNotify(message);
      
      console.log('✅ Daily summary sent to LINE');
    } else {
      console.log('ℹ️  No expenses today');
    }
  } catch (error) {
    console.error('❌ Daily cron error:', error);
  }
}, {
  timezone: "Asia/Bangkok"
});

// ส่งสรุปรายเดือนวันที่ 1 เวลา 09:00 น.
cron.schedule('0 9 1 * *', async () => {
  console.log('⏰ Running monthly summary cron job...');
  
  try {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;

    const [summary] = await pool.query(`
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE type = 'expense' 
        AND YEAR(date) = ? 
        AND MONTH(date) = ?
    `, [year, month]);

    if (summary[0].count > 0) {
      const data = {
        total: summary[0].total || 0,
        count: summary[0].count || 0
      };

      const message = formatMonthlySummary(data, year, month);
      await sendLineNotify(message);
      
      console.log('✅ Monthly summary sent to LINE');
    }
  } catch (error) {
    console.error('❌ Monthly cron error:', error);
  }
}, {
  timezone: "Asia/Bangkok"
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    lineNotify: !!process.env.LINE_NOTIFY_TOKEN
  });
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📊 API ready at http://localhost:${PORT}/api`);
      console.log(`💬 LINE Notify: ${process.env.LINE_NOTIFY_TOKEN ? '✅ Configured' : '⚠️  Not configured (optional)'}`);
      console.log(`🤖 LINE Bot: ${(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET) ? '✅ Configured' : '⚠️  Not configured (optional)'}`);
      console.log(`⏰ Cron jobs scheduled (Bangkok timezone)`);
      console.log(`\n📖 Next steps:`);
      console.log(`   1. Open frontend: http://localhost:3000`);
      console.log(`   2. Setup LINE Notify: See LINE_QUICKSTART.md`);
      console.log(`   3. Setup LINE Bot: See LINE_BOT_GUIDE.md`);
    });
  })
  .catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
