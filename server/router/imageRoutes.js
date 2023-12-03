const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Image = require("../models/Image");
const verifyToken = require("../verifyToken");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "images/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

router.post("/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const { title, desc, u_id } = req.body;
    console.log(req.file.filename);
    const imageUrl = req.file.filename;

    const newImage = new Image({ title, desc, imageUrl, u_id });
    const savedImage = await newImage.save();

    res.json(savedImage);
  } catch (error) {
    console.error("Error uploading image:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/all", verifyToken, async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (error) {
    console.error("Error getting images:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
