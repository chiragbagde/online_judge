const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Image = require("../models/Image");
const verifyToken = require("../verifyToken");
const dotenv = require("dotenv");
const logger = require("../services/logger");

dotenv.config();

process.env.SERVICE_NAME = 'image-service';

router.post("/signed-url", verifyToken, async (req, res) => {
  try {
    const { keys } = req.body;
    if(!Array.isArray(keys)) return res.status(400).json({ error: "Invalid keys format" });
    
    const signedUrls = keys.map((key) => {
        const token = process.env.IMAGE_WORKER_TOKEN;
        const workerBase = process.env.IMAGE_WORKER_BASE;
        const url = `${workerBase}/${encodeURIComponent(key)}?token=${token}`;
        return { key, url };
      });
    logger.log('Generated signed URLs', 'info', { keys });
    res.json(signedUrls);
  } catch (error) {
    logger.log('Error generating signed URL', 'error', { error: error.message });
    logger.error("Error generating signed URL:", error);
    res.status(500).json({ error: "Failed to generate signed URL" });
  }
});

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
    const imageUrl = req.file.filename;

    const newImage = new Image({ title, desc, imageUrl, u_id });
    const savedImage = await newImage.save();
    logger.log('Image uploaded', 'info', { title, desc, u_id });

    res.json(savedImage);
  } catch (error) {
    logger.log('Error uploading image', 'error', { error: error.message });
    logger.error("Error uploading image:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/update", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const { u_id } = req.body;
    if (!u_id) {
      return res.status(400).send("Please enter an id to update");
    }

    const filter = { u_id: u_id };
    const updatedDoc = {};

    if (u_id !== undefined) {
      updatedDoc.u_id = u_id;
    }

    if (req.file.filename !== undefined) {
      updatedDoc.imageUrl = req.file.filename;
    }

    let updateImage = await Image.updateOne(filter, updatedDoc);
    logger.log('Image updated', 'info', { u_id });

    res.status(200).json({
      message: "Image updated successfully",
      updateImage,
    });
  } catch (error) {
    logger.log('Error updating image', 'error', { error: error.message });
    logger.error("Error uploading image:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/all", verifyToken, async (req, res) => {
  try {
    const images = await Image.find();
    logger.log('Fetched all images', 'info');
    res.json(images);
  } catch (error) {
    logger.error("Error getting images:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
