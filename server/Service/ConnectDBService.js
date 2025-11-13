const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("connect db");
  } catch (error) {
    console.log("cannot connect db: ", error);
  }
};

module.exports = connectDB;