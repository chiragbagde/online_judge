// authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./../models/User");
const { sql } = require("../database/neon");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { firstname, lastname, email, password, username } = req.body;
  if (!(firstname && lastname && email && password && username)) {
    return res.status(400).send("Please enter all the information.");
  }
  const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
  if (existingUser.length > 0) {
    return res.status(400).send("User already exists!");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await sql`
  INSERT INTO users (firstname, lastname, email, password, username)
  VALUES (${firstname}, ${lastname}, ${email}, ${hashedPassword}, ${username})
  RETURNING id, firstname, lastname, email, username, role
  `

  const user = newUser[0];

  const token = jwt.sign({ id: user.id, email }, process.env.SECRET_KEY, {
    expiresIn: "3hrs",
  });
  user.token = token;
  user.password = undefined;
  res.status(200).json({
    message: "You have successfully registered!",
    token,
    user: {...user, _id: user.id}
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).send("Please enter all the information.");
    }

    const result = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = result[0];

    if (!user) {
      return res.status(400).send("User not found.");
    }

    const enteredPassword = await bcrypt.compare(password, user.password);

    if (!enteredPassword) {
      return res.status(400).send("Password is incorrect");
    }

    const token = jwt.sign({ id: user._id, email }, process.env.SECRET_KEY, {
      expiresIn: "3hrs",
    });
    user.token = token;
    user.password = undefined;

    const options = {
      expires: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      httpOnly: true, // only manipulate by server not by frontend/user
    };

    res.status(200).cookie("token", token, options).json({
      message: "You have successfully logged in!",
      success: true,
      token,
      user: { ...user, _id: user.id },
    });
  } catch (error) {
    console.log(error.message);
  }
});

module.exports = router;
