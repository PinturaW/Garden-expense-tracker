const mysql = require('mysql2/promise');
require('dotenv').config();

// สร้าง Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'garden_expense',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// ฟังก์ชันสร้างฐานข้อมูลและตาราง
const initializeDatabase = async () => {
  try {
    const connection = await pool.getConnection();
    
    console.log('✅ Connected to MySQL Database');

    // สร้างตาราง categories
    await connection.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        color VARCHAR(7),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // สร้างตาราง transactions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        type ENUM('income', 'expense') NOT NULL,
        category_id INT,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
        INDEX idx_type (type),
        INDEX idx_date (date),
        INDEX idx_category (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // ตรวจสอบว่ามีข้อมูลหมวดหมู่หรือยัง
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM categories');
    
    if (rows[0].count === 0) {
      console.log('📝 Inserting default categories...');
      
      // ใส่ข้อมูลหมวดหมู่เริ่มต้น (รายจ่ายเท่านั้น)
      const categories = [
        ['ปุ๋ย', 'expense', '#ef4444'],
        ['เมล็ดพันธุ์', 'expense', '#f59e0b'],
        ['น้ำ', 'expense', '#06b6d4'],
        ['ค่าแรง', 'expense', '#ec4899'],
        ['อุปกรณ์', 'expense', '#6366f1'],
        ['ยากำจัดศัตรูพืช', 'expense', '#8b5cf6'],
        ['ค่าขนส่ง', 'expense', '#14b8a6'],
        ['ค่าไฟฟ้า', 'expense', '#f97316'],
        ['ซ่อมบำรุง', 'expense', '#a855f7'],
        ['รายจ่ายอื่นๆ', 'expense', '#64748b']
      ];

      for (const cat of categories) {
        await connection.query(
          'INSERT INTO categories (name, type, color) VALUES (?, ?, ?)',
          cat
        );
      }
      
      console.log('✅ Default categories inserted (10 categories)');
    }

    connection.release();
    console.log('✅ Database initialized successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    throw error;
  }
};

module.exports = { pool, initializeDatabase };
