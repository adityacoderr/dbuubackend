const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const authenticateToken = require("../middleware/authMiddleware");

// ✅ Send a Message
router.post("/send", authenticateToken, async (req, res) => {
    try {
        const { receiverId, message } = req.body;
        const senderId = req.user.id;

        const newMessage = new Message({ sender: senderId, receiver: receiverId, text: message });
        await newMessage.save();

        res.json({ message: "Message sent!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ✅ Get Chat Messages
router.get("/:receiverId", authenticateToken, async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.receiverId;
        const messages = await Message.find({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId }
            ]
        }).sort({ timestamp: 1 });
        

        if (!messages) return res.status(404).json({ message: "Messages not found" });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
