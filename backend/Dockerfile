# 使用 Node.js 16 作为基础镜像（稳定可靠）
FROM docker.io/library/node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制配置文件并安装依赖（合并命令减少镜像层数）
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm install --production

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "app.js"]