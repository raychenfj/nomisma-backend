const merge = require('merge')
const fs = require('fs')
const uuid = require('uuid/v4')
const path = require('path')

// task status
const status = {
  PENDING: 'pending',
  COMPLETE: 'complete',
  FAILED: 'failed'
}

const defaultOptions = {
  interval: 500, // interval between two execution cycle, keep it under 1000 for accuracy
  tolerance: 2000, // since the javascript timeout is not accurate, we need some tolerance
  ignoreExpired: true, // execute the task or not if it is expired
  retry: { // pass false to disable retry
    max: 3, // max retry times
    interval: 5000, // interval between next retry
    /**
     * sometimes it will make sense to increase the interval when retry times increase
     * like the services is busy, need to reduce its payload
     * when it's true, the actual retry interval should be retry time * interval
     */
    extendInterval: true
  },
  executor (task) { // how to execute the task
    console.info('executing task:', task)
    return Promise.resolve()
  },
  persist (tasks) { // persist the tasks in case the services is down
    fs.writeFileSync(path.resolve(__dirname, './tasks.json'), JSON.stringify({ tasks }))
  },
  restore () { // restore the tasks from your backup
    const object = JSON.parse(fs.readFileSync(path.resolve(__dirname, './tasks.json')))
    if (object && object.tasks) {
      return object.tasks
    }
    return []
  }
}

class Schedule {
  constructor (options) {
    this.options = merge(true, defaultOptions, options)
    if (typeof this.options.executor !== 'function') {
      throw new Error('executor must be a function')
    }
    this.tasks = []
    this.timer = null
  }

  /**
   * start schedule
   */
  exec () {
    let updated = false
    const promises = []
    const now = new Date().valueOf()
    this.tasks.forEach(async (task) => {
      if (task.status === status.PENDING &&
        (task.immediate ||
          Math.abs(task.timestamp - now) <= this.options.tolerance ||
          (!this.options.ignoreExpired && task.timestamp < now))) {
        updated = true

        const promise = this.options.executor(task)
        promises.push(
          promise // use promise here so that all task can be execute parallelly
            .then(() => {
              task.status = status.COMPLETE
            })
            .catch(e => {
              // retry the task or set its status to failed
              const retry = this.options.retry
              if (!retry) {
                task.status = status.FAILED
                return
              }
              if (task.retry < retry.max) {
                task.retry++
                if (!task.immediate && task.timestamp) {
                  task.timestamp += retry.extendInterval ? retry.interval * task.retry : retry.interval
                }
              } else {
                task.status = status.FAILED
              }
            })
        )
      }
    })

    // wait util all tasks are executed
    return Promise.all(promises).then(() => {
      if (updated) {
        this.updateTasks(this.tasks)
      }
      /**
       * about why use recursion setTimeout instead of setInterval
       * setInterval doesn't care whether the callback is still running or not
       * the function might need longer than the interval time to finish execution
       * so you end up with multiple functions in the stack
       */
      this.timer = setTimeout(() => this.exec(), this.options.interval)
      return Promise.resolve()
    })
  }

  /**
   * suspend the schedule
   */
  suspend () {
    clearTimeout(this.timer)
  }

  /**
   * remove all tasks
   */
  clear () {
    this.updateTasks([])
  }

  /**
   * update tasks and then persist them
   */
  updateTasks (tasks) {
    this.tasks = tasks
    this.persist(this.tasks)
  }

  /**
   * add a task to the queue
   */
  addTask (task) {
    if (!task) return
    task.id = uuid()
    task.status = status.PENDING
    task.retry = 0
    // immediate will be true if timestamp is not defined
    // if immediate is true, the task will be execute in next cycle
    task.immediate = task.immediate || !task.timestamp
    this.tasks.push(task)
    this.updateTasks(this.tasks)
  }

  /**
   * list all tasks
   */
  listTasks () {
    return this.tasks
  }

  /**
   * persist the tasks
  */
  async persist () {
    if (this.options.persist && typeof this.options.persist === 'function') {
      return this.options.persist(this.tasks)
    }
  }

  /**
   * restore tasks from backup
   */
  async restore () {
    this.updateTasks(await this.options.restore())
    return Promise.resolve()
  }
}

module.exports = Schedule
