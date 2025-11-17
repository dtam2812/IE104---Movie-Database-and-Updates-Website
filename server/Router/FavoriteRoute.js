const express = require("express");
const router = express.Router();
const favoritesController = require("../Controllers/FavoriteController");
const authMiddleware = require("../middleware/AuthMiddlware");

// Tất cả routes đều yêu cầu xác thực
router.use(authMiddleware);

// Thêm/xóa phim yêu thích
router.post("/toggle", favoritesController.toggleFavorite);

// Lấy danh sách phim yêu thích của user
router.get("/user-favorites", favoritesController.getUserFavorites);

// Kiểm tra trạng thái yêu thích của một phim
router.get("/check/:filmId", favoritesController.checkFavoriteStatus);

module.exports = router;
