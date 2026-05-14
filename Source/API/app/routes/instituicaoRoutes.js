const express = require("express");
const router = express.Router();
const InstituicaoController = require('../controller/instituicaoController');
const instituicaoController = new InstituicaoController();
const verifyToken = require('../middleware/authMiddleware');

router.get("/porId", verifyToken, instituicaoController.getById);

router.post("/convidar", verifyToken, instituicaoController.inviteProfessor);

router.put("/atualizar", verifyToken, instituicaoController.update);

router.delete("/excluir", verifyToken, instituicaoController.delete);
router.delete("/removerProfessor", verifyToken, instituicaoController.removeProfessor);

module.exports = router;
