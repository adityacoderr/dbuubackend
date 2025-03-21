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
        origin: "http://localhost:5173",  // Make sure your frontend is running at this port
        methods: ["GET", "POST"],
    },
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log(" MongoDB Connected"))
    .catch(err => console.error(" MongoDB Error:", err));

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Import Routes
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");
const friendRoutes = require("./routes/friendRoutes");
const postRoutes = require("./routes/postRoutes");
const exploreRoutes = require("./routes/exploreRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/post", postRoutes);
app.use("/api/explore", exploreRoutes);

// Root route for signaling server
app.get("/", (req, res) => {
    res.send("WebRTC Signaling Server is running...");
});

// In-memory data structures to store user data
let onlineUsers = new Map(); // Store online users
let waitingUsers = []; // Store users who are waiting for a match

// WebSocket Connection
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Register the user
    socket.on("register", (userData) => {
        onlineUsers.set(userData.id, { socketId: socket.id, ...userData });
        console.log(`User ${userData.id} is online with interests: ${userData.interests}`);
    });

    // Handle matchmaking logic
    socket.on("findMatch", async ({ userId, gender, interests }) => {
        console.log(`Finding match for ${userId}`);
        console.log("Current waiting users:", waitingUsers); // Log current waiting users
    
        // Check if the user is already in the waiting list
        const waitingUserIndex = waitingUsers.findIndex(user => user.userId === userId);
        if (waitingUserIndex !== -1) {
            // If the user is already in the waiting list, don't add them again
            console.log(`User ${userId} is already in the waiting list`);
            return;
        }
    
        // Add the user to the waiting list if no match is found
        waitingUsers.push({ userId, gender, interests, socketId: socket.id });
        console.log(`⏳ Added ${userId} to waiting list`);
    
        // Now try to find a match
        const matchIndex = waitingUsers.findIndex(
            (user) => user.gender !== gender && user.interests.some(i => interests.includes(i))
        );
    
        if (matchIndex !== -1) {
            const match = waitingUsers.splice(matchIndex, 1)[0];
    
            // Send match info to both users
            io.to(socket.id).emit("matchFound", match);
            io.to(match.socketId).emit("matchFound", { userId, socketId: socket.id });
    
            console.log(`Matched ${userId} with ${match.userId}`);
        } else {
            console.log(`No match found for ${userId}`);
        }
    });
    

    // Handle signaling for WebRTC (offer, answer, ICE candidates)
    socket.on("offer", ({ offer, to }) => {
        console.log(`Sending offer to ${to}`);
        io.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ answer, to }) => {
        console.log(`Sending answer to ${to}`);
        io.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
        console.log(`Sending ICE candidate to ${to}`);
        io.to(to).emit("ice-candidate", { candidate });
    });

    // Handle disconnections
    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);

        // Remove the user from onlineUsers map
        onlineUsers.forEach((userData, userId) => {
            if (userData.socketId === socket.id) {
                onlineUsers.delete(userId);
            }
        });

        // Remove the user from waitingUsers list
        waitingUsers = waitingUsers.filter(user => user.socketId !== socket.id);
    });
});

// Start the server
server.listen(5001, () => console.log("Server running on port 5001"));
