const express = require("express");
const router = express.Router();
const InstituicaoController = require('../controller/instituicaoController');
const instituicaoController = new InstituicaoController();
const verifyToken = require('../middleware/authMiddleware');

router.get("/porId", verifyToken, instituicaoController.getById);
router.put("/atualizar", verifyToken, instituicaoController.update);
router.delete("/excluir", verifyToken, instituicaoController.delete);

module.exports = router;
