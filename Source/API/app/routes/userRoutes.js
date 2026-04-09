const express = require("express");
const router = express.Router();
const UserController = require('../controller/userController');
const userController = new UserController();

router.post("/login", userController.login);

module.exports = router;