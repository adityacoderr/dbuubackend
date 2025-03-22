const express = require("express");
const router = express.Router();
const User = require("../models/User"); 
const Group = require("../models/Groups");
const authenticateUser = require("../middleware/authMiddleware");

router.post("/create", authenticateUser, async (req, res) => {
  try {
    console.log("Received Request Body:", req.body); 
    console.log("User from JWT:", req.user); 

    const { name, description } = req.body;
    const creatorId = req.user.id;

    if (!name || !description || !creatorId) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newGroup = new Group({
      name,
      description,
      creator: creatorId,
      members: [creatorId],
    });

    await newGroup.save();
    res.status(201).json(newGroup);
  } catch (error) {
    console.error("Error creating community:", error);
    res.status(500).json({ message: "Error creating community", error });
  }
});


router.get("/all", async (req, res) => {
  try {
    const groups = await Group.find().populate("members", "name username profileImage");
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: "Error fetching groups", error });
  }
});

router.post("/join/:groupId", async (req, res) => {
  try {
    const { userId } = req.body;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (!group.members.includes(userId)) {
      group.members.push(userId);
      await group.save();
    }

    res.json({ message: "Joined group successfully", group });
  } catch (error) {
    res.status(500).json({ message: "Error joining group", error });
  }
});

router.post("/:groupId/post", async (req, res) => {
  try {
    const { userId, content } = req.body;
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.posts.push({ user: userId, content });
    await group.save();

    res.json({ message: "Post added successfully", group });
  } catch (error) {
    res.status(500).json({ message: "Error adding post", error });
  }
});

module.exports = router; 
