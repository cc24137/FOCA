const LeituraAtencaoCRUD = require('../db/leituraAtencaoController');

class LeituraAtencaoController {

  create = async (req, res) => {
    const LeituraAtencaoCRUD = new LeituraAtencaoCRUD();
    const { classId, totalAttentionAverage, processingDate } = req.body;

    await LeituraAtencaoCRUD.create(classId, totalAttentionAverage, processingDate)
      .then((id) => {
        res.status(201).json({ id });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      });
  }
}

module.exports = LeituraAtencaoController;