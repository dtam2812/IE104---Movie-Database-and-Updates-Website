const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "banned"], default: "active" },
  joinDate: Date,
  favoriteFilm: [
    {
      id: String,
      type: { type: String, enum: ["movie", "tv"] },
      title: String,
      originalName: String,
      posterPath: String,
    },
  ],
});

//compiler
const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;