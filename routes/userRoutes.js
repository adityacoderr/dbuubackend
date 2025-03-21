const express = require("express");
const authenticateUser = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();

router.get("/search/:query", authenticateUser, async (req, res) => {
    try {
        const query = req.params.query?.trim(); 

        if (!query) return res.json([]);

        const users = await User.find({
            $or: [
                { name: { $regex: new RegExp(query, "i") } },
                { username: { $regex: new RegExp(query, "i") } }
            ]
        }).select("name username gender _id");


        res.json(users);
    } catch (error) {
        console.error("Search Error:", error); 
        res.status(500).json({ message: "Error searching users", error: error.message });
    }
});



router.get("/profile/:username", authenticateUser,async (req, res) => {
    try {
        const { username } = req.params;
        console.log("useeeeee".username);
        const user = await User.findOne({ username });


        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            name: user.name,
            username: user.username,
            email: user.email, 
            gender: user.gender,
            interests: user.interests,
            profileImage: user.profileImage,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});




router.get("/profile", authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password"); 
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
