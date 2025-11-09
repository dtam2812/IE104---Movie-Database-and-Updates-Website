const express = require("express");
const router = express.Router();
const userController = require("../Controllers/UserController");

router.get("/userlist", userController.getListUser);
router.get("/userdetail", userController.userDetail);

module.exports = router;
