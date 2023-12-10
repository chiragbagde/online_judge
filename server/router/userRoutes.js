// authRoutes.js
const express = require("express");
const User = require("./../models/User");
const bcrypt = require("bcryptjs");
const verifyToken = require("../verifyToken");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    let users = await User.find();
    res.json({ users: users });
  } catch {
    console.log("Internal server error.");
  }
});

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

router.post("/update", verifyToken, async (req, res) => {
  try {
    const { id, user } = req.body;

    const filter = { _id: id };
    console.log(user);

    let updateUser = await User.updateOne(filter, user);

    if (!updateUser) {
      return res.status(400).send("User not found.");
    }
    res.status(200).json({
      message: "User updated successfully",
      updateUser,
    });
  } catch (error) {
    console.log(error.message);
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
    console.log(role);

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
    console.log(error.message);
  }
});

router.post("/create", async (req, res) => {
  const { firstname, lastname, email, role } = req.body;
  if (!(firstname && lastname && email && role)) {
    return res.status(400).send("Please enter all the information.");
  }
  const password = "Test@123";
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).send("User already exists!");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await User.create({
    firstname,
    lastname,
    email,
    password: hashedPassword,
  });

  res.status(200).json({
    message: "You created successfully!",
    user,
  });
});

module.exports = router;
