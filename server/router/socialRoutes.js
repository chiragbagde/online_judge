// codeRoutes.js
const express = require("express");
const social = require("./../models/Social");
const Image = require("./../models/Image");
const verifyToken = require("../verifyToken");
const path = require("path");
const fs = require("fs");
const { sql } = require("../database/neon");
const { uploadFileToB2, downloadFileFromB2, deleteFileFromB2 } = require("../utilities/b2.js");
const mime = require("mime-types");
const multer = require("multer");
const cache = require("../middleware/cache");
const { redis } = require("../database/redis-store");
const logger = require("../services/logger.js");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/tmp");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post("/upload-profile-image", verifyToken, upload.single("profileImage"),
  async (req, res) => {
    try {
      const { u_id } = req.body;
      if (!req.file) {
        return res.status(400).send("Please upload a file");
      }
      await redis.del(`user-image:${u_id}`);

      const ext = path.extname(req.file.originalname);
      const newFilename = `${u_id}${ext}`;
      const newPath = path.join(path.dirname(req.file.path), newFilename);
      fs.renameSync(req.file.path, newPath);

      try{
        await deleteFileFromB2(newFilename);
        logger.info("deleted other instance successfully!");
        
      }catch{
        logger.info("Did not find any instance");
        
      }

      const b2Result = await uploadFileToB2(newPath);

      fs.unlinkSync(newPath);

      const imageDoc = await Image.findOneAndUpdate(
        { u_id: u_id },
        { imageUrl: b2Result.fileName },
        { new: true, upsert: true }
      );

      res
        .status(200)
        .json({ message: "Image uploaded to B2", image: imageDoc });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

router.get("/download-profile-image/:u_id", verifyToken, cache((req) => "user-image:" + req.params.u_id), async (req, res) => {
  const { u_id } = req.params;

  try {
    const image = await Image.findOne({ u_id: u_id });
    if (!image || !image.imageUrl) {
      return res.status(404).json({ error: "Image not found" });
    }

    const tmpDir = "/tmp";
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tempFilePath = path.join(tmpDir, image.imageUrl);
    await downloadFileFromB2(image.imageUrl, tempFilePath);

    const imageBuffer = fs.readFileSync(tempFilePath);
    fs.unlinkSync(tempFilePath);
    const contentType = mime.lookup(tempFilePath) || "application/octet-stream";
    res.set("Content-Type", contentType);
    return res.send(imageBuffer);
  } catch (error) {
    logger.error("Error downloading image:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.delete("/delete-profile-image/:u_id", verifyToken, async (req, res) => {
  const { u_id } = req.params;
  
  try {
    await redis.del(`user-image:${u_id}`);

    const image = await Image.findOne({ u_id });
    if (!image || !image.imageUrl) {
      return res.status(404).json({ error: "Image not found" });
    }

    await deleteFileFromB2("5efb7746-aed0-4c75-b8c5-bfe97211501c.jpeg");

    await Image.deleteOne({ u_id });

    res.status(200).json({ message: "Profile image deleted from B2 and database" });
  } catch (error) {
    logger.error("Error deleting profile image:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/create", verifyToken, async (req, res) => {
  const { website, github, twitter, instagram, facebook, linkedin, u_id } =
    req.body;

  try {
    if (!u_id) {
      return res.status(400).send("Please enter the user id.");
    }
    let newSocialRoutes = await social.create({
      website,
      github,
      twitter,
      instagram,
      facebook,
      linkedin,
      u_id,
    });

    res.status(200).json({
      message: "You have added a new social profile!",
      newSocialRoutes,
    });
  } catch (e) {
    logger.error(e.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/update", verifyToken, async (req, res) => {
  const { id, u_id, firstname, lastname, email, mobile, ...fields } = req.body;
  if (!u_id) return res.status(400).send("Please enter an id to update");

  try {
    if (firstname) await sql`UPDATE users SET firstname = ${firstname} WHERE id = ${u_id}`;
    if (lastname) await sql`UPDATE users SET lastname = ${lastname} WHERE id = ${u_id}`;
    if (email) await sql`UPDATE users SET email = ${email} WHERE id = ${u_id}`;
    if(mobile) await sql`UPDATE users SET mobile = ${mobile} WHERE id = ${u_id}`
    logger.info(mobile, u_id);

    const allowedFields = ["website", "github", "twitter", "instagram", "facebook", "linkedin", "u_id"];
    const updatedDoc = {};
    for (const key of allowedFields) {
      if (fields[key] !== undefined) updatedDoc[key] = fields[key];
    }

    const filter = { u_id: u_id };
    let updateSocial = await social.updateOne(filter, updatedDoc);
    res.status(200).json({ message: "Social Profile updated successfully", updateSocial });
  } catch (error) {
    logger.error("Error updating social profile:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/", verifyToken, async (req, res) => {
  let socialProfiles = await user.find({});

  res.status(200).json({
    message: "Social Profiles retreived successfully!",
    socialProfiles,
  });
});

router.post("/id", verifyToken, async (req, res) => {
  const { u_id } = req.body;

  try {
    let socialProfile = await social.findOne({ u_id: u_id });

    if (!socialProfile) {
      socialProfile = await social.create({ u_id: u_id });
      await socialProfile.save();
    }

    const user = await sql`
      SELECT id, firstname, lastname, email, username, mobile
      FROM users
      WHERE id = ${u_id}
    `;

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found in PostgreSQL" });
    }

    socialProfile = socialProfile.toObject();
    socialProfile = {...socialProfile, ...user[0] };
    delete socialProfile.id;
    delete socialProfile._id;

    res.status(200).json({
      message: "Social Profile fetched successfully",
      socialProfile
    });
  } catch (error) {
    logger.error("Error getting social profile:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.delete("/", verifyToken, async (req, res) => {
  const { id } = req.body;

  const del = await socialProfile.deleteOne({ _id: id });

  if (del.deletedCount === 0) {
    res.status(400).json({
      message: "Invalid id",
    });
  } else {
    res.status(200).json({
      message: "Social Profile deleted successfully",
      del,
    });
  }
});

module.exports = router;
