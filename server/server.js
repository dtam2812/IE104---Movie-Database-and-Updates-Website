const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./Service/ConnectDBService");
const userRoute = require("./Router/UserRoute");
const authRoute = require("./Router/AuthRoute");

require("dotenv").config();

//middleware su dung cors
app.use(cors());

//middleware lay du lieu tu client qua req.body
app.use(express.json());

//connectDB
connectDB();

//Middleware Router
app.use("/auth/admin", userRoute);
app.use("/api/auth", authRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
