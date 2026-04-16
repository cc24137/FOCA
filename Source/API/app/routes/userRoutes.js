const express = require("express");
const router = express.Router();
const UserController = require('../controller/userController');
const userController = new UserController();

router.post("/login", userController.login);
router.post("/cadastro", userController.signUp);
router.post("/enviarCodigo", userController.register);
router.put("/validarCodigo", userController.verify);

module.exports = router;