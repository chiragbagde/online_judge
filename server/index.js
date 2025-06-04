const express = require("express");
const { DBConnection } = require("./database/db");
const { testNeonConnection } = require("./database/neon");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const logger = require("./services/logger");

const authRoutes = require("./router/authRoutes");
const codeRoutes = require("./router/codeRoutes");
const problemRoutes = require("./router/problemRoutes");
const testCasesRoutes = require("./router/testCasesRoutes");
const competitionRoutes = require("./router/competitionRoutes");
const userRoutes = require("./router/userRoutes");
const socialRoutes = require("./router/socialRoutes");
const imageRoutes = require("./router/imageRoutes");
const notificationsRoutes = require("./router/notificationRoutes");
const workerRoutes = require("./router/workerRoutes");
const listRoutes = require("./router/listRoutes");
const rateLimiter = require("express-rate-limit");

if (!global.fetch) {
  global.fetch = (...args) =>
    import("node-fetch").then(({ default: fetch }) => fetch(...args));
}


const limiter = rateLimiter({
  windowMs: 1 * 60 * 1000,
  max: 50,
  handler: (req, res) => {
    return res
      .status(429)
      .json({ success: false, error: "Too many requests, try again later." });
  },
});

const PORT = process.env.PORT || 5000;
let server;
let retryDelay = 5000;
let retryCount = 0;
const MAX_RETRIES = 5;

// Helper function to clear model cache
function clearRequireCacheForModels() {
  const modelPaths = [
    "./models/User",
    "./models/Problem",
    "./models/TestCase",
    "./models/Competition",
    "./models/Social",
    "./models/Image",
    "./models/Submission",
  ];

  modelPaths.forEach((path) => {
    delete require.cache[require.resolve(path)];
    require(path);
  });
}

async function startServer() {
  try {
    console.log("🛠️ Trying to start the server... Attempt:", retryCount + 1);

    await DBConnection();
    await testNeonConnection();
    clearRequireCacheForModels();

    app = express();

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5000",
      "https://crazy-codequest.netlify.app",
      "https://server-thrumming-waterfall-7530.fly.dev",
    ];

    const corsOptions = {
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("CORS not allowed from this origin: " + origin));
        }
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
      credentials: true,
    };

    app.use(cors(corsOptions));
    
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(limiter);
    app.set("trust proxy", 1);

    app.get("/", (req, res) => res.send("Running!"));
    app.use("/api/auth", authRoutes);
    app.use("/api/code", codeRoutes);
    app.use("/api/testcases", testCasesRoutes);
    app.use("/api/competitions", competitionRoutes);
    app.use("/api/social-profile", socialRoutes);
    app.use("/api/problems", problemRoutes);
    app.use("/api/images", imageRoutes);
    app.use("/api/users", userRoutes);
    app.use("/api/notifications", notificationsRoutes);
    app.use("/api/lists", listRoutes);
    app.use("/api/workers", workerRoutes);

    app.get('/health', async (req, res) => {
        try {
            await redisQueue.redis.ping();
            res.status(200).json({ 
                status: 'ok',
                redis: 'connected',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Health check failed:', error);
            res.status(500).json({ 
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on 0.0.0.0:${PORT}`);
    });    

    server.on("error", async (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`❌ Port ${PORT} is already in use.`);
        console.log("🔄 Attempting to reset the server...");

        const killCommand = `npx kill-port ${PORT}`;
        const { exec } = require("child_process");
        exec(killCommand, (error, stdout, stderr) => {
          if (error) {
            console.error("❌ Failed to kill the process using the port:", error.message);
            process.exit(1);
          } else {
            console.log(`✅ Port ${PORT} has been freed. Restarting the server...`);
            setTimeout(startServer, 1000);
          }
        });
      } else {
        console.error("❌ Unexpected server error:", err.message);
        process.exit(1);
      }
    });

    retryDelay = 5000;
    retryCount = 0;
  } catch (error) {
    console.error("❌ Error starting server:", error.message);
    console.error(error.stack);

    retryCount++;
    if (retryCount > MAX_RETRIES) {
      console.error("💥 Max retries exceeded. Exiting...");
      process.exit(1);
    }

    console.log(`🔁 Retrying in ${retryDelay / 1000} seconds...`);
    setTimeout(() => {
      retryDelay = Math.min(retryDelay * 2, 60000);
      startServer();
    }, retryDelay);
  }
}

async function resetMongoose() {
  console.log("🔄 Resetting mongoose models and connections...");

  if (mongoose.models && typeof mongoose.models === "object") {
    Object.keys(mongoose.models).forEach((modelName) => {
      delete mongoose.models[modelName];
    });
  }

  if (mongoose.modelSchemas && typeof mongoose.modelSchemas === "object") {
    Object.keys(mongoose.modelSchemas).forEach((modelName) => {
      delete mongoose.modelSchemas[modelName];
    });
  }

  if (mongoose.deleteModel) {
    mongoose.deleteModel(/.*/);
  }

  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (err) {
      console.error("⚠️ Error while disconnecting mongoose:", err.message);
    }
  }
}

mongoose.connection.on("disconnected", async () => {
  console.warn("⚠️ MongoDB disconnected! Restarting app...");
  try {
    if (server && server.listening) {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) return reject(err);
          console.log("🛑 Express server closed.");
          resolve();
        });
      });
    }

    await resetMongoose();

    startServer();
  } catch (error) {
    console.error("❌ Error while restarting server:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
});

// cron.schedule("* * * * *", async () => {
//   try {
//     console.log("Cron job running: hitting GET /");

//     const response = await axios.get(
//       "http://localhost:3001/api"
//     );
//     console.log("Server response:", response.data);
//   } catch (error) {
//     console.error("Error calling GET /:", error.message);
//   }
// });



startServer();
