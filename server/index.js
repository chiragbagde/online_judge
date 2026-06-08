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

const limiter = rateLimiter({
  windowMs: 60 * 1000,
  max: 50,
  handler: (req, res) =>
    res.status(429).json({ success: false, error: "Too many requests, try again later." }),
});

const PORT = process.env.PORT || 5000;
const MAX_RETRIES = 5;
let server;
let retryDelay = 5000;
let retryCount = 0;

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)
  .concat(["http://localhost:3000", "http://localhost:5000"]);

const corsOptions = {
  origin: (origin, callback) => {
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

async function startServer() {
  try {
    console.log(`Starting server... Attempt ${retryCount + 1}`);

    await DBConnection();
    await testNeonConnection();

    const app = express();
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));
    app.use(limiter);
    app.set("trust proxy", 1);

    app.use((req, _res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });

    app.get("/", (req, res) => res.send("Running!"));
    app.get("/health", (req, res) =>
      res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
    );

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

    app.use((req, res) => res.status(404).json({ error: `Cannot ${req.method} ${req.path}` }));

    server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on 0.0.0.0:${PORT}`);
    });

    server.on("error", (err) => {
      console.error("Server error:", err.message);
      process.exit(1);
    });

    retryDelay = 5000;
    retryCount = 0;
  } catch (error) {
    console.error("Error starting server:", error.message);

    retryCount++;
    if (retryCount > MAX_RETRIES) {
      console.error("Max retries exceeded. Exiting...");
      process.exit(1);
    }

    console.log(`Retrying in ${retryDelay / 1000}s...`);
    setTimeout(() => {
      retryDelay = Math.min(retryDelay * 2, 60000);
      startServer();
    }, retryDelay);
  }
}

mongoose.connection.on("disconnected", async () => {
  console.warn("MongoDB disconnected. Restarting...");
  try {
    if (server && server.listening) {
      await new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
    }
    await mongoose.disconnect();
    startServer();
  } catch (error) {
    console.error("Error restarting after disconnect:", error.message);
    process.exit(1);
  }
});

startServer();
