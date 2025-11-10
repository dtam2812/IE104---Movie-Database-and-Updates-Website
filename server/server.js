const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./Service/ConnectDBService");
const userRoute = require("./Router/UserRoute");
const authRoute = require("./Router/AuthRoute");

//port
const port = 5000;

//middleware su dung cors
app.use(cors());

//middleware lay du lieu tu client qua req.body
app.use(express.json());

//connectDB
connectDB();

//Middleware Router
app.use("/users", userRoute);
app.use("/api/auth", authRoute);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
