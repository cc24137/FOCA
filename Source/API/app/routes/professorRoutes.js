const express = require("express");
const router = express.Router();
const ProfessorController = require('../controller/professorController');
const professorController = new ProfessorController();

router.get("/listar", professorController.listAllProfessors);

module.exports = router;
