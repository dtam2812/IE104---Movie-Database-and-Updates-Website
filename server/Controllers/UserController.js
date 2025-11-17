const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../Models/UserModel");

// THÊM HÀM NÀY - lấy thông tin user hiện tại từ token
const getUser = async (req, res) => {
  try {
    console.log("GetUser called with user ID:", req.user._id);

    const user = await userModel.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
        status: user.status,
        joinDate: user.joinDate,
        favoriteFilm: user.favoriteFilm || [],
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

const getUserDetail = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findById(userId).select("-password"); // loại bỏ password

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

// THÊM getUser VÀO EXPORT
module.exports = {
  getUser, // THÊM DÒNG NÀY
  getUserDetail,
  updateInfoUser,
  updatePasswordUser,
};
