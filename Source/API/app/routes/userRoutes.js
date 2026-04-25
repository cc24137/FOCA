const express = require("express");
const router = express.Router();
const UserController = require('../controller/userController');
const userController = new UserController();
const verifyToken = require('../middlewares/authMiddleware');

router.post("/login", verifyToken, userController.login);
router.post("/cadastro", verifyToken, userController.signUp);
router.post("/enviarCodigo", verifyToken, userController.sendCode);
router.put("/validarCodigo", verifyToken, userController.verify);
router.put("/mudarSenha", verifyToken, userController.changePassword);

module.exports = router;
