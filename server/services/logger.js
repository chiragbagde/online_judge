const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
require('dotenv').config();

const { combine, timestamp, json, printf, colorize } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message} ${JSON.stringify(meta)}`;
});

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

const LOG_DIR = path.join(__dirname, '../../logs/cache');

const url = `${process.env.LOGS_WORKER_BASE}/log?token=${process.env.LOGS_WORKER_TOKEN}`;

async function sendAllRotatedLogs() {
  try {
    const files = await fs.readdir(LOG_DIR);
    const logFiles = files
      .filter(f => f.startsWith('app-') && f.includes('.log'))
      .map(f => ({ name: f, fullPath: path.join(LOG_DIR, f) }));

    logFiles.sort((a, b) => b.name.localeCompare(a.name));

    for (let i = 0; i < logFiles.length; i++) {
      const { name, fullPath } = logFiles[i];
      try {
        await new Promise(resolve => setTimeout(resolve, 100));

        const stat = await fs.stat(fullPath);
        const isEmpty = stat.size === 0;

        if (isEmpty && i !== 0) {
          await fs.unlink(fullPath);
          console.log('🗑️ Deleted empty log file:', fullPath);
          continue;
        }

        const logData = await fs.readFile(fullPath, 'utf8');
        if (!logData.trim()) {
          await fs.unlink(fullPath);
          console.log('🗑️ Deleted blank log file:', fullPath);
          continue;
        }

        await axios.post(url, { logs: logData });

        console.log('✅ Log file sent:', fullPath);
        await fs.unlink(fullPath);
      } catch (err) {
        console.error('❌ Failed to send log file:', fullPath, err.message);
      }
    }
  } catch (err) {
    console.error('Error reading log directory:', err.message);
  }
};

const rotateTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../../logs/cache/app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD-HH-mm-ss',
  maxSize: '1k',
  maxFiles: '14d',
  format: combine(timestamp(), json())
});

rotateTransport.on('rotate', async (oldFilename) => {
  try {
    await sendAllRotatedLogs();

    await new Promise(resolve => setTimeout(resolve, 100));

    const logData = await fs.readFile(oldFilename, 'utf8');


    await axios.post(url, { logs: logData }, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('✅ Log file sent:', oldFilename);
    await fs.unlink(oldFilename);
  } catch (error) {
    console.error('❌ Failed to send rotated log:', error.message);
  }
});

const logger = winston.createLogger({
  level: logLevel,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  transports: [
    rotateTransport,
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        colorize(),
        consoleFormat
      )
    })
  ]
});

module.exports = logger;
