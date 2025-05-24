const { Redis } = require("@upstash/redis");
require("dotenv").config();

const mockRedis = {
  get: () => null,
  set: () => Promise.resolve(),
  del: () => Promise.resolve()
};

const redis = process.env.NODE_ENV === 'development' 
  ? mockRedis 
  : new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });


module.exports = { redis };
