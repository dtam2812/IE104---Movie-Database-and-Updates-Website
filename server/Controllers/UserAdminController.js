const jwt = require("jsonwebtoken");
const UserModel = require("../Models/UserModel");
const bcrypt = require("bcryptjs");

const getListUser = async (req, res) => {
  const bearerHeader = req.headers["authorization"];
  const accessToken = bearerHeader?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).send({ error: "No token provided" });
  }

  try {
    const decodeJwt = jwt.verify(accessToken, process.env.SECRET_JWT);
    if (decodeJwt) {
      const users = await UserModel.find().select("-password");
      res.status(200).send(users);
    }
  } catch (error) {
    console.log(error);
    res.status(401).send({ error: "Invalid token" });
  }
};

const createUser = async (req, res) => {
  const bearerHeader = req.headers["authorization"];
  const accessToken = bearerHeader?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).send({ error: "No token provided" });
  }

  try {
    const decodeJwt = jwt.verify(accessToken, process.env.SECRET_JWT);
    if (decodeJwt) {
      const { userName, email, password, role, status } = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
        return res.status(400).send({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      const newUser = new UserModel({
        userName,
        email,
        password: hashedPassword,
        role: role || "user",
        status: status || "active",
        joinDate: new Date(),
      });

      await newUser.save();

      // Return user without password
      const userResponse = { ...newUser.toObject() };
      delete userResponse.password;

      res.status(201).send(userResponse);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to create user" });
  }
};

const updateUser = async (req, res) => {
  const bearerHeader = req.headers["authorization"];
  const accessToken = bearerHeader?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).send({ error: "No token provided" });
  }

  try {
    const decodeJwt = jwt.verify(accessToken, process.env.SECRET_JWT);
    if (decodeJwt) {
      const { id } = req.params;
      const { userName, email, role, status } = req.body;

      const updateData = {};
      if (userName) updateData.userName = userName;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (status) updateData.status = status;

      const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, {
        new: true,
      }).select("-password");

      if (!updatedUser) {
        return res.status(404).send({ error: "User not found" });
      }

      res.status(200).send(updatedUser);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to update user" });
  }
};

const deleteUser = async (req, res) => {
  const bearerHeader = req.headers["authorization"];
  const accessToken = bearerHeader?.split(" ")[1];

  if (!accessToken) {
    return res.status(401).send({ error: "No token provided" });
  }

  try {
    const decodeJwt = jwt.verify(accessToken, process.env.SECRET_JWT);
    if (decodeJwt) {
      const { id } = req.params;

      const deletedUser = await UserModel.findByIdAndDelete(id);

      if (!deletedUser) {
        return res.status(404).send({ error: "User not found" });
      }

      res.status(200).send({ message: "User deleted successfully" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "Failed to delete user" });
  }
};

module.exports = {
  getListUser,
  createUser,
  updateUser,
  deleteUser,
};
