const { Server } = require("socket.io");

const io = new Server(5001, {
    cors: { origin: "http://localhost:5173" } // Allow frontend to connect
});


let onlineUsers = new Set();

io.on("connection", (socket) => {
    // console.log("A user connected:", socket.id);

    socket.on("user-online", (username) => {
        if (username) {
            onlineUsers.add(username);
            io.emit("update-online-users", onlineUsers.size);
        }
    });

    socket.on("user-offline", (username) => {
        if (username) {
            onlineUsers.delete(username);
            io.emit("update-online-users", onlineUsers.size);
        }
    });

    socket.on("disconnect", () => {
        // console.log("A user disconnected:", socket.id);
    });
});

module.exports = io;
