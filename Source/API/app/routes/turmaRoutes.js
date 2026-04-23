const express = require("express");
const router = express.Router();
const TurmaController = require('../controller/turmaController');
const turmaController = new TurmaController();

router.get("/porId", turmaController.getById);
router.get("/porInstituicao", turmaController.getByInstitution);
router.post("/cadastrar", turmaController.create);
router.put("/atualizar", turmaController.update);
router.delete("/excluir", turmaController.delete);

module.exports = router;
