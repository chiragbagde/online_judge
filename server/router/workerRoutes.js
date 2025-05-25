const axios = require('axios');
const express = require('express');
const verifyToken = require("../verifyToken");
const dotenv = require("dotenv");
dotenv.config();


const router = express.Router();

async function sendLogToWorker(logMessage) {
  const url = process.env.LOGS_WORKER_BASE + '/log?token=' + process.env.LOGS_WORKER_TOKEN;

  try {
    await axios.post(url, { message: logMessage }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error sending log:', error.response?.status, error.message);
  }
}

router.post('/send-log', async (req, res) => {
    try {
      const logData = req.body;
  
      if (!logData || !logData.message) {
        return res.status(400).json({ error: 'Missing log message' });
      }
  
      await sendLogToWorker(logData);
      res.json({ success: true, message: 'Log sent to worker' });
    } catch (error) {
      console.error('Failed to send log:', error);
      res.status(500).json({ error: 'Failed to send log' });
    }
  });
  
module.exports = router;
