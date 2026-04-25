const express = require("express");
const router = express.Router();
const TurmaController = require('../controller/turmaController');
const turmaController = new TurmaController();
const verifyToken = require('../middlewares/authMiddleware');


router.get("/porId", verifyToken, turmaController.getById);
router.get("/porInstituicao", verifyToken, turmaController.getByInstitution);
router.post("/cadastrar", verifyToken, turmaController.create);
router.put("/atualizar", verifyToken, turmaController.update);
router.delete("/excluir", verifyToken, turmaController.delete);

module.exports = router;
