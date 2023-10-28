const express = require("express");
var bcrypt = require("bcryptjs");
const { DBConnection } = require("./database/db");
const User = require("./models/User");
var jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
const { generateFile } = require("./generateFile");
const { executeCpp } = require("./executeCpp");

const PORT = process.env.PORT || 5000;
app = express();
DBConnection();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!!!");
});

app.post("/register", async (req, res) => {
  const { firstname, lastname, email, password } = req.body;
  if (!(firstname && lastname && email && password)) {
    return res.status(400).send("Please enter all the information.");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(200).send("User already exists!");
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  let user = await User.create({
    firstname,
    lastname,
    email,
    password: hashedPassword,
  });

  const token = jwt.sign({ id: user._id, email }, process.env.SECRET_KEY, {
    expiresIn: "1hrs",
  });
  user.token = token;
  user.password = undefined;
  res.status(200).json({
    message: "You have successfully registered!",
    token,
    user,
  });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      return res.status(400).send("Please enter all the information.");
    }

    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send("User not found.");
    }

    const enteredPassword = await bcrypt.compare(password, user.password);

    if (!enteredPassword) {
      return res.status(400).send("Password is incorrect");
    }

    const token = jwt.sign({ id: user._id, email }, process.env.SECRET_KEY, {
      expiresIn: "1hrs",
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
    });
  } catch (error) {
    console.log(error.message);
  }
});

app.post("/run", async (req, res) => {
  const { lang = "cpp", code } = req.body;

  if (code === undefined) {
    res.status(400).json({ success: false, error: "Empty code body!" });
  }
  const filePath = await generateFile(lang, code);
  const output = await executeCpp(filePath);
  res.status(200).json({ filePath, output });
});

app.listen(8080, () => {
  console.log("Server is running on port 8080!");
});
