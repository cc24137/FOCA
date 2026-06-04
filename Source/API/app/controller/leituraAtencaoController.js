const LeituraAtencaoCRUD = require('../db/leituraAtencaoCRUD');

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

  getByIdAula = async (req, res) => {
    const LeituraAtencaoCRUD = new LeituraAtencaoCRUD();
    const { aulaId } = req.params;

    await LeituraAtencaoCRUD.getByIdAula(aulaId)
      .then((leituraAtencao) => {
        res.status(200).json(leituraAtencao);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      });
  }

    getByIdAulaESegundoVideo = async (req, res) => {
        const LeituraAtencaoCRUD = new LeituraAtencaoCRUD();
        const { aulaId, segundoVideo } = req.params;

        await LeituraAtencaoCRUD.getByIdAulaESegundoVideo(aulaId, segundoVideo)
            .then((leituraAtencao) => {
                res.status(200).json(leituraAtencao);
            })
            .catch((error) => {
                console.log(error);
                res.status(500).json({ error: "Internal server error" });
            });
    }
}

module.exports = LeituraAtencaoController;
