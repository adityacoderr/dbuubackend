const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const findMatch = require("../utils/findMatch");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/send-request/:receiverId", authenticateToken, async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.receiverId;

        if (senderId === receiverId) return res.status(400).json({ message: "You can't send a request to yourself!" });

        const receiver = await User.findById(receiverId);
        if (!receiver) return res.status(404).json({ message: "User not found" });

        if (receiver.friendRequests.includes(senderId)) {
            return res.status(400).json({ message: "Friend request already sent!" });
        }

        receiver.friendRequests.push(senderId);
        await receiver.save();

        res.json({ message: "Friend request sent successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/accept-request/:senderId", authenticateToken, async (req, res) => {
    try {
        const receiverId = req.user.id;
        const senderId = req.params.senderId;

        const receiver = await User.findById(receiverId);
        if (!receiver) return res.status(404).json({ message: "User not found" });

        if (!receiver.friendRequests.includes(senderId)) {
            return res.status(400).json({ message: "No friend request from this user!" });
        }

        receiver.friends.push(senderId);
        receiver.friendRequests = receiver.friendRequests.filter(id => id.toString() !== senderId);

        const sender = await User.findById(senderId);
        sender.friends.push(receiverId);

        await receiver.save();
        await sender.save();

        res.json({ message: "Friend request accepted!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/friend-requests", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("friendRequests", "name username");
        res.json({ friendRequests: user.friendRequests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/friends", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate("friends", "name username");
        res.json({ friends: user.friends });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get("/find", authenticateToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) return res.status(404).json({ error: "User not found" });

        const onlineUsers = await User.find({ _id: { $ne: currentUser._id } }); // Fetch all other users

        const match = findMatch(currentUser, onlineUsers);
        if (match) {
            res.json({ match });
        } else {
            res.json({ message: "No suitable match found" });
        }
    } catch (error) {
        console.error("Error finding match:", error);
        res.status(500).json({ error: "Server error" });
    }
});




module.exports = router;
