const expect = require('chai').expect
const Schedule = require('../schedule')
const path = require('path')
const fs = require('fs')
const dayjs = require('dayjs')

const status = {
  PENDING: 'pending',
  COMPLETE: 'complete',
  FAILED: 'failed'
}

describe('schedule', function () {
  describe('constructor', function () {
    it('should create an instance', function () {
      const schedule = new Schedule({
        persist () {}
      })

      expect(schedule).to.be.an.instanceOf(Schedule)
    })
  })

  describe('schedule.addTask', function () {
    it('should add a task', function () {
      const task = {
        timestamp: new Date().valueOf()
      }
      const schedule = new Schedule({
        persist () {}
      })

      schedule.addTask(task)

      expect(schedule.tasks.length).to.equal(1)
    })

    it('should return if task is missing', function () {
      const schedule = new Schedule({
        persist () {}
      })

      schedule.addTask()

      expect(schedule.tasks.length).to.equal(0)
    })
  })

  describe('schedule.restore', function () {
    it('should restore tasks', function (done) {
      const schedule = new Schedule({
        restore () {
          const object = JSON.parse(fs.readFileSync(path.resolve(__dirname, './tasks.json')))
          if (object && object.tasks) {
            return object.tasks
          }
          return []
        },
        persist () {}
      })

      schedule.restore().then(() => {
        expect(schedule.tasks.length).to.equal(3)
        done()
      })
    })
  })

  describe('schedule.clear', function () {
    it('should clear tasks', function () {
      const task = {
        timestamp: new Date().valueOf()
      }
      const schedule = new Schedule({
        persist () {}
      })
      schedule.addTask(task)

      schedule.clear()

      expect(schedule.tasks.length).to.equal(0)
    })
  })

  describe('schedule.exec', function () {
    it('should be execute task immediately', function (done) {
      const task = { immediate: true, timestamp: dayjs().add(10, 'second').toDate().valueOf() }
      const schedule = new Schedule({
        persist () {}
      })
      schedule.addTask(task)

      schedule.exec().then(() => {
        schedule.suspend()
        expect(task.status).to.equal(status.COMPLETE)
        done()
      })
    })

    it('should execute expired task', function (done) {
      const task = { timestamp: dayjs().subtract(5, 'second').toDate().valueOf() }
      const schedule = new Schedule({
        ignoreExpired: false,
        persist () {}
      })
      schedule.addTask(task)

      schedule.exec().then(() => {
        schedule.suspend()
        expect(task.status).to.equal(status.COMPLETE)
        done()
      })
    })

    it('should execute a normal task', function (done) {
      this.timeout(5000)
      const task = { timestamp: dayjs().add(2, 'second').toDate().valueOf() }
      const schedule = new Schedule({
        persist () {}
      })
      schedule.addTask(task)

      schedule.exec()

      setTimeout(() => {
        schedule.suspend()
        expect(task.status).to.equal(status.COMPLETE)
        done()
      }, 3000)
    })

    it('should retry a task 2 times', function (done) {
      this.timeout(5000)
      const task = { timestamp: dayjs().add(1, 'second').toDate().valueOf() }
      const schedule = new Schedule({
        executor (task) {
          if (task.retry === 2) {
            return Promise.resolve()
          }
          return Promise.reject(new Error('some error'))
        },
        persist () {},
        retry: {
          max: 3,
          interval: 500,
          extendInterval: false
        }
      })
      schedule.addTask(task)

      schedule.exec()

      setTimeout(() => {
        schedule.suspend()
        expect(task.retry).to.equal(2)
        expect(task.status).to.equal(status.COMPLETE)
        done()
      }, 4000)
    })

    it('should fail after retry', function (done) {
      this.timeout(5000)
      const task = { timestamp: dayjs().add(1, 'second').toDate().valueOf() }
      const schedule = new Schedule({
        executor (task) {
          return Promise.reject(new Error('some error'))
        },
        persist () {},
        retry: {
          max: 1,
          interval: 500,
          extendInterval: false
        }
      })
      schedule.addTask(task)

      schedule.exec()

      setTimeout(() => {
        schedule.suspend()
        expect(task.retry).to.equal(1)
        expect(task.status).to.equal(status.FAILED)
        done()
      }, 4000)
    })

    it('should fail directly', function (done) {
      const task = { timestamp: dayjs().add(1, 'second').toDate().valueOf() }
      const schedule = new Schedule({
        persist () {},
        executor (task) {
          return Promise.reject(new Error('some error'))
        },
        retry: false
      })
      schedule.addTask(task)

      schedule.exec().then(() => {
        schedule.suspend()
        expect(task.retry).to.equal(0)
        expect(task.status).to.equal(status.FAILED)
        done()
      })
    })

    it('should extend retry interval', function (done) {
      this.timeout(5000)
      const timestamp = dayjs().add(1, 'second').toDate().valueOf()
      const task = { timestamp }
      const schedule = new Schedule({
        persist () {},
        executor (task) {
          return Promise.reject(new Error('some error'))
        },
        retry: {
          max: 2,
          interval: 500,
          extendInterval: true
        }
      })
      schedule.addTask(task)

      schedule.exec()

      setTimeout(() => {
        schedule.suspend()
        expect(task.timestamp).to.equal(timestamp + 1500)
        expect(task.status).to.equal(status.FAILED)
        done()
      }, 4000)
    })
  })
})
