const express = require("express");
const router = express.Router();
const ProfessorController = require('../controller/professorController');
const professorController = new ProfessorController();
const verifyToken = require('../middleware/authMiddleware');

router.get("/listar", verifyToken, professorController.listAllProfessors);
router.get("/porId", verifyToken, professorController.getById);
router.put("/atualizar", verifyToken, professorController.update);
router.delete("/excluir", verifyToken, professorController.delete);

module.exports = router;
