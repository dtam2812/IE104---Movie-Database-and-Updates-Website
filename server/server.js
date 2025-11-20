const userAdminRoute = require("./Router/UserAdminRoute");
const authRoute = require("./Router/AuthRoute");

// middleware sử dụng cors
app.use(cors());

// middleware lấy dữ liệu từ client qua req.body
app.use(express.json());

// connectDB
connectDB();

// Middleware Router
app.use("/auth/admin", userAdminRoute);
app.use("/api/authUser", userRoute);
app.use("/api", userRoute);
app.use("/api/auth", authRoute);

app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);

});