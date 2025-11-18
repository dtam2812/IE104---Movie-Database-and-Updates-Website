const express = require("express");
const router = express.Router();
const userController = require("../Controllers/UserController");
const authMiddleware = require("../middleware/AuthMiddlware");

// User routes
router.get("/getUser", authMiddleware, userController.getUser);
router.get("/userDetail/:userId", userController.getUserDetail);
router.put("/updateInfo/:userId", userController.updateInfoUser);
router.put("/updatePassword/:userId", userController.updatePasswordUser);

// Favorite routes
router.post("/favorites/toggle", authMiddleware, userController.toggleFavorite);
router.get(
  "/favorites/user-favorites",
  authMiddleware,
  userController.getUserFavorites
);
router.get(
  "/favorites/check/:filmId",
  authMiddleware,
  userController.checkFavoriteStatus
);

module.exports = router;
