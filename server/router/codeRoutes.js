const express = require("express");
const verifyToken = require("../verifyToken");
const {submissionQueue, queueEvents} = require("../services/queue");
const router = express.Router();

router.post("/run", verifyToken, async (req, res) => {
  const { lang, code, input } = req.body;

  if (!code) return res.status(400).json({ error: "Empty code body!" });

  const job = await submissionQueue.add('run', {
    type: 'run',
    lang,
    code,
    stdin: input, 
  });

  const result = await job.waitUntilFinished(queueEvents, 30000);
  return res.status(202).json({ message: "code executed successfully", output: result });
});

router.post("/submit", verifyToken, async (req, res) => {
  const { lang, code, p_id, u_id, c_id, input } = req.body;

  if (!code) return res.status(400).json({ error: "Empty code body!" });

  const job = await submissionQueue.add('submit', {
    type: 'submit',
    lang,
    code,
    stdin: input,
    p_id,
    u_id,
    c_id,
  });

  const result = await job.waitUntilFinished(queueEvents, 30000);
  return res.status(202).json({ message: "code submitted successfully", output: result });
});

module.exports = router;