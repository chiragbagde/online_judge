// authRoutes.js
const express = require("express");
const User = require("./../models/User");
const bcrypt = require("bcryptjs");
const verifyToken = require("../verifyToken");
const { sql } = require("../database/neon");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  const { id } = req.body;
  try {
    const users = await sql`SELECT * FROM list WHERE id = ${id}`;
    res.json({ users: users });
  } catch {
    console.log("Internal server error.");
  }
});



module.exports = router;
