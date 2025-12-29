const axios = require('axios');

const LINE_NOTIFY_API = 'https://notify-api.line.me/api/notify';

/**
 * ส่งข้อความไปไลน์
 */
const sendLineNotify = async (message, imageUrl = null) => {
  try {
    const token = process.env.LINE_NOTIFY_TOKEN;
    
    if (!token) {
      console.log('⚠️  LINE_NOTIFY_TOKEN not configured - skipping notification');
      return false;
    }

    const data = new URLSearchParams();
    data.append('message', message);
    
    if (imageUrl) {
      data.append('imageThumbnail', imageUrl);
      data.append('imageFullsize', imageUrl);
    }

    await axios.post(LINE_NOTIFY_API, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ LINE notification sent');
    return true;
  } catch (error) {
    console.error('❌ LINE notify error:', error.response?.data || error.message);
    return false;
  }
};

/**
 * จัดรูปแบบข้อความรายจ่ายใหม่
 */
const formatExpenseMessage = (expense) => {
  const amount = parseFloat(expense.amount).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const date = new Date(expense.date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
🌱 รายจ่ายใหม่
━━━━━━━━━━━━━━━━
📅 วันที่: ${date}
📂 หมวดหมู่: ${expense.category_name || 'ไม่ระบุ'}
💰 จำนวน: ${amount} บาท
📝 รายละเอียด: ${expense.description || '-'}
━━━━━━━━━━━━━━━━`;
};

/**
 * จัดรูปแบบสรุปรายจ่ายประจำวัน
 */
const formatDailySummary = (data) => {
  const total = parseFloat(data.total || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const today = new Date().toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let message = `
📊 สรุปรายจ่ายวันนี้
${today}
━━━━━━━━━━━━━━━━
💸 ยอดรวม: ${total} บาท
📝 จำนวนรายการ: ${data.count} รายการ`;

  if (data.categories && data.categories.length > 0) {
    message += '\n━━━━━━━━━━━━━━━━\n\n📂 แยกตามหมวดหมู่:';
    data.categories.forEach(cat => {
      const catAmount = parseFloat(cat.total).toLocaleString('th-TH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      message += `\n• ${cat.name}: ${catAmount} บาท`;
    });
  }
  
  message += '\n━━━━━━━━━━━━━━━━';

  return message;
};

/**
 * จัดรูปแบบสรุปรายจ่ายประจำเดือน
 */
const formatMonthlySummary = (data, year, month) => {
  const total = parseFloat(data.total || 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const monthName = new Date(year, month - 1).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long'
  });

  const daysInMonth = new Date(year, month, 0).getDate();
  const avgPerDay = (data.total / daysInMonth).toLocaleString('th-TH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return `
📊 สรุปรายจ่ายเดือน${monthName}
━━━━━━━━━━━━━━━━
💸 ยอดรวม: ${total} บาท
📝 จำนวนรายการ: ${data.count} รายการ
📈 เฉลี่ย/วัน: ${avgPerDay} บาท
━━━━━━━━━━━━━━━━`;
};

module.exports = {
  sendLineNotify,
  formatExpenseMessage,
  formatDailySummary,
  formatMonthlySummary
};
