// codeRoutes.js
const express = require("express");
const social = require("./../models/Social");
const Image = require("./../models/Image");
const verifyToken = require("../verifyToken");
const path = require("path");
const fs = require("fs");

const router = express.Router();

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
    console.log(e.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
});

router.post("/update", verifyToken, async (req, res) => {
  const { website, github, twitter, instagram, facebook, linkedin, u_id, id } =
    req.body;

  if (!id) {
    return res.status(400).send("Please enter an id to update");
  }

  const filter = { _id: id };
  const updatedDoc = {};

  if (website !== undefined) {
    updatedDoc.website = website;
  }

  if (u_id !== undefined) {
    updatedDoc.u_id = u_id;
  }

  if (github !== undefined) {
    updatedDoc.github = github;
  }

  if (twitter !== undefined) {
    updatedDoc.twitter = twitter;
  }

  if (facebook !== undefined) {
    updatedDoc.facebook = facebook;
  }

  if (instagram !== undefined) {
    updatedDoc.instagram = instagram;
  }

  if (linkedin !== undefined) {
    updatedDoc.linkedin = linkedin;
  }

  try {
    let updateSocial = await social.updateOne(filter, updatedDoc);

    res.status(200).json({
      message: "Social Profile updated successfully",
      updateSocial,
    });
  } catch (error) {
    console.error("Error updating social profile:", error.message);
    res.status(500).json({
      error: "Internal Server Error",
    });
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
  const { id } = req.body;

  try {
    let socialProfile = await social.findOne({ _id: id }).populate("u_id");

    if (!socialProfile) {
      return res.status(404).json({ error: "Social profile not found" });
    }

    const image = await Image.findOne({ u_id: socialProfile.u_id._id });

    const imagePath = path.join(__dirname, "../images/", image.imageUrl);
    const imageBuffer = fs.readFileSync(imagePath);

    const imageBase64 = imageBuffer.toString("base64");

    res.status(200).json({
      message: "Social Profile fetched successfully",
      socialProfile,
      profileImageBuffer: {
        img: imageBase64,
        imgId: image._id,
      },
    });
  } catch (error) {
    console.error("Error getting social profile:", error.message);
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
