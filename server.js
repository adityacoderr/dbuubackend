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
const groupRoutes = require("./routes/groupRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/post", postRoutes);
app.use("/api/explore", exploreRoutes);
app.use("/api/groups", groupRoutes);


app.get("/", (req, res) => {
    res.send("WebRTC Signaling Server is running...");
});

let waitingUsers = []; 

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on("findMatch", ({ userId, gender, interests }) => {
        console.log(`User ${userId} is looking for a match.`);

        if (waitingUsers.length > 0) {
            const matchedUser = waitingUsers.shift(); 

            const room = `room-${socket.id}-${matchedUser.socketId}`;

            socket.join(room);
            matchedUser.socket.join(room);

            io.to(room).emit("matchFound", {
                matchedUser: matchedUser.userId,
                socketId: matchedUser.socketId,
                room
            });

            console.log(`Matched ${userId} with ${matchedUser.userId} in ${room}`);
        } else {
            waitingUsers.push({ socket, userId, socketId: socket.id, gender, interests });
            console.log(`User ${userId} added to the waiting list.`);
        }
    });

   
    socket.on("offer", ({ offer, to }) => {
        console.log(`Offer sent from ${socket.id} to ${to}`);
        io.to(to).emit("offer", { offer, from: socket.id });
    });

    socket.on("answer", ({ answer, to }) => {
        console.log(`Answer sent from ${socket.id} to ${to}`);
        io.to(to).emit("answer", { answer, from: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, to }) => {
        console.log(`ICE Candidate sent from ${socket.id} to ${to}`);
        io.to(to).emit("ice-candidate", { candidate, from: socket.id });
    });

    socket.on("disconnect", () => {
        waitingUsers = waitingUsers.filter(user => user.socketId !== socket.id);
        console.log(`User disconnected: ${socket.id}`);
    });
});


server.listen(5001, () => console.log("Server running on port 5001"));
