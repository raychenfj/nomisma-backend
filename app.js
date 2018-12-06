const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const rfs = require('rotating-file-stream')
const fs = require('fs')
const cors = require('cors')

const tasksRouter = require('./routes/tasks')

const app = express()

app.use(cors())

const logDirectory = path.join(__dirname, 'logs')
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)
const accessLogStream = rfs('access.log', {
  interval: '1d', // rotate daily
  path: logDirectory,
  maxFiles: 30,
  size: '10M',
  maxSize: '50M'
})
app.use(logger('common', { stream: accessLogStream }))
app.use(logger('common'))

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/v1/', tasksRouter)

app.use(function (e, req, res, next) {
  if (e) {
    console.error(e)
    res.status(500).send(e.message)
  }
})

module.exports = app
