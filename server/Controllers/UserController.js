const jwt = require("jsonwebtoken");
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

const updateUser = async (req, res) => {
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

module.exports = {
  getUserDetail,
  updateUser,
};
