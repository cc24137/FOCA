const express = require("express");
const router = express.Router();
const DisciplinaController = require('../controller/disciplinaController');
const disciplinaController = new DisciplinaController();

router.get("/porId", disciplinaController.getById);
router.get("/porInstituicao", disciplinaController.getByInstitution);
router.post("/cadastrar", disciplinaController.create);
router.put("/atualizar", disciplinaController.update);
router.delete("/excluir", disciplinaController.delete);

module.exports = router;
