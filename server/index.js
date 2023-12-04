const express = require("express");
const { DBConnection } = require("./database/db");
var cookieParser = require("cookie-parser");
const authRoutes = require("./router/authRoutes");
const codeRoutes = require("./router/codeRoutes");
const problemRoutes = require("./router/problemRoutes");
const testCasesRoutes = require("./router/testCasesRoutes");
const compeitionRoutes = require("./router/competitionRoutes");
const userRoutes = require("./router/userRoutes");
const socialRoutes = require("./router/socialRoutes");
const imageRoutes = require("./router/imageRoutes");

const cors = require("cors");

const PORT = process.env.PORT || 5000;
app = express();
DBConnection();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("<h1>Hello Everyone running inside from Docker</h1>");
});

app.use("/api/auth", authRoutes);

app.use("/api/code", codeRoutes);

app.use("/api/testcases", testCasesRoutes);

app.use("/api/competition", compeitionRoutes);

app.use("/api/social-profile", socialRoutes);

app.use("/api/problems", problemRoutes);

app.use("/api/images", imageRoutes);

app.use("/api/users", userRoutes);

app.listen(PORT, () => {
  console.log("Server is running on port ", PORT);
});
