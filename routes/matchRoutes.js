const express = require("express");
const router = express.Router();
const User = require("../models/User");
const findBestMatch = require("../utils/matchUsers");

router.post("/find-match", async (req, res) => {
  const { userId } = req.body;

  const currentUser = await User.findById(userId);
  if (!currentUser) return res.status(404).json({ error: "User not found" });

  const bestMatch = await findBestMatch(currentUser);
  if (!bestMatch) return res.status(404).json({ message: "No match found" });

  res.json({ match: bestMatch });
});

module.exports = router;
