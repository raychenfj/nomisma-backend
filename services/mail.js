const sgMail = require('@sendgrid/mail')
const config = require('../config')
const SparkPost = require('sparkpost')

sgMail.setApiKey(config.sendGridApiKey)
const sparky = new SparkPost(config.sparkPostApiKey)

const from = 'code-challenge@raychenfj.me'

module.exports = {
  /**
   * send
   * when one email service fails, it will fallback to another
   */
  send (subject, content, to) {
    return this.sendViaSparkPost(subject, content, to)
      .catch((e) => {
        return this.sendViaSendGrid(subject, content, to)
      })
  },
  /**
   * sendViaSendGrid
   */
  sendViaSendGrid (subject, content, to) {
    const msg = {
      to,
      from,
      subject,
      text: content
    }

    return sgMail.send(msg)
  },
  /**
   * sendViaSparkPost
   */
  sendViaSparkPost (subject, content, to) {
    return sparky.transmissions.send({
      options: { sandbox: false },
      content: {
        from,
        subject,
        html: content
      },
      recipients: [ { address: to } ]
    })
  }
}
