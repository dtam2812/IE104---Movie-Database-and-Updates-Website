const express = require("express");
const router = express.Router();
const userController = require("../Controllers/UserController");

router.get("/userDetail/:userId", userController.getUserDetail);
router.put("/update/:userId", userController.updateUser);

module.exports = router;
