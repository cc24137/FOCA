const RelatorioCRUD = require('../db/relatorioCRUD');

class RelatorioController {

  create = async (req, res) => {
    const relatorioCRUD = new RelatorioCRUD();
    const { classId, totalAttentionAverage, processingDate } = req.body;

    await relatorioCRUD.create(classId, totalAttentionAverage, processingDate)
      .then((id) => {
        res.status(201).json({ id });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      });
  }
}

module.exports = RelatorioController;