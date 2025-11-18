const express = require("express");
const router = express.Router();
const userAdminController = require("../Controllers/UserAdminController");

router.get("/users", userAdminController.getListUser);
router.post("/users", userAdminController.createUser);
router.put("/users/:id", userAdminController.updateUser);
router.delete("/users/:id", userAdminController.deleteUser);

module.exports = router;
