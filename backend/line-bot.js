const line = require('@line/bot-sdk');
const Anthropic = require('@anthropic-ai/sdk');
const { pool } = require('./database');

// LINE Bot Configuration
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || ''
};

let client = null;
try {
  if (config.channelAccessToken && config.channelSecret) {
    client = new line.Client(config);
    console.log('✅ LINE Bot initialized');
  }
} catch (error) {
  console.log('⚠️  LINE Bot not configured');
}

// Anthropic Claude API
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Parse ข้อความด้วย Hybrid Method (Regex + Claude AI)
 */
const parseExpenseMessage = async (text) => {
  try {
    // ถ้าไม่มี API Key ใช้ parser แบบเดิม
    if (!process.env.ANTHROPIC_API_KEY) {
      return parseExpenseMessageBasic(text);
    }

    // ใช้ Regex หาข้อมูลสำคัญก่อน
    const cleaned = text.replace(/^ซื้อ\s*/, '').trim();
    
    // หาสูตรปุ๋ย (เช่น 15-0-0, 25-7-7)
    const formulaMatch = cleaned.match(/(\d+-\d+-\d+)/);
    const formula = formulaMatch ? formulaMatch[1] : null;
    
    // ลบสูตรปุ๋ยออกจากข้อความชั่วคราว เพื่อไม่ให้ Claude สับสน
    let textWithoutFormula = cleaned;
    if (formula) {
      textWithoutFormula = cleaned.replace(formula, '').trim();
    }
    
    // หา quantity + unit (เช่น "7กระสอบ", "10 ถุง")
    const quantityMatch = textWithoutFormula.match(/(\d+)\s*(กระสอบ|ถุง|ขวด|ลิตร|กิโลกรัม|โล|คน|กระป๋อง|แกลลอน)/);
    
    // หาตัวเลขทั้งหมดที่เหลือ (สำหรับหา amount)
    const allNumbers = textWithoutFormula.match(/\d+(?:\.\d+)?/g) || [];
    
    console.log('📝 Pre-parse Analysis:', {
      original: text,
      formula: formula,
      textWithoutFormula: textWithoutFormula,
      quantityMatch: quantityMatch,
      allNumbers: allNumbers
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `แปลงข้อความเป็น JSON สำหรับระบบบัญชีรายจ่ายสวน

ข้อความต้นฉบับ: "${text}"

ข้อมูลที่ตรวจพบแล้ว:
${formula ? `- สูตรปุ๋ย: ${formula}` : '- ไม่มีสูตรปุ๋ย'}
${quantityMatch ? `- quantity: ${quantityMatch[1]} ${quantityMatch[2]}` : '- ไม่ระบุ quantity'}
- ตัวเลขทั้งหมด: ${allNumbers.join(', ')}

กฎการวิเคราะห์:
1. description: ชื่อสินค้า/รายการ (เช่น ปุ๋ย, ยา, ค่าแรง)
2. category: ปุ๋ย|เมล็ดพันธุ์|น้ำ|ค่าแรง|อุปกรณ์|ยากำจัดศัตรูพืช|ค่าขนส่ง|ค่าไฟฟ้า|ซ่อมบำรุง|อื่นๆ
3. quantity: ${quantityMatch ? quantityMatch[1] : 'null'}
4. unit: ${quantityMatch ? `"${quantityMatch[2]}"` : 'null'}
5. amount: ตัวเลขที่ใหญ่ที่สุดในรายการ (มักเป็นราคารวม)
6. unit_price: คำนวณจาก amount / quantity
7. note: ${formula ? `"สูตร ${formula}"` : 'null หรือข้อมูลเพิ่มเติม'}

ตัวอย่าง:
ข้อความ: "ซื้อปุ๋ย 15-0-0 7กระสอบ 1800"
→ {"description":"ปุ๋ย","category":"ปุ๋ย","quantity":7,"unit":"กระสอบ","amount":1800,"unit_price":257.14,"note":"สูตร 15-0-0"}

ตอบเฉพาะ JSON object:`
      }]
    });

    // Parse response
    const responseText = message.content[0].text.trim();
    console.log('🤖 Claude Response:', responseText);
    
    let cleanText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('❌ Claude response not JSON, fallback to basic parser');
      return parseExpenseMessageBasic(text);
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log('📊 Parsed Data:', parsed);

    // ตรวจสอบและแก้ไขข้อมูลที่อาจผิดพลาด
    if (formula) {
      // ถ้ามีสูตรปุ๋ย แต่ quantity ผิดพลาด ให้ใช้จาก regex
      const formulaFirstNumber = parseInt(formula.split('-')[0]);
      if (parsed.quantity === formulaFirstNumber && quantityMatch) {
        console.warn('⚠️  Detected wrong quantity from formula, fixing...');
        parsed.quantity = parseInt(quantityMatch[1]);
        parsed.unit = quantityMatch[2];
      }
    }
    
    // ถ้า amount เป็น 0 แต่มีตัวเลขอื่น ให้เอาตัวเลขที่ใหญ่ที่สุด
    if ((!parsed.amount || parsed.amount === 0) && allNumbers.length > 0) {
      const sortedNumbers = allNumbers.map(n => parseFloat(n)).sort((a, b) => b - a);
      parsed.amount = sortedNumbers[0];
      console.warn('⚠️  Fixed amount:', parsed.amount);
    }

    // คำนวณ unit_price อีกครั้ง
    if (parsed.quantity && parsed.amount) {
      parsed.unit_price = parsed.amount / parsed.quantity;
    }

    // Map category ไทยเป็น ID
    const categoryMap = {
      'ปุ๋ย': 1,
      'เมล็ดพันธุ์': 2,
      'น้ำ': 3,
      'ค่าแรง': 4,
      'อุปกรณ์': 5,
      'ยากำจัดศัตรูพืช': 6,
      'ค่าขนส่ง': 7,
      'ค่าไฟฟ้า': 8,
      'ซ่อมบำรุง': 9,
      'อื่นๆ': 10
    };

    return {
      category_id: categoryMap[parsed.category] || 10,
      amount: parseFloat(parsed.amount),
      description: parsed.description,
      quantity: parsed.quantity ? parseFloat(parsed.quantity) : null,
      unit: parsed.unit || null,
      unit_price: parsed.unit_price ? parseFloat(parsed.unit_price) : null,
      note: parsed.note || null,
      date: new Date().toISOString().split('T')[0]
    };

  } catch (error) {
    console.error('Error parsing with Claude:', error);
    // Fallback to basic parser
    return parseExpenseMessageBasic(text);
  }
};

/**
 * Parse ข้อความแบบ Basic (Fallback)
 */
const parseExpenseMessageBasic = (text) => {
  const cleaned = text.replace(/^ซื้อ\s*/, '').trim();
  const numbers = cleaned.match(/\d+(?:\.\d{1,2})?/g);
  
  if (!numbers || numbers.length === 0) {
    return null;
  }
  
  const descriptionMatch = cleaned.match(/^([^\d]+)/);
  const description = descriptionMatch ? descriptionMatch[1].trim() : 'รายจ่าย';
  
  const unitMatch = cleaned.match(/\d+\s*([ก-๙a-zA-Z]+)/);
  const unit = unitMatch ? unitMatch[1] : null;
  
  let quantity = null;
  let unitPrice = null;
  let amount = null;
  let note = null;
  
  // หาสูตรปุ๋ย (เช่น 15-0-0, 25-7-7)
  const formulaMatch = cleaned.match(/(\d+-\d+-\d+)/);
  if (formulaMatch) {
    note = `สูตร ${formulaMatch[1]}`;
  }
  
  // หา note จากคำว่า "ละ X โล" หรือ "ละ X ml"
  const noteMatch = cleaned.match(/ละ\s*(\d+(?:\.\d+)?)\s*(โล|กิโลกรัม|ml|ลิตร|แกลลอน)/i);
  if (noteMatch && !note) {
    note = `${unit || 'หน่วย'}ละ ${noteMatch[1]} ${noteMatch[2]}`;
  }
  
  if (cleaned.includes('ละ') || cleaned.includes('บาท/') || cleaned.includes('/')) {
    if (numbers.length >= 2) {
      quantity = parseFloat(numbers[0]);
      unitPrice = parseFloat(numbers[1]);
      amount = quantity * unitPrice;
    } else {
      amount = parseFloat(numbers[0]);
    }
  } else if (numbers.length >= 2) {
    quantity = parseFloat(numbers[0]);
    amount = parseFloat(numbers[1]);
    if (quantity > 0) {
      unitPrice = amount / quantity;
    }
  } else {
    amount = parseFloat(numbers[0]);
  }
  
  const categoryMap = {
    'ปุ๋ย': 1, 'เมล็ด': 2, 'พันธุ์': 2, 'น้ำ': 3,
    'แรง': 4, 'จ้าง': 4, 'อุปกรณ์': 5, 'เครื่องมือ': 5,
    'ยา': 6, 'พ่น': 6, 'ขนส่ง': 7, 'ส่ง': 7,
    'ไฟ': 8, 'ไฟฟ้า': 8, 'ซ่อม': 9, 'บำรุง': 9
  };
  
  let categoryId = 10;
  for (const [keyword, id] of Object.entries(categoryMap)) {
    if (description.toLowerCase().includes(keyword) || cleaned.toLowerCase().includes(keyword)) {
      categoryId = id;
      break;
    }
  }
  
  return {
    category_id: categoryId,
    amount: amount,
    description: description,
    quantity: quantity,
    unit: unit,
    unit_price: unitPrice,
    note: note,
    date: new Date().toISOString().split('T')[0]
  };
};

/**
 * บันทึกรายจ่าย
 */
const saveExpense = async (expenseData, userId, userName) => {
  try {
    const query = `
      INSERT INTO transactions 
      (type, category_id, amount, description, date, user_id, user_name, quantity, unit, unit_price, notes)
      VALUES ('expense', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [
      expenseData.category_id,
      expenseData.amount,
      expenseData.description,
      expenseData.date,
      userId,
      userName,
      expenseData.quantity,
      expenseData.unit,
      expenseData.unit_price,
      expenseData.note
    ]);
    
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
 * ดึงสรุปรายจ่ายวันนี้ (เฉพาะของตัวเอง)
 */
const getTodaySummary = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [summary] = await pool.query(`
      SELECT 
        SUM(amount) as total,
        COUNT(*) as count
      FROM transactions
      WHERE type = 'expense' AND date = ? AND user_id = ?
    `, [today, userId]);
    
    const [categories] = await pool.query(`
      SELECT 
        c.name,
        SUM(t.amount) as total,
        COUNT(*) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.type = 'expense' AND t.date = ? AND t.user_id = ?
      GROUP BY c.id, c.name
      ORDER BY total DESC
      LIMIT 5
    `, [today, userId]);
    
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
  
  let message = `✅ บันทึกแล้ว!\n━━━━━━━━━━━━━━\n💰 ${transaction.category_name || 'อื่นๆ'}: ${amount} บาท\n📝 ${transaction.description}`;
  
  if (transaction.quantity && transaction.unit) {
    const qty = parseFloat(transaction.quantity).toLocaleString('th-TH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    message += `\n📦 ${qty} ${transaction.unit}`;
    
    if (transaction.unit_price) {
      const unitPrice = parseFloat(transaction.unit_price).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      message += `\n💵 ${unitPrice} บาท/${transaction.unit}`;
    }
  }
  
  // เพิ่ม note ถ้ามี
  if (transaction.notes) {
    message += `\n📋 ${transaction.notes}`;
  }
  
  message += `\n📅 ${date}\n━━━━━━━━━━━━━━`;
  
  return message;
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
  
  let message = `📊 สรุปรายจ่ายของคุณวันนี้\n${today}\n━━━━━━━━━━━━━━\n💸 ยอดรวม: ${total} บาท\n📝 จำนวน: ${data.count} รายการ`;
  
  if (data.categories.length > 0) {
    message += '\n━━━━━━━━━━━━━━\n\n📂 Top 5 หมวดหมู่:';
    data.categories.forEach(cat => {
      const catAmount = parseFloat(cat.total).toLocaleString('th-TH', {
        minimumFractionDigits: 2
      });
      message += `\n• ${cat.name}: ${catAmount} บาท (${cat.count} รายการ)`;
    });
  }
  
  message += '\n━━━━━━━━━━━━━━';
  return message;
};

const formatHelpMessage = () => {
  return `🌱 บอทบัญชีรายจ่ายสวน

📝 วิธีใช้งาน:

1️⃣ บันทึกรายจ่าย (พิมพ์อะไรก็ได้):

   📌 แบบง่าย:
   "ปุ๋ย 800"
   "ค่าแรง 2000"

   📌 ระบุปริมาณ:
   "ปุ๋ย 5 ถุง 800"
   "ยา 4 ขวด 200"

   📌 ระบุราคาต่อหน่วย:
   "ปุ๋ย 5 ถุง ถุงละ 160"
   "ค่าแรง 2 คน คนละ 500"

   📌 ระบุขนาด/รายละเอียด:
   "ปุ๋ย 5 ถุง ถุงละ 160 ถุงละ 10 โล"
   "ยา 4 ขวด 200 ขวดละ 500ml"
   "ซื้อปุ๋ย 15-0-0 7 กระสอบ 1800"
   "ซื้อปุ๋ยสูตร 25-7-7 กระสอบละ 1200 7กระสอบ"

2️⃣ ดูสรุป:
   "สรุปวันนี้" - สรุปของคุณ
   "สรุป"

3️⃣ ช่วยเหลือ:
   "help" หรือ "ช่วย"

━━━━━━━━━━━━━━
🤖 ระบบใช้ AI อ่านข้อความ
พิมพ์แบบไหนก็เข้าใจ!

📂 หมวดหมู่ที่รองรับ:
- ปุ๋ย • เมล็ดพันธุ์ • น้ำ
- ค่าแรง • อุปกรณ์
- ยากำจัดศัตรูพืช • ค่าขนส่ง
- ค่าไฟฟ้า • ซ่อมบำรุง • อื่นๆ

💡 ระบบแยกข้อมูลแต่ละคน
แต่ละคนดูได้เฉพาะรายจ่ายของตัวเอง!`;
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
  
  // ดึงชื่อผู้ใช้จาก LINE Profile
  let userName = 'ผู้ใช้';
  try {
    if (client) {
      const profile = await client.getProfile(userId);
      userName = profile.displayName;
    }
  } catch (error) {
    console.error('Error getting profile:', error);
  }
  
  try {
    // คำสั่งสรุป (เฉพาะของตัวเอง)
    if (['สรุปวันนี้', 'สรุป', 'summary'].includes(text.toLowerCase())) {
      const summary = await getTodaySummary(userId);
      if (summary.count === 0) {
        return { type: 'text', text: 'คุณยังไม่มีรายจ่ายวันนี้' };
      }
      return { type: 'text', text: formatSummaryMessage(summary) };
    }
    
    if (['help', 'ช่วย', 'ช่วยเหลือ', 'วิธีใช้'].includes(text.toLowerCase())) {
      return { type: 'text', text: formatHelpMessage() };
    }
    
    // Parse ด้วย Claude AI
    const expenseData = await parseExpenseMessage(text);
    
    if (!expenseData) {
      return {
        type: 'text',
        text: '❌ ไม่เข้าใจข้อความ\n\nลองพิมพ์:\n"ซื้อปุ๋ย 800"\n"ปุ๋ย 5 ถุง 800"\n"ซื้อปุ๋ย 15-0-0 7 กระสอบ 1800"\n\nหรือพิมพ์ "help" ดูวิธีใช้'
      };
    }
    
    // บันทึกรายจ่าย
    const transaction = await saveExpense(expenseData, userId, userName);
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