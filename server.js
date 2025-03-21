const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const path = require("path");

const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
    },
});

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Import routes
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");
const friendRoutes = require("./routes/friendRoutes");
const postRoutes = require("./routes/postRoutes")

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/post",postRoutes);


app.get("/", (req, res) => {
    res.send("WebRTC Signaling Server is running...");
});

// 🟢 **Store Online Users**
let onlineUsers = new Map();
let waitingUsers = []; // Store unmatched users

io.on("connection", (socket) => {
    console.log("⚡ User connected:", socket.id);

    // ✅ **User registers for matching**
    socket.on("register", (userData) => {
        onlineUsers.set(userData.id, { socketId: socket.id, ...userData });
        console.log(`✅ User ${userData.id} is online`);
    });

    // ✅ **Find Best Match & Start Call**
    socket.on("findMatch", ({ userId, gender, interests }) => {
        console.log(`🔍 Finding match for ${userId}`);

        // Try to find an opposite-gender match with common interests
        const matchIndex = waitingUsers.findIndex(
            (user) => user.gender !== gender && user.interests.some(i => interests.includes(i))
        );

        if (matchIndex !== -1) {
            // Match found! Remove from waiting list
            const match = waitingUsers.splice(matchIndex, 1)[0];

            // Notify both users
            io.to(socket.id).emit("matchFound", match);
            io.to(match.socketId).emit("matchFound", { userId, socketId: socket.id });

            console.log(`✅ Matched ${userId} with ${match.userId}`);
        } else {
            // No match yet, add to waiting list
            waitingUsers.push({ userId, gender, interests, socketId: socket.id });
            console.log(`⏳ Added ${userId} to waiting list`);
        }
    });

    // ✅ **Handle WebRTC Signaling**
    socket.on("offer", ({ offer, to }) => {
        console.log(`📤 Sending offer to ${to}`);
        io.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ answer, to }) => {
        console.log(`📤 Sending answer to ${to}`);
        io.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
        console.log(`📤 Sending ICE candidate to ${to}`);
        io.to(to).emit("ice-candidate", { candidate });
    });

    // ✅ **Handle Disconnection**
    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
        onlineUsers.forEach((userData, userId) => {
            if (userData.socketId === socket.id) {
                onlineUsers.delete(userId);
            }
        });
        waitingUsers = waitingUsers.filter(user => user.socketId !== socket.id);
    });
});

server.listen(5001, () => console.log("🚀 Server running on port 5001"));
