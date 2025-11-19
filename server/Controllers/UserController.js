const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../Models/UserModel");

// Lấy thông tin user hiện tại từ token
const getUser = async (req, res) => {
  try {
    console.log("GetUser called with user ID:", req.user._id);

    const user = await userModel.findById(req.user._id).select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // ✅ NORMALIZE type của favorites trước khi gửi về client
    const normalizedFavorites = user.favoriteFilm.map((film) => ({
      ...(film.toObject ? film.toObject() : film),
      type: normalizeFilmType(film.type), // Gọi hàm normalize
    }));

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        status: user.status,
        joinDate: user.joinDate,
        favoriteFilm: normalizedFavorites, // ✅ Dùng normalized
        phone: user.phone || "",
        birthday: user.birthday || "",
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// ✅ Thêm hàm normalize type
function normalizeFilmType(type) {
  if (!type) return "Movie";

  const typeStr = String(type).trim().toLowerCase();

  // Nếu là TV Show, trả về "TV"
  if (
    typeStr.includes("tv") ||
    typeStr.includes("tvshow") ||
    typeStr === "series"
  ) {
    return "TV";
  }

  return "Movie";
}

const getUserDetail = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findById(userId).select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const updateInfoUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email } = req.body;

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, { userName: name, email }, { new: true })
      .select("-password");

    if (!updatedUser)
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const updatePasswordUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await userModel.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "Người dùng không tồn tại" });

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword)
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu hiện tại không đúng" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res
      .status(200)
      .json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Thêm hoặc xóa phim yêu thích
const toggleFavorite = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id, type, title, originalName, posterPath } = req.body;

    if (!id || !type) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin phim",
      });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    // ✅ Sửa: So sánh đúng - convert thành string
    const existingIndex = user.favoriteFilm.findIndex(
      (film) => film.id.toString() === id.toString() && film.type === type
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

    const updatedUser = await userModel.findByIdAndUpdate(userId, updateQuery, {
      new: true,
      runValidators: true,
    });

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
        action === "added" ? "Đã thêm vào yêu thích" : "Đã xóa khỏi yêu thích",
      favoriteFilm: updatedUser.favoriteFilm,
    });
  } catch (error) {
    console.error("Toggle favorite error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server",
    });
  }
};

// Lấy danh sách phim yêu thích của user
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId).select("favoriteFilm");
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
};

// Kiểm tra trạng thái yêu thích của một phim
const checkFavoriteStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const { filmId } = req.params;

    const user = await userModel.findById(userId).select("favoriteFilm");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    const isFavorite = user.favoriteFilm.some(
      (film) => film.id.toString() === filmId.toString()
    );

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
};

module.exports = {
  getUser,
  getUserDetail,
  updateInfoUser,
  updatePasswordUser,
  toggleFavorite,
  getUserFavorites,
  checkFavoriteStatus,
};
