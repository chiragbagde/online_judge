// authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const User = require("./../models/User");
const verifyToken = require("../verifyToken");

const router = express.Router();

router.post("/user-profile", verifyToken, async (req, res) => {
  try {
    const { email } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send("User not found.");
    }
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
