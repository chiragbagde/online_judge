const express = require("express");
const { DBConnection } = require("./database/db");
const { testNeonConnection } = require("./database/neon");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const authRoutes = require("./router/authRoutes");
const codeRoutes = require("./router/codeRoutes");
const problemRoutes = require("./router/problemRoutes");
const testCasesRoutes = require("./router/testCasesRoutes");
const competitionRoutes = require("./router/competitionRoutes");
const userRoutes = require("./router/userRoutes");
const socialRoutes = require("./router/socialRoutes");
const imageRoutes = require("./router/imageRoutes");
const notificationsRoutes = require("./router/notificationRoutes");

const PORT = process.env.PORT || 5000;
let app;
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
    app.use(cors());
    app.use(express.json());
    app.use(cookieParser());
    app.use(express.urlencoded({ extended: true }));

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

    server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

    retryDelay = 5000;
    retryCount = 0; // Reset retry counter on success
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
      retryDelay = Math.min(retryDelay * 2, 60000); // Exponential backoff up to 60s
      startServer();
    }, retryDelay);
  }
}

async function resetMongoose() {
  console.log("🔄 Resetting mongoose models and connections...");

  if (mongoose.models && typeof mongoose.models === "object") {
    for (const modelName of Object.keys(mongoose.models)) {
      delete mongoose.models[modelName];
    }
  }

  if (mongoose.modelSchemas && typeof mongoose.modelSchemas === "object") {
    for (const modelName of Object.keys(mongoose.modelSchemas)) {
      delete mongoose.modelSchemas[modelName];
    }
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
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

// Start the first time
startServer();
