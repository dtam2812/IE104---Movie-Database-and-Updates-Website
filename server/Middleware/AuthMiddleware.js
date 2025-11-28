const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {

    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No Bearer token found");
      return res.status(401).json({
        success: false,
        message: "Không có token, truy cập bị từ chối",
      });
    }

    const token = authHeader.replace("Bearer ", "");

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
    res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

module.exports = authMiddleware;
