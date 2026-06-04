const express = require("express");
const router = express.Router();
const LeituraAtencaoController = require('../controller/leituraAtencaoController');
const leituraAtencaoController = new LeituraAtencaoController();
const verifyToken = require('../middleware/authMiddleware');

router.get("/:aulaId/:segundoVideo", verifyToken, leituraAtencaoController.getByIdAula);
router.get("/:aulaId/:segundoVideo", verifyToken, leituraAtencaoController.getByIdAulaESegundoVideo);
router.post("/criar", verifyToken, leituraAtencaoController.create);

module.exports = router;
