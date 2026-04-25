const express = require("express");
const router = express.Router();
const UserController = require('../controller/userController');
const userController = new UserController();

router.post("/login", userController.login);
router.post("/cadastro", userController.signUp);
router.post("/enviarCodigo", userController.sendCode);
router.put("/validarCodigo", userController.verify);
router.put("/mudarSenha", userController.changePassword);

module.exports = router;
