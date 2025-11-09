const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/MovieWeb");
    console.log("connect db");
  } catch (error) {
    console.log("cannot connect db: ", error);
  }
};

module.exports = connectDB;
