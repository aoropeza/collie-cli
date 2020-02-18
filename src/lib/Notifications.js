'use strict'

const AWS = require('aws-sdk')

const Logger = require('../logger')

const logger = new Logger('collie:cli:Notifications')

AWS.config.update({ region: 'us-east-1' })
const sns = new AWS.SNS()

class Notifications {
  message(value) {
    this._message = value
    return this
  }

  subject(value) {
    this._subject = value
    return this
  }

  channel(value) {
    this._channel = value
    return this
  }

  async build() {
    const params = {
      Message: this._message,
      Subject: this._subject,
      TopicArn: this._channel
    }

    try {
      const result = await sns.publish(params).promise()
      logger.info(result)
    } catch (error) {
      logger.error(error.stack)
    }
  }

  static async publish(subject, message) {
    const noti = new Notifications()
    await noti
      .message(message)
      .subject(subject)
      .channel(process.env.CHANNEL)
      .build()
  }
}

module.exports = { Notifications }
