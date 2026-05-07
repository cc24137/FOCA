const express = require("express");
const router = express.Router();
const ProfessorController = require('../controller/professorController');
const professorController = new ProfessorController();
const verifyToken = require('../middleware/authMiddleware');

router.get("/listar", verifyToken, professorController.listAllProfessors);
router.get("/porId", verifyToken, professorController.getById);

router.put("/aceitarConvite", verifyToken, professorController.acceptInvitation);
router.put("/atualizar", verifyToken, professorController.update);

router.delete("/excluir", verifyToken, professorController.delete);
router.delete("/recusarConvite", verifyToken, professorController.denyInvitation);

module.exports = router;
