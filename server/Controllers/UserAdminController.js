const jwt = require("jsonwebtoken");
const userModel = require("../Models/UserModel");

const getListUser = async (req, res) => {
  const bearerHeader = req.headers["authorization"];
  const accessToken = bearerHeader.split(" ")[1];

  try {
    const decodeJwt = jwt.verify(accessToken, process.env.SECRET_JWT);
    if (decodeJwt) {
      const users = await userModel.find();
      res.status(200).send(users);
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getListUser,
};
