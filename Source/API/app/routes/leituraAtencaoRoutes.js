const express = require("express");
const router = express.Router();
const LeituraAtencaoController = require('../controller/leituraAtencaoController');
const leituraAtencaoController = new LeituraAtencaoController();
const verifyToken = require('../middleware/authMiddleware');

router.get("/:aulaId/:segundoVideo", verifyToken, leituraAtencaoController.getByLinkId);
router.post("/criar", verifyToken, relatorioController.create);

module.exports = router;
