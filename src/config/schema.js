'use strict'

const schema = {
  env: {
    doc: 'The application environment',
    format: ['prod', 'dev', 'stage'],
    default: 'prod',
    env: 'ENV'
  },
  log_location: {
    doc: `Local log location. Without last '/'`,
    format: String,
    default: 'logs',
    env: 'LOG_LOCATION'
  },
  debug_mode: {
    doc: 'Enable debug mode. Apply just for the console',
    format: ['developer', 'machine'],
    default: 'machine',
    env: 'DEBUG_MODE'
  },
  timeout_page: {
    doc: 'Max timeout in milliseconds to wait a page',
    format: 'int',
    default: 60000,
    env: 'TIMEOUT_PAGE'
  },
  timeout_object: {
    doc: 'Max timeout in milliseconds to wait an object',
    format: 'int',
    default: 60,
    env: 'TIMEOUT_OBJECT'
  },
  days: {
    doc: 'How many days in the future(1 means tomorrow)',
    format: 'int',
    default: 1,
    env: 'DAYS'
  },
  cinepolis: {
    doc: 'Run script for this specific brand',
    format: Boolean,
    default: true,
    env: 'CINEPOLIS'
  },
  cinemex: {
    doc: 'Run script for this specific brand',
    format: Boolean,
    default: true,
    env: 'CINEMEX'
  },
  docker_env: {
    doc: 'Script should run as docker container',
    format: Boolean,
    default: true,
    env: 'DOCKER_ENV'
  },
  movie_restriction: {
    enable: {
      doc: 'Should script just scrapped specific movie',
      format: Boolean,
      default: false,
      env: 'MAX_MOVIES_ENABLE'
    },
    name: {
      doc: 'Movie name. Just if enable is true',
      format: String,
      default: '',
      env: 'NAME_MOVIE_COUNT'
    }
  },
  retry: {
    doc: 'Max number of times to retried the script by brand',
    format: 'int',
    default: 2,
    env: 'RETRY'
  },
  private: {
    channel_notifications: {
      doc: 'Channel to publish notifications',
      format: String,
      default: null,
      env: 'CHANNEL_NOTIFICATIONS'
    },
    db_name: {
      doc: 'Local log location',
      format: String,
      default: null,
      env: 'DB_NAME'
    },
    db_user: {
      doc: 'Local log location',
      format: String,
      default: null,
      env: 'DB_USER'
    },
    db_pwd: {
      doc: 'Local log location',
      format: String,
      default: null,
      env: 'DB_PWD'
    },
    db_host: {
      doc: 'Local log location',
      format: String,
      default: null,
      env: 'DB_HOST'
    }
  }
}

module.exports = schema
