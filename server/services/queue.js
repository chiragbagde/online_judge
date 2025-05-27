const { Queue, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const logger = require('./logger');
const dotenv = require('dotenv');
dotenv.config();

const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  tls: {},
  maxRetriesPerRequest: null,
});

connection.on('connect', () => {
    logger.info('✅ Connected to Redis in Queue');
});

connection.on('error', (err) => {
    logger.error('❌ Redis connection error:', err);
});

const submissionQueue = new Queue('code_submissions', { connection });

const queueEvents = new QueueEvents('code_submissions', { connection });

module.exports = { submissionQueue, queueEvents };