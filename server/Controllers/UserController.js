const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userModel = require("../Models/UserModel");

const getUserDetail = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userModel.findById(userId);
    return res.status(200).send(user);
  } catch (error) {
    console.log(error);
  }
};

const updateInfoUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { name, email } = req.body;

    const updateUser = await userModel.findByIdAndUpdate(
      userId,
      {
        userName: name,
        email: email,
      },
      { new: true }
    );

    return res.status(200).send(updateUser);
  } catch (error) {
    console.log(error);
  }
};

const updatePasswordUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const { currentPassword, newPassword } = req.body;

    const user = await userModel.findById(userId);
    if (!user) return res.status(400).send("Không tồn tại người dùng");

    const validPassword = bcrypt.compareSync(currentPassword, user.password);
    if (!validPassword) return res.status(400).send("Mật khẩu không đúng");

    const updateUser = await userModel.findByIdAndUpdate(
      userId,
      {
        password: bcrypt.hashSync(newPassword, 10),
      },
      { new: true }
    );
    return res.status(200).json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getUserDetail,
  updateInfoUser,
  updatePasswordUser,
};
