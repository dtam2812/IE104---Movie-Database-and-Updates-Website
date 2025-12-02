const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    status: { type: String, enum: ["active", "banned"], default: "active" },
    joinDate: {
      type: Date,
      default: Date.now,
    },
    favoriteFilm: [
      {
        id: String,
        type: { type: String, enum: ["Movie", "TV"] },
        title: String,
        originalName: String,
        posterPath: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.set("validateBeforeSave", false);

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
