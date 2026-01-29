const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const dbPath = path.join(__dirname, 'students.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeDatabase();
  }
});

// 初始化数据库表结构
function initializeDatabase() {
  // 创建学生表（包含所有必要字段，避免后续ALTER TABLE操作）
  db.run(`CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    nickname TEXT DEFAULT '',
    parent_contact TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating students table:', err.message);
    }
  });

  // 创建课程包表
  db.run(`CREATE TABLE IF NOT EXISTS course_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    total_hours INTEGER NOT NULL,
    course_type TEXT NOT NULL,
    price REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating course_packages table:', err.message);
    }
  });

  // 创建学生课程包关联表
  db.run(`CREATE TABLE IF NOT EXISTS student_course_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_package_id INTEGER NOT NULL,
    remaining_hours INTEGER NOT NULL,
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_package_id) REFERENCES course_packages(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating student_course_packages table:', err.message);
    }
  });

  // 创建活动规则表（hours_per_class使用REAL类型支持小数）
  db.run(`CREATE TABLE IF NOT EXISTS activity_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    course_type TEXT NOT NULL,
    days INTEGER NOT NULL,
    total_hours INTEGER NOT NULL,
    hours_per_class REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Error creating activity_rules table:', err.message);
    }
  });

  // 创建消课记录表（hours_consumed使用REAL类型支持小数）
  db.run(`CREATE TABLE IF NOT EXISTS consumption_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_package_id INTEGER NOT NULL,
    activity_id INTEGER,
    hours_consumed REAL NOT NULL,
    consume_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    remark TEXT,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_package_id) REFERENCES course_packages(id),
    FOREIGN KEY (activity_id) REFERENCES activity_rules(id)
  )`, (err) => {
    if (err) {
      console.error('Error creating consumption_records table:', err.message);
    }
  });
}

module.exports = db;