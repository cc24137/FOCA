const express = require("express");
const router = express.Router();
const UserController = require('../controller/userController');
const userController = new UserController();

router.post("/login", userController.login);
router.post("/cadastro", userController.signUp);

module.exports = router;