require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const connectDB = require("./Service/ConnectDBService");
const userRoute = require("./Router/UserRoute");
const userAdminRoute = require("./Router/UserAdminRoute");
const authRoute = require("./Router/AuthRoute");

// Middleware
app.use(cors({
  origin: "*" // hoặc chỉ định Netlify của bạn nếu muốn bảo mật hơn
}));
app.use(express.json());

// Kết nối DB
connectDB();

// === THÊM 2 DÒNG NÀY ĐỂ TEST SERVER SỐNG ===
app.get("/", (req, res) => {
  res.json({ 
    message: "Backend IE104 - Movie Database đang chạy ngon lành!",
    status: "OK",
    timestamp: new Date().toISOString(),
    endpoints: {
      users: "/api/users",
      auth: "/api/auth",
      admin: "/auth/admin"
    }
  });
});
// =========================================

// Routes
app.use("/auth/admin", userAdminRoute);
app.use("/api/authUser", userRoute);
app.use("/api", userRoute);           // có thể bạn đang dùng 2 cái này trùng → để lại 1 cái thôi cũng được
app.use("/api/auth", authRoute);

// 404 cho các route không tồn tại
app.use("* classics", (req, res) => {
  res.status(404).json({ message: "Route không tồn tại" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại port ${PORT}`);
  console.log(`Link backend: https://ie104-movie-database-and-updates-website-c4yi.onrender.com`);
});