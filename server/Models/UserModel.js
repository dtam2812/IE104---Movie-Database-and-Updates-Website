const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["User", "Admin"], default: "User" },
  status: { type: String, enum: ["Active", "Banned"], default: "Active" },
  joinDate: Date,
  favoriteFilm: [
    {
      id: String,
      type: { type: String, enum: ["Movie", "TV Show"] },
      title: String,
      originalName: String,
      posterPath: String,
    },
  ],
});

//compiler
const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
