const express = require("express");
const router = express.Router();
const userController = require("../Controllers/UserController");

router.get("/users", userController.getListUser);

module.exports = router;
