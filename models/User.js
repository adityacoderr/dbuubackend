const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    gender: String,
    profileImage: String,
    interests: [String],
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] 
});

module.exports = mongoose.model("User", UserSchema);
