const express = require("express");
const router = express.Router();
const TurmaDisciplinaProfessorController = require('../controller/turma_disciplina_professorController');
const turmaDisciplinaProfessorController = new TurmaDisciplinaProfessorController();
const verifyToken = require('../middleware/authMiddleware');


router.get("/porProfessor", verifyToken, turmaDisciplinaProfessorController.getByProfessor);
router.get("/:linkId", verifyToken, turmaDisciplinaProfessorController.getByLinkId);

router.post("/relacionar", verifyToken, turmaDisciplinaProfessorController.create);

router.delete("/excluir", verifyToken, turmaDisciplinaProfessorController.delete);

module.exports = router;
