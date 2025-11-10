const userModel = require("../Models/UserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    await userModel.create({
      username: name,
      email: email,
      password: bcrypt.hashSync(password, 10),
      role: "user",
    });

    return res.status(200).send("register");
  } catch (error) {
    console.log(error);
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne(email);
    if (!user) return res.status(400).send("invalid user");

    const validPass = bcrypt.compareSync(password, user.password);
    if (!validPass) return res.status(400).send("invalid password");

    return res.status(200).send("login valid");
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  register,
  login,
};
