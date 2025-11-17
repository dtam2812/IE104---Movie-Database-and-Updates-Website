require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path"); // Thêm import path để sử dụng sendFile
const connectDB = require("./Service/ConnectDBService");
const userRoute = require("./Router/UserRoute");
const userAdminRoute = require("./Router/UserAdminRoute");
const authRoute = require("./Router/AuthRoute");

// Middleware sử dụng cors
app.use(cors());

// Middleware lấy dữ liệu từ client qua req.body
app.use(express.json());

// Serve static files từ thư mục client (để load HTML, CSS, JS, images)
app.use('/client', express.static(path.join(__dirname, '../client')));

// ConnectDB
connectDB();

// Middleware Router (API routes)
app.use("/auth/admin", userAdminRoute);
app.use("/api/authUser", userRoute);
app.use("/api/auth", authRoute);

// Middleware catch 404 (phải đặt CUỐI CÙNG, sau tất cả routes và static serve)
app.use((req, res, next) => {
  // Log để debug (optional)
  console.log(`404: Route không tồn tại - ${req.method} ${req.originalUrl}`);

  // Gửi file 404.html với status 404
  res.status(404).sendFile(path.join(__dirname, '../client/view/pages/404.html'));
});

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});