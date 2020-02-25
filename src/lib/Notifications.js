'use strict'

const AWS = require('aws-sdk')

const { Logger } = require('../logger')
const { Config } = require('../config')

const logger = new Logger('collie:cli:Notifications', 0, [255, 128, 0])
const config = new Config()

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

  static async publishSuccess(message) {
    const noti = new Notifications()
    await noti
      .message(message)
      .subject(
        `CollieCli: Success (${config.get('variables.env')}-${config.get(
          'variables.environment_running'
        )})`
      )
      .channel(config.get('variables.privates.channel_notifications'))
      .build()
  }

  static async publishError(message) {
    const noti = new Notifications()
    await noti
      .message(message)
      .subject(
        ` CollieCli: Error (${config.get('variables.env')}-${config.get(
          'variables.environment_running'
        )})`
      )
      .channel(config.get('variables.privates.channel_notifications'))
      .build()
  }

  static async publish(message) {
    const noti = new Notifications()
    await noti
      .message(message)
      .subject(
        ` CollieCli: (${config.get('variables.env')}-${config.get(
          'variables.environment_running'
        )})`
      )
      .channel(config.get('variables.privates.channel_notifications'))
      .build()
  }
}

module.exports = { Notifications }
