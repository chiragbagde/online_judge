// codeRunnerWorker.js
const { Worker } = require('bullmq');
const axios = require('axios');
const TestCase = require('../models/TestCase');
const Submission = require('../models/Submission');
const logger = require('../services/logger');
const IORedis = require('ioredis');
const dotenv = require('dotenv');
dotenv.config();

const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD,
    tls: {},
    maxRetriesPerRequest: null,
});

const worker = new Worker('code_submissions', async job => {
  const { type, lang, code, stdin, p_id, u_id, c_id } = job.data;

  if (type === 'run') {
    logger.info('Run job queued', job.data);
    const { data } = await axios.post(process.env.CODE_ROUTE + '/run', {
      lang,
      code,
      input: stdin,
    });

    console.log('Run output:', data.output);
    return data.output;
  }

  if (type === 'submit') {
    const testCases = await TestCase.find({ p_id });
    let failed = [];

    for (const t of testCases) {
      const { data } = await axios.post(process.env.CODE_ROUTE + '/submit', {
        lang,
        code,
        input: t.input,
      });

      if (data.output.trim() !== t.output.trim()) {
        failed.push({ input: t.input, expected: t.output, actual: data.output.trim() });
      }
    }

    await Submission.create({
      u_id,
      p_id,
      c_id,
      lang,
      verdict: failed.length === 0 ? 'passed' : 'failed',
      submitted_at: new Date(),
    });

    return {
      verdict: failed.length === 0 ? 'passed' : 'failed',
      failedTestCases: failed,
    };
  }
}, { connection });

worker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});
