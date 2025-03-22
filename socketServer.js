const { Server } = require("socket.io");

const io = new Server(5001, {
    cors: { origin: "http://localhost:5173" } 
});


let onlineUsers = new Set();

io.on("connection", (socket) => {
    

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
        console.log("A user disconnected:", socket.id);
    });
});

module.exports = io;
