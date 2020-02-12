'use strict'

const AWS = require('aws-sdk')

const logger = require('../logger')('collie:cli:Notifications')

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
      logger.info(`Notification sent succesfully: ${JSON.stringify(result)}`)
    } catch (error) {
      logger.error(`Notification error: ${JSON.stringify(error)}`)
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
