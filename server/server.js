require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./Service/ConnectDBService");
const userRoute = require("./Router/UserRoute");
const userAdminRoute = require("./Router/UserAdminRoute");
const authRoute = require("./Router/AuthRoute");

//middleware su dung cors
app.use(cors());

//middleware lay du lieu tu client qua req.body
app.use(express.json());

//connectDB
connectDB();

//Middleware Router
app.use("/auth/admin", userAdminRoute);
app.use("/api/authUser", userRoute);
app.use("/api/auth", authRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});
