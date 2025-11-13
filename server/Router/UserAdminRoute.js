const express = require("express");
const router = express.Router();
const userAdminController = require("../Controllers/UserAdminController");

router.get("/users", userAdminController.getListUser);

module.exports = router;