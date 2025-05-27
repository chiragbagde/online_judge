const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
};

const { combine, timestamp, json, printf, colorize } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const safeMeta = JSON.parse(JSON.stringify(meta, getCircularReplacer()));
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${
    Object.keys(safeMeta).length ? JSON.stringify(safeMeta, null, 2) : ''
  }`;
});

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const LOG_DIR = path.join(__dirname, '../../logs/cache');

const ensureLogDir = async () => {
  try {
    await fs.mkdir(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating log directory:', error);
  }
};

ensureLogDir();

const transports = [
  new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      consoleFormat
    )
  }),
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d'
  }),
  new DailyRotateFile({
    filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d'
  })
];

const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    json()
  ),
  transports,
  exitOnError: false
});

if (process.env.LOGS_WORKER_BASE && process.env.LOGS_WORKER_TOKEN) {
  const axios = require('axios');
  const url = `${process.env.LOGS_WORKER_BASE}/log?token=${process.env.LOGS_WORKER_TOKEN}`;
  
  class RemoteTransport extends winston.Transport {
    constructor(opts) {
      super(opts);
      this.name = 'remoteTransport';
      this.level = opts.level || 'info';
    }

    log(info, callback) {
      setImmediate(() => {
        this.emit('logged', info);
      });

      const cleanInfo = JSON.parse(JSON.stringify(info, getCircularReplacer()));
      
      axios.post(url, cleanInfo)
        .catch(error => {
          console.error('Error sending log to remote:', error.message);
        })
        .finally(() => {
          callback();
        });
      
      return true;
    }
  }

  logger.add(new RemoteTransport({ level: 'info' }));
}

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason: reason.message || reason });
});

module.exports = logger;