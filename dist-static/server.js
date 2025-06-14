#!/usr/bin/env node

const express = require('express')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')))

// SPA路由支持
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html')
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(404).send('Index file not found')
  }
})

app.listen(PORT, HOST, () => {
  console.log(`🚀 记账数据导入工具服务器启动成功!`)
  console.log(`📍 访问地址: http://${HOST}:${PORT}`)
  console.log(`🕐 启动时间: ${new Date().toLocaleString('zh-CN')}`)
  console.log(`📊 进程ID: ${process.pid}`)
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n🛑 收到SIGTERM信号，正在关闭服务器...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\n🛑 收到SIGINT信号，正在关闭服务器...')
  process.exit(0)
})
