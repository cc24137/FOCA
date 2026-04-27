const express = require("express");
const router = express.Router();
const DisciplinaController = require('../controller/disciplinaController');
const disciplinaController = new DisciplinaController();
const verifyToken = require('../middleware/authMiddleware');

router.get("/porId", verifyToken, disciplinaController.getById);
router.get("/porInstituicao", verifyToken, disciplinaController.getByInstitution);
router.post("/cadastrar", verifyToken, disciplinaController.create);
router.put("/atualizar", verifyToken, disciplinaController.update);
router.delete("/excluir", verifyToken, disciplinaController.delete);

module.exports = router;
