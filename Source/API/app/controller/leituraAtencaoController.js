const LeituraAtencaoCRUD = require('../db/leituraAtencaoCRUD');

class LeituraAtencaoController {

  create = async (req, res) => {
    const leituraAtencaoCRUD = new LeituraAtencaoCRUD();
    const { classId, totalAttentionAverage, processingDate } = req.body;

    await leituraAtencaoCRUD.create(classId, totalAttentionAverage, processingDate)
      .then((id) => {
        res.status(201).json({ id });
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      });
  }

  getByIdAula = async (req, res) => {
    const leituraAtencaoCRUD = new LeituraAtencaoCRUD();
    const { aulaId } = req.params;

    await leituraAtencaoCRUD.getByIdAula(aulaId)
      .then((leituraAtencao) => {
        res.status(200).json(leituraAtencao);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
      });
  }

    getByIdAulaESegundoVideo = async (req, res) => {
        const leituraAtencaoCRUD = new LeituraAtencaoCRUD();
        const { aulaId, segundoVideo } = req.params;

        await leituraAtencaoCRUD.getByIdAulaESegundoVideo(aulaId, segundoVideo)
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
