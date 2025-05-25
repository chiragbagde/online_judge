const express = require("express");
const List = require("../models/List");
const verifyToken = require("../verifyToken");
const logger = require("../services/logger");

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  const { user_id } = req.query;
  logger.info(user_id);
  

  try {
    const lists = await List.find({ user_id }).populate("problems"); // Corrected to match schema
    res.status(200).json({
      message: "Lists retrieved successfully",
      lists,
    });
  } catch (error) {
    logger.error("Error retrieving lists:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.post("/create", verifyToken, async (req, res) => {
  const { name, description, user_id, problems } = req.body;

  try {
    const newList = await List.create({
      name,
      description,
      user_id,
      problems,
    });

    res.status(201).json({
      message: "List created successfully",
      list: newList,
    });
  } catch (error) {
    logger.error("Error creating list:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.post("/update", verifyToken, async (req, res) => {
  const { id, name, description, problems } = req.body;

  if (!id) {
    return res.status(400).send("Please provide a valid list ID to update.");
  }

  try {
    const updatedList = await List.findByIdAndUpdate(
      id,
      { name, description, problems },
      { new: true }
    );

    if (!updatedList) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    res.status(200).json({
      message: "List updated successfully",
      list: updatedList,
    });
  } catch (error) {
    logger.error("Error updating list:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

router.post("/delete", verifyToken, async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).send("Please provide a valid list ID to delete.");
  }

  try {
    const deletedList = await List.findByIdAndDelete(id);

    if (!deletedList) {
      return res.status(404).json({
        message: "List not found",
      });
    }

    res.status(200).json({
      message: "List deleted successfully",
      list: deletedList,
    });
  } catch (error) {
    logger.error("Error deleting list:", error.message);
    res.status(500).json({
      error: "Internal server error",
    });
  }
});

module.exports = router;
