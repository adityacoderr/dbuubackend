const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/explore", authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; 
        const currentUser = await User.findById(userId).lean();

        if (!currentUser) {
            return res.status(404).json({ message: "User not found", users: [] });
        }

       
        const users = await User.find({
            _id: { $ne: userId },
            interests: { $in: currentUser.interests }
        })
        .select("name username gender profileImage interests")
        .lean();

        res.json({ users: users.length > 0 ? users : [] }); 
    } catch (error) {
        console.error("Explore Route Error:", error);
        res.status(500).json({ message: "Server error", users: [] });
    }
});

module.exports = router;
