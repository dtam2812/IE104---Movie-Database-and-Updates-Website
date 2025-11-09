const express = require("express");
const router = express.Router();
const userController = require("../Controllers/UserController");

router.get("/list", userController.getListUser);
router.get("/detail", userController.userDetail);

module.exports = router;
