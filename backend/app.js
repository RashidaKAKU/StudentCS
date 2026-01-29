const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
// 静态文件服务，提供前端页面
app.use(express.static('./frontend'));

// 根路径重定向到前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './frontend/index.html'));
});

// 学生管理 API

// 获取所有学生
app.get('/api/students', (req, res) => {
  const { page = 1, limit = 10, name, course_package } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM students';
  const params = [];

  if (name) {
    query += ' WHERE name LIKE ?';
    params.push(`%${name}%`);
  }

  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, students) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(students);
  });
});

// 添加学生
app.post('/api/students', (req, res) => {
  const { name, nickname, parent_contact, phone } = req.body;
  if (!name) {
    return res.status(400).json({ error: '学生姓名不能为空' });
  }

  db.run('INSERT INTO students (name, nickname, parent_contact, phone) VALUES (?, ?, ?, ?)', 
    [name, nickname, parent_contact, phone], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, name, nickname, parent_contact, phone });
  });
});

// 编辑学生
app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { name, nickname, parent_contact, phone } = req.body;

  db.run('UPDATE students SET name = ?, nickname = ?, parent_contact = ?, phone = ? WHERE id = ?', 
    [name, nickname, parent_contact, phone, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '学生不存在' });
    }
    res.json({ id, name, nickname, parent_contact, phone });
  });
});

// 删除学生
app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;

  // 开始事务处理
  db.serialize(() => {
    // 1. 删除学生的消课记录
    db.run('DELETE FROM consumption_records WHERE student_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: '删除消课记录失败: ' + err.message });
      }
      
      // 2. 删除学生的课程包关联记录
      db.run('DELETE FROM student_course_packages WHERE student_id = ?', [id], (err) => {
        if (err) {
          return res.status(500).json({ error: '删除学生课程包关联失败: ' + err.message });
        }
        
        // 3. 删除学生
        db.run('DELETE FROM students WHERE id = ?', [id], function(err) {
          if (err) {
            return res.status(500).json({ error: '删除学生失败: ' + err.message });
          }
          
          if (this.changes === 0) {
            return res.status(404).json({ error: '学生不存在' });
          }
          
          res.json({ message: '学生删除成功，相关消课记录和课程包关联已同步删除' });
        });
      });
    });
  });
});

// 获取学生课程包详情
app.get('/api/students/:id/course-packages', (req, res) => {
  const { id } = req.params;

  db.all(`
    SELECT scp.*, cp.name as package_name, cp.course_type, cp.total_hours 
    FROM student_course_packages scp
    JOIN course_packages cp ON scp.course_package_id = cp.id
    WHERE scp.student_id = ?
  `, [id], (err, coursePackages) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(coursePackages);
  });
});

// 课程包管理 API

// 获取所有课程包
app.get('/api/course-packages', (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  db.all('SELECT * FROM course_packages LIMIT ? OFFSET ?', [parseInt(limit), parseInt(offset)], (err, coursePackages) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(coursePackages);
  });
});

// 添加课程包
app.post('/api/course-packages', (req, res) => {
  const { name, total_hours, course_type, price } = req.body;
  if (!name || !total_hours || !course_type) {
    return res.status(400).json({ error: '课程包名称、总课时和课程类型不能为空' });
  }

  db.run('INSERT INTO course_packages (name, total_hours, course_type, price) VALUES (?, ?, ?, ?)', 
    [name, total_hours, course_type, price], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, name, total_hours, course_type, price });
  });
});

// 编辑课程包
app.put('/api/course-packages/:id', (req, res) => {
  const { id } = req.params;
  const { name, total_hours, course_type, price } = req.body;

  db.run('UPDATE course_packages SET name = ?, total_hours = ?, course_type = ?, price = ? WHERE id = ?', 
    [name, total_hours, course_type, price, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '课程包不存在' });
    }
    res.json({ id, name, total_hours, course_type, price });
  });
});

// 删除课程包
app.delete('/api/course-packages/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM course_packages WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '课程包不存在' });
    }
    res.json({ message: '课程包删除成功' });
  });
});

// 获取所有学生课程包关联
app.get('/api/student-course-packages', (req, res) => {
  const { page = 1, limit = 100 } = req.query;
  const offset = (page - 1) * limit;

  db.all(`SELECT * FROM student_course_packages LIMIT ? OFFSET ?`, 
    [parseInt(limit), parseInt(offset)], (err, studentCoursePackages) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(studentCoursePackages);
  });
});

// 分配课程包给学生
app.post('/api/student-course-packages', (req, res) => {
  const { student_id, course_package_id, remaining_hours, start_date, end_date } = req.body;

  // 获取课程包总课时作为默认剩余课时
  db.get('SELECT total_hours FROM course_packages WHERE id = ?', [course_package_id], (err, coursePackage) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const hours = remaining_hours || coursePackage.total_hours;

    db.run('INSERT INTO student_course_packages (student_id, course_package_id, remaining_hours, start_date, end_date) VALUES (?, ?, ?, ?, ?)', 
      [student_id, course_package_id, hours, start_date, end_date], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id: this.lastID, student_id, course_package_id, remaining_hours: hours, start_date, end_date });
    });
  });
});

// 活动规则管理 API

// 获取所有活动规则
app.get('/api/activity-rules', (req, res) => {
  db.all('SELECT * FROM activity_rules', (err, activityRules) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(activityRules);
  });
});

// 添加活动规则
app.post('/api/activity-rules', (req, res) => {
  const { name, course_type, days, total_hours } = req.body;
  if (!name || !course_type || !days || !total_hours) {
    return res.status(400).json({ error: '活动名称、课程类型、天数和总课时不能为空' });
  }

  // 自动计算每节课课时，保留一位小数
  const hours_per_class = Math.round((total_hours / days) * 10) / 10;

  db.run('INSERT INTO activity_rules (name, course_type, days, total_hours, hours_per_class) VALUES (?, ?, ?, ?, ?)', 
    [name, course_type, days, total_hours, hours_per_class], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, name, course_type, days, total_hours, hours_per_class });
  });
});

// 编辑活动规则
app.put('/api/activity-rules/:id', (req, res) => {
  const { id } = req.params;
  const { name, course_type, days, total_hours } = req.body;
  
  if (!name || !course_type || !days || !total_hours) {
    return res.status(400).json({ error: '活动名称、课程类型、天数和总课时不能为空' });
  }
  
  // 自动计算每节课课时，保留一位小数
  const hours_per_class = Math.round((total_hours / days) * 10) / 10;
  
  db.run('UPDATE activity_rules SET name = ?, course_type = ?, days = ?, total_hours = ?, hours_per_class = ? WHERE id = ?', 
    [name, course_type, days, total_hours, hours_per_class, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '活动规则不存在' });
    }
    res.json({ id, name, course_type, days, total_hours, hours_per_class });
  });
});

// 删除活动规则
app.delete('/api/activity-rules/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM activity_rules WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '活动规则不存在' });
    }
    res.json({ message: '活动规则删除成功' });
  });
});

// 消课管理 API

// 批量消课
app.post('/api/consume', (req, res) => {
  const { student_ids, activity_id, remark, hours_consumed, consume_date } = req.body;
  if (!student_ids || student_ids.length === 0) {
    return res.status(400).json({ error: '学生ID不能为空' });
  }

  // 确定消耗课时，如果前端未提供则从活动规则获取，否则使用前端提供的值
  let final_hours_consumed = hours_consumed;
  
  // 如果前端未提供消耗课时，则从活动规则获取
  if (isNaN(final_hours_consumed) || final_hours_consumed <= 0) {
    // 获取活动规则，计算消耗课时
    db.get('SELECT hours_per_class, course_type FROM activity_rules WHERE id = ?', [activity_id], (err, activity) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      final_hours_consumed = activity ? activity.hours_per_class : 1; // 默认消耗1课时
      processConsumption(activity ? activity.course_type : null);
    });
  } else {
    // 如果前端已提供消耗课时，获取活动规则的课程类型
    db.get('SELECT course_type FROM activity_rules WHERE id = ?', [activity_id], (err, activity) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      processConsumption(activity ? activity.course_type : null);
    });
  }

  // 处理消课逻辑
  function processConsumption(course_type) {
    // 使用前端提供的日期或当前时间
    const consumeDateTime = consume_date ? new Date(consume_date) : new Date();
    
    // 处理每个学生的消课
    let processedCount = 0;
    const results = { success: [], failed: [] };
    
    student_ids.forEach(student_id => {
      // 获取学生的课程包，按剩余课时升序排序，优先消耗剩余课时少的
      let query = `
        SELECT scp.*, cp.course_type 
        FROM student_course_packages scp
        JOIN course_packages cp ON scp.course_package_id = cp.id
        WHERE scp.student_id = ? AND scp.remaining_hours > 0
      `;
      const params = [student_id];
      
      // 如果有课程类型，只考虑对应课程类型的课程包
      if (course_type) {
        query += ' AND cp.course_type = ?';
        params.push(course_type);
      }
      
      query += ' ORDER BY scp.remaining_hours ASC LIMIT 1';
      
      db.get(query, params, (err, coursePackage) => {
        if (err) {
          console.error('Error getting course packages:', err.message);
          results.failed.push(student_id);
          processedCount++;
        } else if (!coursePackage) {
          // 没有可用的课程包
          results.failed.push(student_id);
          processedCount++;
        } else {
          // 更新学生剩余课时
          db.run('UPDATE student_course_packages SET remaining_hours = remaining_hours - ? WHERE id = ? AND remaining_hours >= ?', 
            [final_hours_consumed, coursePackage.id, final_hours_consumed], function(err) {
            if (err) {
              console.error('Error updating remaining hours:', err.message);
              results.failed.push(student_id);
            } else if (this.changes > 0) {
              // 记录消课，包含日期信息
              db.run('INSERT INTO consumption_records (student_id, course_package_id, activity_id, hours_consumed, remark, consume_date) VALUES (?, ?, ?, ?, ?, ?)', 
                [student_id, coursePackage.course_package_id, activity_id, final_hours_consumed, remark, consumeDateTime.toISOString()], function(err) {
                if (err) {
                  console.error('Error creating consumption record:', err.message);
                  // 消课记录创建失败，但课时已经扣除，这里需要考虑是否回滚
                }
                results.success.push(student_id);
                processedCount++;
                checkComplete();
              });
            } else {
              // 剩余课时不足
              results.failed.push(student_id);
              processedCount++;
              checkComplete();
            }
          });
        }
        
        if (err || !coursePackage) {
          checkComplete();
        }
      });
    });
    
    function checkComplete() {
      if (processedCount === student_ids.length) {
        res.json({
          message: '消课处理完成',
          hours_consumed: final_hours_consumed,
          success_count: results.success.length,
          failed_count: results.failed.length,
          success_students: results.success,
          failed_students: results.failed
        });
      }
    }
  }
});

// 消课记录 API

// 获取所有消课记录
app.get('/api/consumption-records', (req, res) => {
  const { page = 1, limit = 10, student_name, course_package } = req.query;
  const offset = (page - 1) * limit;
  let query = `
    SELECT cr.*, s.name as student_name, cp.name as package_name, ar.name as activity_name 
    FROM consumption_records cr
    JOIN students s ON cr.student_id = s.id
    JOIN course_packages cp ON cr.course_package_id = cp.id
    LEFT JOIN activity_rules ar ON cr.activity_id = ar.id
  `;
  const params = [];
  let whereClause = '';

  if (student_name) {
    whereClause += ` WHERE s.name LIKE ?`;
    params.push(`%${student_name}%`);
  }
  
  if (course_package) {
    if (whereClause) {
      whereClause += ` AND cp.id = ?`;
    } else {
      whereClause += ` WHERE cp.id = ?`;
    }
    params.push(parseInt(course_package));
  }

  query += whereClause + ' ORDER BY cr.consume_date DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, records) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(records);
  });
});

// 撤销消课记录
app.delete('/api/consumption-records/:id', (req, res) => {
  const { id } = req.params;

  // 获取消课记录详情
  db.get('SELECT * FROM consumption_records WHERE id = ?', [id], (err, record) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!record) {
      return res.status(404).json({ error: '消课记录不存在' });
    }

    // 恢复剩余课时
    db.run('UPDATE student_course_packages SET remaining_hours = remaining_hours + ? WHERE student_id = ? AND course_package_id = ?', 
      [record.hours_consumed, record.student_id, record.course_package_id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // 删除消课记录
      db.run('DELETE FROM consumption_records WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: '消课记录已撤销' });
      });
    });
  });
});

// 统计功能 API

// 获取统计数据
app.get('/api/stats', (req, res) => {
  const stats = {};

  // 获取学生总数
  db.get('SELECT COUNT(*) as count FROM students', (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    stats.total_students = result.count;

    // 获取课程包总数
    db.get('SELECT COUNT(*) as count FROM course_packages', (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      stats.total_course_packages = result.count;

      // 获取消课记录总数
      db.get('SELECT COUNT(*) as count FROM consumption_records', (err, result) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        stats.total_consumption_records = result.count;
        res.json(stats);
      });
    });
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});