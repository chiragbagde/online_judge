const { redis } = require("../database/redis-store");

const cache = (keyGenerator) => async (req, res, next) => {
  const key =
    typeof keyGenerator === "function" ? keyGenerator(req) : keyGenerator;

  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      // Set content type and send cached data
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(cachedData);
    }

    // Monkey-patch res.send to capture the response body
    const originalSend = res.send;
    let responseBody;
    res.send = function (body) {
      responseBody = body;
      originalSend.apply(res, arguments);
    };

    // When the response is finished, cache the captured body
    res.on('finish', () => {
      if (res.statusCode === 200 && responseBody) {
        try {
          // Ensure we are caching a valid JSON string
          const bodyToCache = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);
          redis.set(key, bodyToCache, { ex: 3600 });
        } catch (cacheError) {
          console.error("Failed to cache response:", cacheError);
        }
      }
    });

    next();
  } catch (err) {
    console.error("Cache middleware error:", err);
    next();
  }
};

module.exports = cache;
