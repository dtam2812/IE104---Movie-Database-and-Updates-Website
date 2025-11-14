const express = require("express");
const router = express.Router();
const userController = require("../Controllers/UserController");

router.get("/userDetail/:userId", userController.getUserDetail);
router.put("/updateInfo/:userId", userController.updateInfoUser);
router.put("/updatePassword/:userId", userController.updatePasswordUser);

module.exports = router;
