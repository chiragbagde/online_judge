// authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sql } = require("../database/neon");
const { sendOTP, verifyOtp } = require("../utils/otpService");
const cache = require("../middleware/cache");
const { redis } = require("../database/redis-store");
const logger = require("../services/logger");

const router = express.Router();

router.post("/register", async (req, res) => {
  let { firstname, lastname, email, password, username } = req.body;

  if (!(firstname && lastname && email && password)) {
    return res.status(400).send("Please enter all the information.");
  }
  if(!username) {
    username = email.split("@")[0];
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;

  if(existingUser.length > 0) {
    if (existingUser.otp_verified) {
      return res.status(400).send("User already exists!");
    }else{
      await sql`
        UPDATE users
        SET firstname = ${firstname}, lastname = ${lastname}, password = ${hashedPassword}, username = ${username}
        WHERE email = ${email}
        RETURNING id, firstname, lastname, email, username, role
      `;
    } }
    else {
      await sql`
      INSERT INTO users (firstname, lastname, email, password, username)
      VALUES (${firstname}, ${lastname}, ${email}, ${hashedPassword}, ${username})
      RETURNING id, firstname, lastname, email, username, role
    `;
  }
 
  await sendOTP(email);

  res.status(200).json({
    message: "OTP sent to your email!",
    success: true,
    email
  })
});

router.post("/resend-otp", async (req, res) => {
  const {email} = req.body;

  if(!email) {
    return res.status(400).send("Please enter all the information.");
  }

  const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
  
  if(existingUser.length === 0) {
    return res.status(400).send("User not found.");
  }
  if (existingUser.otp_verified) {
    return res.status(400).send("User already exists!");
  }

  await sendOTP(email);

  return res.status(200).json({  
    message: "OTP resent to your email!",
    success: true,
    email
  })
});

router.post("/reset-password", async (req, res) => {
  try{
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).send("Please enter all the information.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const allUsers = await sql`SELECT * FROM users WHERE email = ${email}`;
    const existingUser = allUsers[0];
    logger.info(existingUser);
    
    if(existingUser.password) {
      const enteredPassword = await bcrypt.compare(
        password,
        existingUser.password
      );

      if (enteredPassword) {
        return res.status(400).send("Password is already used.");
      }
    }
    
    if (existingUser.length === 0) {
      return res.status(400).send("User not found.");
    }

    const all = await sql`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE email = ${email}
      RETURNING id, firstname, lastname, email, username, role
    `;
    const user = all[0];

    const token = jwt.sign({ id: user.id, email }, process.env.SECRET_KEY, {
      expiresIn: "7d",
    });

    const options = {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    res
      .status(200)
      .cookie("token", token, options)
      .json({
        message: "You have successfully logged in!",
        success: true,
        token,
        user: { ...user, _id: user.id },
      });
  } catch (error) {
    logger.info(error.message);
    res.status(500).send("Server error");
  }
 
});

router.post("/verify-otp", async (req, res) => {
  const {email, otp} = req.body;
  if (!email || !otp) {
    return res.status(400).send("Please enter all the information.");
  };

  try {
    const result = await verifyOtp(email, otp);
    const filteredUser = await sql`SELECT * FROM users WHERE email = ${email}`;
    const user = filteredUser[0];
    if (!user) { 
      return res.status(400).send("User not found.");
     };
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    return res.status(200).json({
      message: "Logged in successfully!",
      token,
      user: { ...user, _id: user.id },
    });
  }catch (error) {
    logger.error(error.message);
    return res.status(400).json({ error: error.message });
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).send("Please enter all the information.");
    }

    await redis.del(`user:${email}`); // Invalidate cache for this user

    const allUsers = await sql`SELECT * FROM users WHERE email = ${email}`;
    const existingUser = allUsers[0];

    if (!existingUser) {
      return res.status(400).send("User not found!");
    }

    const enteredPassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!enteredPassword) {
      return res.status(400).send("Invalid password!");
    }

    const token = jwt.sign(
      { id: existingUser.id },
      process.env.SECRET_KEY,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      user: {
        id: existingUser.id,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  } catch (e) {
    logger.error("Login error:", e);
    res.status(500).json({ error: "Internal Server Error" });
    logger.info(error.message);
    res.status(500).send("Server error");
  }
});

router.post("/google-login", async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const username = email.split("@")[0];

  try {
    const existingUser = await sql`SELECT * FROM users WHERE email = ${email}`;
    let user;

    if (existingUser.length > 0) {
      user = existingUser[0];
    } else {
      const newUser = await sql`
        INSERT INTO users (email, firstname, username, created_at)
        VALUES (${email}, ${name}, ${username}, NOW())
        RETURNING id, firstname, lastname, email, username, role
      `;
      user = newUser[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.SECRET_KEY,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Logged in with Google successfully!",
      token,
      user: { ...user, _id: user.id },
    });
  } catch (error) {
    logger.error("Google login error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
