'use strict'

const nodemailer = require('nodemailer')
const AWS = require('aws-sdk')

const { Logger } = require('../logger')
const { Config } = require('../config')

const logger = new Logger('collie:cli:Notifications', 0, [255, 128, 0])
const config = new Config()

AWS.config.update({ region: 'us-east-1' })

const transporter = nodemailer.createTransport({
  SES: new AWS.SES()
})

class Notifications {
  message(value) {
    this._message = value
    return this
  }

  subject(value) {
    this._subject = value
    return this
  }

  from(value) {
    this._from = value
    return this
  }

  to(value) {
    this._to = value
    return this
  }

  logPath(value) {
    this._logPath = value
    return this
  }

  async build() {
    // TopicArn: this._channel
    const params = {
      from: this._from,
      to: this._to,
      subject: this._subject,
      text: this._message,
      attachments: this._logPath
        ? [
            {
              filename: 'log.txt',
              path: this._logPath
            }
          ]
        : []
    }

    try {
      const result = await transporter.sendMail(params)
      logger.info(result.messageId)
    } catch (error) {
      logger.error(error.stack)
    }
  }

  static async publishSuccess(message, logPath) {
    const noti = new Notifications()
    await noti
      .message(message)
      .logPath(logPath)
      .subject(
        `CollieCli: Success (${config.get('variables.env')}-${config.get(
          'variables.environment_running'
        )})`
      )
      .from(config.get('variables.privates.from_notifications'))
      .to(config.get('variables.privates.to_notifications'))
      .build()
  }

  static async publishError(message, logPath) {
    const noti = new Notifications()
    await noti
      .message(message)
      .logPath(logPath)
      .subject(
        ` CollieCli: Error (${config.get('variables.env')}-${config.get(
          'variables.environment_running'
        )})`
      )
      .from(config.get('variables.privates.from_notifications'))
      .to(config.get('variables.privates.to_notifications'))
      .build()
  }

  static async publish(message, logPath) {
    const noti = new Notifications()
    await noti
      .message(message)
      .logPath(logPath)
      .subject(
        ` CollieCli: (${config.get('variables.env')}-${config.get(
          'variables.environment_running'
        )})`
      )
      .from(config.get('variables.privates.from_notifications'))
      .to(config.get('variables.privates.to_notifications'))
      .build()
  }
}

module.exports = { Notifications }
