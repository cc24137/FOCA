const express = require("express");
const router = express.Router();
const RelatorioController = require('../controller/relatorioController');
const relatorioController = new RelatorioController();
const verifyToken = require('../middleware/authMiddleware');


router.post("/criar", verifyToken, relatorioController.create);

module.exports = router;
