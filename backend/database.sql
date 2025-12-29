-- ===================================================
-- ระบบบัญชีรายจ่ายสวน (Garden Expense Tracker)
-- Database Setup for phpMyAdmin
-- ===================================================

-- สร้างฐานข้อมูล
CREATE DATABASE IF NOT EXISTS garden_expense 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- ใช้งานฐานข้อมูล
USE garden_expense;

-- ===================================================
-- ตาราง categories (หมวดหมู่รายจ่าย)
-- ===================================================

CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL COMMENT 'ชื่อหมวดหมู่',
  type ENUM('income', 'expense') NOT NULL COMMENT 'ประเภท',
  color VARCHAR(7) DEFAULT '#6b7280' COMMENT 'รหัสสี',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางหมวดหมู่';

-- ===================================================
-- ตาราง transactions (รายการรายจ่าย)
-- ===================================================

CREATE TABLE IF NOT EXISTS transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  type ENUM('income', 'expense') NOT NULL COMMENT 'ประเภท',
  category_id INT COMMENT 'หมวดหมู่',
  amount DECIMAL(10,2) NOT NULL COMMENT 'จำนวนเงิน',
  description TEXT COMMENT 'รายละเอียด',
  date DATE NOT NULL COMMENT 'วันที่',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'วันที่สร้าง',
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_type (type),
  INDEX idx_date (date),
  INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ตารางรายการรายจ่าย';

-- ===================================================
-- ข้อมูลเริ่มต้น - หมวดหมู่รายจ่าย (10 หมวด)
-- ===================================================

INSERT INTO categories (name, type, color) VALUES
('ปุ๋ย', 'expense', '#ef4444'),
('เมล็ดพันธุ์', 'expense', '#f59e0b'),
('น้ำ', 'expense', '#06b6d4'),
('ค่าแรง', 'expense', '#ec4899'),
('อุปกรณ์', 'expense', '#6366f1'),
('ยากำจัดศัตรูพืช', 'expense', '#8b5cf6'),
('ค่าขนส่ง', 'expense', '#14b8a6'),
('ค่าไฟฟ้า', 'expense', '#f97316'),
('ซ่อมบำรุง', 'expense', '#a855f7'),
('รายจ่ายอื่นๆ', 'expense', '#64748b');

-- ===================================================
-- ข้อมูลตัวอย่าง - รายการรายจ่าย
-- ===================================================

INSERT INTO transactions (type, category_id, amount, description, date) VALUES
('expense', 1, 800.00, 'ซื้อปุ๋ยยูเรีย 1 กระสอบ', CURDATE() - INTERVAL 6 DAY),
('expense', 2, 450.00, 'เมล็ดพันธุ์ผักกาด', CURDATE() - INTERVAL 5 DAY),
('expense', 3, 350.00, 'ค่าน้ำประปา', CURDATE() - INTERVAL 4 DAY),
('expense', 4, 2000.00, 'ค่าแรงดูแลสวน 2 วัน', CURDATE() - INTERVAL 3 DAY),
('expense', 5, 1200.00, 'ซื้อสายยาง 50 เมตร', CURDATE() - INTERVAL 2 DAY),
('expense', 6, 680.00, 'ยาฆ่าแมลง', CURDATE() - INTERVAL 1 DAY),
('expense', 7, 500.00, 'ค่าขนส่งปุ๋ย', CURDATE());

-- ===================================================
-- Views สำหรับวิเคราะห์ข้อมูล
-- ===================================================

-- View: สรุปรายจ่ายรายเดือน
CREATE OR REPLACE VIEW monthly_expenses AS
SELECT 
  DATE_FORMAT(date, '%Y-%m') as month,
  DATE_FORMAT(date, '%Y') as year,
  DATE_FORMAT(date, '%m') as month_number,
  SUM(amount) as total_amount,
  COUNT(*) as transaction_count,
  AVG(amount) as average_amount
FROM transactions
WHERE type = 'expense'
GROUP BY DATE_FORMAT(date, '%Y-%m')
ORDER BY month DESC;

-- View: สรุปรายจ่ายตามหมวดหมู่
CREATE OR REPLACE VIEW category_expenses AS
SELECT 
  c.id,
  c.name as category_name,
  c.color,
  SUM(t.amount) as total_amount,
  COUNT(t.id) as transaction_count,
  AVG(t.amount) as average_amount,
  MIN(t.date) as first_transaction,
  MAX(t.date) as last_transaction
FROM transactions t
JOIN categories c ON t.category_id = c.id
WHERE t.type = 'expense'
GROUP BY c.id, c.name, c.color
ORDER BY total_amount DESC;

-- View: รายการรายจ่ายล่าสุด
CREATE OR REPLACE VIEW recent_expenses AS
SELECT 
  t.id,
  t.date,
  c.name as category_name,
  c.color as category_color,
  t.amount,
  t.description,
  t.created_at
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.type = 'expense'
ORDER BY t.date DESC, t.created_at DESC
LIMIT 100;

-- View: สรุปรายจ่ายวันนี้
CREATE OR REPLACE VIEW today_expenses AS
SELECT 
  c.name as category_name,
  SUM(t.amount) as total_amount,
  COUNT(*) as transaction_count
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
WHERE t.type = 'expense' 
  AND t.date = CURDATE()
GROUP BY c.id, c.name
ORDER BY total_amount DESC;

-- ===================================================
-- Stored Procedures
-- ===================================================

DELIMITER //

-- Procedure: ดึงสรุปรายจ่ายตามช่วงเวลา
CREATE PROCEDURE GetExpenseSummary(
  IN start_date DATE,
  IN end_date DATE
)
BEGIN
  SELECT 
    SUM(amount) as total_expense,
    COUNT(*) as transaction_count,
    AVG(amount) as average_expense,
    MIN(amount) as min_expense,
    MAX(amount) as max_expense,
    MIN(date) as first_date,
    MAX(date) as last_date
  FROM transactions
  WHERE type = 'expense'
    AND date BETWEEN start_date AND end_date;
    
  -- รายละเอียดตามหมวดหมู่
  SELECT 
    c.name as category_name,
    c.color,
    SUM(t.amount) as total_amount,
    COUNT(*) as transaction_count
  FROM transactions t
  JOIN categories c ON t.category_id = c.id
  WHERE t.type = 'expense'
    AND t.date BETWEEN start_date AND end_date
  GROUP BY c.id, c.name, c.color
  ORDER BY total_amount DESC;
END //

-- Procedure: ดึงรายการรายจ่ายสูงสุด N อันดับแรก
CREATE PROCEDURE GetTopExpenses(
  IN limit_count INT
)
BEGIN
  SELECT 
    t.id,
    t.date,
    c.name as category_name,
    t.amount,
    t.description
  FROM transactions t
  LEFT JOIN categories c ON t.category_id = c.id
  WHERE t.type = 'expense'
  ORDER BY t.amount DESC
  LIMIT limit_count;
END //

-- Procedure: เพิ่มรายจ่ายใหม่
CREATE PROCEDURE AddExpense(
  IN p_category_id INT,
  IN p_amount DECIMAL(10,2),
  IN p_description TEXT,
  IN p_date DATE
)
BEGIN
  INSERT INTO transactions (type, category_id, amount, description, date)
  VALUES ('expense', p_category_id, p_amount, p_description, p_date);
  
  SELECT LAST_INSERT_ID() as new_id;
END //

DELIMITER ;

-- ===================================================
-- Functions
-- ===================================================

DELIMITER //

-- Function: คำนวณยอดรวมรายจ่ายของเดือน
CREATE FUNCTION GetMonthlyTotal(
  p_year INT,
  p_month INT
)
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE total DECIMAL(10,2);
  
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM transactions
  WHERE type = 'expense'
    AND YEAR(date) = p_year
    AND MONTH(date) = p_month;
    
  RETURN total;
END //

DELIMITER ;

-- ===================================================
-- Triggers
-- ===================================================

-- สร้างตาราง audit log ก่อน
CREATE TABLE IF NOT EXISTS transactions_deleted (
  id INT,
  type VARCHAR(10),
  category_id INT,
  amount DECIMAL(10,2),
  description TEXT,
  date DATE,
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Audit log for deleted transactions';

-- Trigger: Log เมื่อมีการลบรายการ
DELIMITER $$

CREATE TRIGGER before_transaction_delete
BEFORE DELETE ON transactions
FOR EACH ROW
BEGIN
  INSERT INTO transactions_deleted (id, type, category_id, amount, description, date)
  VALUES (OLD.id, OLD.type, OLD.category_id, OLD.amount, OLD.description, OLD.date);
END$$

DELIMITER ;

-- ===================================================
-- ตัวอย่างการใช้งาน
-- ===================================================

-- ดูสรุปรายเดือน
-- SELECT * FROM monthly_expenses;

-- ดูสรุปตามหมวดหมู่
-- SELECT * FROM category_expenses;

-- ดูรายการล่าสุด
-- SELECT * FROM recent_expenses;

-- ดูรายจ่ายวันนี้
-- SELECT * FROM today_expenses;

-- เรียกใช้ Procedure
-- CALL GetExpenseSummary('2024-12-01', '2024-12-31');
-- CALL GetTopExpenses(10);
-- CALL AddExpense(1, 800.00, 'ซื้อปุ๋ย', CURDATE());

-- เรียกใช้ Function
-- SELECT GetMonthlyTotal(2024, 12) as december_total;

-- ===================================================
-- สร้าง User สำหรับ Application (Optional)
-- ===================================================

-- CREATE USER IF NOT EXISTS 'garden_app'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON garden_expense.* TO 'garden_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ===================================================
-- Index สำหรับ Performance
-- ===================================================

-- Index เพิ่มเติมถ้าข้อมูลเยอะ
-- CREATE INDEX idx_created_at ON transactions(created_at);
-- CREATE INDEX idx_amount ON transactions(amount);

-- ===================================================
-- เสร็จสิ้น!
-- ===================================================

SELECT 
  '✅ Database created successfully!' as status,
  (SELECT COUNT(*) FROM categories) as categories_count,
  (SELECT COUNT(*) FROM transactions) as sample_transactions;
