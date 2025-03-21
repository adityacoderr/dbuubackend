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
let waitingUsers = []; // Queue to store users waiting for a match

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // When a user is looking for a match
    socket.on("findMatch", ({ userId, gender, interests }) => {
        console.log(`User ${userId} is looking for a match.`);

        // Check if another user is already waiting
        if (waitingUsers.length > 0) {
            const matchedUser = waitingUsers.shift(); // Get the first user in the queue

            // Create a unique room for both users
            const room = `room-${socket.id}-${matchedUser.socketId}`;

            // Notify both users that they are matched
            socket.join(room);
            matchedUser.socket.join(room);

            io.to(room).emit("matchFound", {
                matchedUser: matchedUser.userId,
                socketId: matchedUser.socketId,
                room
            });

            console.log(`Matched ${userId} with ${matchedUser.userId} in ${room}`);
        } else {
            // No match found, add user to waiting list
            waitingUsers.push({ socket, userId, socketId: socket.id, gender, interests });
            console.log(`User ${userId} added to the waiting list.`);
        }
    });

    // WebRTC Signaling

    // Handle WebRTC offer
    socket.on("offer", ({ offer, to }) => {
        console.log(`Offer sent from ${socket.id} to ${to}`);
        io.to(to).emit("offer", { offer, from: socket.id });
    });

    // Handle WebRTC answer
    socket.on("answer", ({ answer, to }) => {
        console.log(`Answer sent from ${socket.id} to ${to}`);
        io.to(to).emit("answer", { answer, from: socket.id });
    });

    // Handle ICE Candidate
    socket.on("ice-candidate", ({ candidate, to }) => {
        console.log(`ICE Candidate sent from ${socket.id} to ${to}`);
        io.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
        waitingUsers = waitingUsers.filter(user => user.socketId !== socket.id);
        console.log(`User disconnected: ${socket.id}`);
    });
});


// Start the server
server.listen(5001, () => console.log("Server running on port 5001"));
