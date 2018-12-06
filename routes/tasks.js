const express = require('express')
const router = express.Router()
const Schedule = require('../schedule')
const mailService = require('../services/mail')

const schedule = new Schedule({
  executor: (task) => {
    return mailService.send(task.subject, task.content, task.to)
  }
})

schedule.restore().then(() =>
  schedule.exec()
)

function validate (task) {
  const rules = {
    timestamp: {require: true},
    subject: {require: true},
    content: {require: true},
    to: {require: true}
  }

  Object.keys(rules).forEach(key => {
    if (rules[key].require && !task[key]) {
      throw new Error(`${key} is require`)
    }
  })
}

/* get the list of tasks */
router.get('/tasks', function (req, res, next) {
  res.send(schedule.listTasks())
})

/* create new task */
router.post('/tasks', function (req, res, next) {
  const task = {...req.body}
  task.timestamp = new Date(req.body.timestamp).valueOf()
  try {
    validate(task)
    schedule.addTask(task)
    res.send('schedule task successfully')
  } catch (e) {
    next(e)
  }
})

module.exports = router
