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
      type: { type: String, enum: ["Movie", "TV Show"] },
      title: String,
      originalName: String,
      posterPath: String,
    },
  ],
});

// Đảm bảo không có validation lỗi
userSchema.set("validateBeforeSave", false);

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
