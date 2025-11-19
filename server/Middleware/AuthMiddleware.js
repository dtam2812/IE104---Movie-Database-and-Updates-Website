const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // console.log("=== Middleware Auth Debug ===");

    const authHeader = req.header("Authorization");
    // console.log("Authorization Header:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No Bearer token found");
      return res.status(401).json({
        success: false,
        message: "Không có token, truy cập bị từ chối",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    // console.log("Token extracted:", token ? "Có" : "Không");

    if (!token) {
      console.log("Không có token");
      return res.status(401).json({
        success: false,
        message: "Không có token, truy cập bị từ chối",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_JWT);

    req.user = decoded;
    next();
  } catch (error) {
    // console.log("Token verification error:", error.message);
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

module.exports = authMiddleware;
