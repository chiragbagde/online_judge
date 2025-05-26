// authRoutes.js
const express = require("express");
const User = require("./../models/User");
const bcrypt = require("bcryptjs");
const verifyToken = require("../verifyToken");
const { sql } = require("../database/neon");
const cache = require("../middleware/cache");
const { redis } = require("../database/redis-store");
const logger = require("../services/logger");

const router = express.Router();

router.get("/", verifyToken, cache(() => "users"), async (req, res) => {
  try {
    const users = await sql`SELECT * FROM users`;
    res.json({ users: users });
  } catch {
    logger.error("Internal server error.");
  } 
});

router.post("/user-profile", verifyToken, cache((req) => `user:${req.body.email}`), async (req, res) => {
  try {
    const { email } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send("User not found.");
    }
  } catch (error) {
    logger.error(error.message);
  }
});

router.post("/update", verifyToken, async (req, res) => {
  try {
    const { id, user } = req.body;

    const filter = { _id: id };

    await redis.del(`users`);
    await redis.del(`user:${id}`);

    let updateUser = await User.updateOne(filter, user);

    if (!updateUser) {
      return res.status(400).send("User not found.");
    }
    res.status(200).json({
      message: "User updated successfully",
      updateUser,
    });
  } catch (error) {
    logger.error(error.message);
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;

  const del = await User.deleteOne({ _id: id });

  if (del.deletedCount === 0) {
    res.status(400).json({
      message: "Invalid id",
    });
  } else {
    res.status(200).json({
      message: "User deleted successfully",
      del,
    });
  }
});

router.post("/update-role", verifyToken, async (req, res) => {
  try {
    const { id, role } = req.body;

    const filter = { _id: id };

    let updateUser = await User.updateOne(filter, { $set: { role: role } });

    if (!updateUser) {
      return res.status(400).send("User not found.");
    }
    res.status(200).json({
      message: "User role updated successfully",
      updateUser,
    });
  } catch (error) {
    logger.error(error.message);
  }
});

router.post("/create",verifyToken, async (req, res) => {
  const { firstname, lastname, email, role, mobile, username, password } =
    req.body;
  if (!(firstname && lastname && email && role)) {
    return res.status(400).send("Please enter all the information.");
  }
  
  await redis.del(`users`);
  await redis.del(`user:${email}`);

  const defaultPassword = "Test@123";
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send("User already exists!");
  }

  let hashedPassword;
  if (!password) {
    hashedPassword = await bcrypt.hash(password, 10);
  } else {
    hashedPassword = await bcrypt.hash(defaultPassword, 10);
  }

  let user = await User.create({
    firstname,
    lastname,
    email,
    mobile,
    username,
    password: hashedPassword,
  });

  res.status(200).json({
    message: "You created successfully!",
    user,
  });
});

router.get("/admin/:id",verifyToken, async (req, res) => {
  try{
  const id = req.params.id;

  const admin = await sql`SELECT id, role FROM users WHERE id = ${id} LIMIT 1`;  
    if (admin.length == 0 || admin[0].role !== "admin") {
      res.status(400).json({
        message: "Couldn't fetch data",
      });

      return;
    }

  let users = await sql`SELECT * FROM users`;

  res.status(200).json({
    message: "problems retreived successfully!",
    users,
  });
}catch (error) {
    logger.error("Error fetching problems:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

module.exports = router;
