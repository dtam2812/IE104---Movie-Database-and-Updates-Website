const UserModel = require("../Models/UserModel");

const favoritesController = {
  // Thêm hoặc xóa phim yêu thích
  toggleFavorite: async (req, res) => {
    try {
      const userId = req.user._id;
      const { id, type, title, originalName, posterPath } = req.body;

      if (!id || !type) {
        return res.status(400).json({
          success: false,
          message: "Thiếu thông tin phim",
        });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      const existingIndex = user.favoriteFilm.findIndex(
        (film) => film.id === id && film.type === type
      );

      let action;
      let updateQuery;

      if (existingIndex > -1) {
        action = "removed";
        updateQuery = {
          $pull: {
            favoriteFilm: { id: id, type: type },
          },
        };
      } else {
        action = "added";
        updateQuery = {
          $push: {
            favoriteFilm: {
              id,
              type,
              title: title || "",
              originalName: originalName || "",
              posterPath: posterPath || "",
            },
          },
        };
      }

      const updatedUser = await UserModel.findByIdAndUpdate(
        userId,
        updateQuery,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          message: "Không thể cập nhật người dùng",
        });
      }

      res.json({
        success: true,
        action,
        message:
          action === "added"
            ? "Đã thêm vào yêu thích"
            : "Đã xóa khỏi yêu thích",
        favoriteFilm: updatedUser.favoriteFilm,
      });
    } catch (error) {
      console.error("Toggle favorite error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  // Lấy danh sách phim yêu thích của user
  getUserFavorites: async (req, res) => {
    try {
      const userId = req.user._id;

      const user = await UserModel.findById(userId).select("favoriteFilm");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      res.json({
        success: true,
        favoriteFilm: user.favoriteFilm,
      });
    } catch (error) {
      console.error("Get user favorites error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },

  // Kiểm tra trạng thái yêu thích của một phim
  checkFavoriteStatus: async (req, res) => {
    try {
      const userId = req.user._id;
      const { filmId } = req.params;

      const user = await UserModel.findById(userId).select("favoriteFilm");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      const isFavorite = user.favoriteFilm.some((film) => film.id === filmId);

      res.json({
        success: true,
        isFavorite,
      });
    } catch (error) {
      console.error("Check favorite status error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
      });
    }
  },
};

module.exports = favoritesController;
