const { redis } = require("../database/redis-store");

const cache = (keyGenerator) => async (req, res, next) => {
  const key =
    typeof keyGenerator === "function" ? keyGenerator(req) : keyGenerator;

  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      return res.status(200).json(JSON.parse(cachedData));
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      redis.set(key, JSON.stringify(body), { ex: 3600 });
      return originalJson(body);
    };

    next();
  } catch (err) {
    console.error("Cache error:", err);
    next();
  }
};

module.exports = cache;
