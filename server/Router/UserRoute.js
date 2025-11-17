const express = require("express");
const router = express.Router();
const userController = require("../Controllers/UserController");
const authMiddleware = require("../middleware/AuthMiddlware"); // chắc chắn import đúng

router.get("/getUser", authMiddleware, userController.getUser); // authMiddleware trước

// Các route khác giữ nguyên
router.get("/userDetail/:userId", userController.getUserDetail);
router.put("/updateInfo/:userId", userController.updateInfoUser);
router.put("/updatePassword/:userId", userController.updatePasswordUser);

module.exports = router;
