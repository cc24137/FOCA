const express = require("express");
const router = express.Router();
const AulaController = require('../controller/aulaController');
const aulaController = new AulaController();
const verifyToken = require('../middleware/authMiddleware');

router.get("/classificacao-conteudo", verifyToken, aulaController.getAllClassificacaoConteudo);
router.get("/:linkId", verifyToken, aulaController.getByLinkId);

router.post("/criar", verifyToken, aulaController.create);

router.delete("/excluir", verifyToken, aulaController.delete);


module.exports = router;
