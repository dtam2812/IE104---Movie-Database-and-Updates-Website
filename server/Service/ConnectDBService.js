const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb://localhost:${process.env.PORT_MONGOOSE}/${process.env.DATABASE_NAME}`
    );
    console.log("connect db");
  } catch (error) {
    console.log("cannot connect db: ", error);
  }
};

module.exports = connectDB;
