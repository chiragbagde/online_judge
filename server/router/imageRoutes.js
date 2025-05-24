const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const Image = require("../models/Image");
const verifyToken = require("../verifyToken");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { r2Client } = require("../database/cloudfare-s3");

router.post("/signed-url", verifyToken, async (req, res) => {
  try {
    const { keys } = req.body;
    if(!Array.isArray(keys)) return res.status(400).json({ error: "Invalid keys format" });
    
    const signedUrls = await Promise.all(
      keys.map( async (key) => {
        const command = new GetObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key
        });

        const signedUrl = await getSignedUrl(r2Client, command  , { expiresIn: 3000 });
        return { key, url: signedUrl };
      })
    );
    res.json(signedUrls);
  } catch (error) {
    console.error("Error generating signed URL:", error);
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

    res.json(savedImage);
  } catch (error) {
    console.error("Error uploading image:", error.message);
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

    res.status(200).json({
      message: "Image updated successfully",
      updateImage,
    });
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
