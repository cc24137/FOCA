const express = require("express");
const router = express.Router();
const ProfessorController = require('../controller/professorController');
const professorController = new ProfessorController();
const verifyToken = require('../middlewares/authMiddleware');

router.get("/listar", verifyToken, professorController.listAllProfessors);

module.exports = router;
