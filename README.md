# 学员消课管理系统

## 项目简介

学员消课管理系统是一个用于管理学员课程消耗的Web应用，主要功能包括学员管理、课程包管理、活动规则管理、消课记录管理以及统计功能。系统设计简洁高效，支持多种部署方式，适合教育培训机构使用。

## 功能特性

### 1. 学员管理
- 添加、编辑、删除学员信息
- 支持昵称和联系方式管理
- 查看学员课程包详情
- 按姓名或课程类型筛选学员
- 支持分页显示

### 2. 课程包管理
- 添加、编辑、删除课程包
- 分配课程包给学员
- 查看课程包详情
- 支持分页显示

### 3. 活动规则管理
- 添加、编辑、删除活动规则
- 自动计算每节课课时
- 支持多种课程类型

### 4. 消课管理
- 批量消课功能
- 按课程类型选择学员
- 支持选择活动，自动计算消耗课时
- 优先消耗剩余课时较少的课程包
- 支持添加备注
- 显示学生剩余课时

### 5. 消课记录管理
- 查看所有消课记录
- 按学生姓名和课程包筛选记录
- 撤销消课记录（自动恢复剩余课时）
- 支持分页显示

### 6. 统计功能
- 显示总学生数
- 显示总课程包数
- 显示总消课记录数

## 技术栈

### 前端
- HTML5 + CSS3 + JavaScript
- 原生JavaScript，无框架依赖
- 响应式设计，支持移动端

### 后端
- Node.js 16+
- Express.js
- SQLite 数据库
- RESTful API 设计

### 部署
- 支持直接运行（Node.js）
- 支持 Docker 部署
- 支持 Docker Compose 编排

## 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   浏览器        │    │   后端服务      │    │   SQLite 数据库 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ HTTP 请求            │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                                 │ API 调用
                                 │
┌─────────────────┐    ┌─────────┴───────┐    ┌─────────────────┐
│ 前端页面        │    │   业务逻辑层    │    │   数据访问层    │
│ (index.html)    │    │   (app.js)      │    │   (db.js)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 快速开始

### 环境要求

#### 选项 1: 使用 Node.js 直接运行
- Node.js 16+
- npm 8+

#### 选项 2: 使用 Docker 运行
- Docker 20+
- Docker Compose 2+

### 运行方式

#### 方式 1: 使用 Node.js 直接运行

1. **启动后端服务**
   ```bash
   # 进入后端目录
   cd backend
   
   # 安装依赖
   npm install
   
   # 启动服务
   npm start
   ```
   
   后端服务将在 `http://localhost:3000` 启动。

2. **访问前端页面**
   
   直接在浏览器中打开 `frontend/index.html` 文件即可访问前端页面。

#### 方式 2: 使用 Docker 运行

1. **构建并启动所有服务**
   ```bash
   # 在项目根目录执行
   docker-compose up -d --build
   ```

2. **访问应用**
   - 前端页面: `http://localhost:8889`
   - 后端 API: `http://localhost:3000/api`

3. **停止服务**
   ```bash
   docker-compose down
   ```

## API 端点

### 学生管理
- `GET /api/students` - 获取学生列表
- `POST /api/students` - 添加学生
- `PUT /api/students/:id` - 编辑学生
- `DELETE /api/students/:id` - 删除学生
- `GET /api/students/:id/course-packages` - 获取学生课程包详情

### 课程包管理
- `GET /api/course-packages` - 获取课程包列表
- `POST /api/course-packages` - 添加课程包
- `PUT /api/course-packages/:id` - 编辑课程包
- `DELETE /api/course-packages/:id` - 删除课程包
- `POST /api/student-course-packages` - 分配课程包给学生

### 活动规则管理
- `GET /api/activity-rules` - 获取活动规则列表
- `POST /api/activity-rules` - 添加活动规则
- `PUT /api/activity-rules/:id` - 编辑活动规则
- `DELETE /api/activity-rules/:id` - 删除活动规则

### 消课管理
- `POST /api/consume` - 批量消课

### 消课记录
- `GET /api/consumption-records` - 获取消课记录
- `DELETE /api/consumption-records/:id` - 撤销消课记录

### 统计功能
- `GET /api/stats` - 获取统计数据

## 数据库结构

系统使用 SQLite 数据库，数据库文件将自动创建在 `backend/students.db`。

### 表结构

1. **students** - 学生信息
   - id: 学生ID
   - name: 学生姓名
   - nickname: 学生昵称
   - parent_contact: 联系方式
   - phone: 手机号
   - created_at: 创建时间

2. **course_packages** - 课程包信息
   - id: 课程包ID
   - name: 课程包名称
   - total_hours: 总课时
   - course_type: 课程类型
   - price: 价格
   - created_at: 创建时间

3. **student_course_packages** - 学生课程包关联
   - id: 关联ID
   - student_id: 学生ID
   - course_package_id: 课程包ID
   - remaining_hours: 剩余课时
   - start_date: 开始日期
   - end_date: 结束日期

4. **activity_rules** - 活动规则
   - id: 规则ID
   - name: 活动名称
   - course_type: 课程类型
   - days: 天数
   - total_hours: 总课时
   - hours_per_class: 每节课课时
   - created_at: 创建时间

5. **consumption_records** - 消课记录
   - id: 记录ID
   - student_id: 学生ID
   - course_package_id: 课程包ID
   - activity_id: 活动ID
   - hours_consumed: 消耗课时
   - consume_date: 消课日期
   - remark: 备注

## 开发说明

### 项目结构

```
student-course-system/
├── backend/             # 后端代码
│   ├── app.js          # 主应用文件
│   ├── db.js           # 数据库连接和初始化
│   ├── package.json    # 依赖配置
│   ├── Dockerfile      # Docker构建文件
│   └── .dockerignore   # Docker忽略文件
├── frontend/            # 前端代码
│   └── index.html      # 单页面应用
├── docker-compose.yml   # Docker Compose配置
└── README.md           # 项目文档
```

### 开发流程

1. 克隆项目到本地
2. 安装依赖（仅开发阶段）
3. 启动开发服务器
4. 进行开发和测试
5. 构建和部署

## 部署说明

### 生产环境部署

#### 1. 使用 Node.js 部署

```bash
# 安装依赖
cd backend
npm install --production

# 启动服务
npm start
```

#### 2. 使用 Docker 部署

```bash
docker-compose up -d --build
```

### 环境变量

系统支持以下环境变量：

- `PORT`: 后端服务端口（默认：3000）

可以通过 `.env` 文件或命令行设置环境变量。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址：https://github.com/yourusername/student-course-system
