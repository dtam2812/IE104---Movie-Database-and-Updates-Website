const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userName: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
  favoriteFilm: [
    {
      id: String,
      type: { type: String, enum: ["movie", "tv"] },
      title: String,
      originalName: String,
      posterPath: String,
      backdropPath: String,
    },
  ],
});

//compiler
const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
