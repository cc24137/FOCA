const LeituraAtencaoCRUD = require('../db/leituraAtencaoCRUD');

class LeituraAtencaoController {

    create = async (req, res) => {
        const leituraAtencaoCRUD = new LeituraAtencaoCRUD();
    
        const {
            idAula,
            segundoVideo,
            indiceAtencao
        } = req.body;
    
        if (
            idAula === undefined ||
            segundoVideo === undefined ||
            indiceAtencao === undefined
        ) {
            return res.status(400).json({
                error: "idAula, segundoVideo e indiceAtencao são obrigatórios"
            });
        }
    
        try {
            const leitura = await leituraAtencaoCRUD.create(
                idAula,
                segundoVideo,
                indiceAtencao
            );
    
            return res.status(201).json(leitura);
        }
        catch (error) {
            console.log(error);
    
            return res.status(500).json({
                error: "Internal server error"
            });
        }
    };

    createMany = async (req, res) => {
        const leituraAtencaoCRUD = new LeituraAtencaoCRUD();
    
        const {
            idAula,
            leituras
        } = req.body;
    
        if (idAula === undefined) {
            return res.status(400).json({
                error: "idAula é obrigatório"
            });
        }
    
        if (!Array.isArray(leituras) || leituras.length === 0) {
            return res.status(400).json({
                error: "leituras deve ser uma lista não vazia"
            });
        }
    
        for (let i = 0; i < leituras.length; i++) {
            const leitura = leituras[i];
    
            if (
                leitura.segundoVideo === undefined ||
                leitura.indiceAtencao === undefined
            ) {
                return res.status(400).json({
                    error:
                        `Leitura na posição ${i} deve possuir segundoVideo e indiceAtencao`
                });
            }
    
            const segundoVideo = Number(leitura.segundoVideo);
            const indiceAtencao = Number(leitura.indiceAtencao);
    
            if (
                !Number.isInteger(segundoVideo) ||
                segundoVideo < 0
            ) {
                return res.status(400).json({
                    error:
                        `segundoVideo inválido na leitura da posição ${i}`
                });
            }
    
            if (
                Number.isNaN(indiceAtencao) ||
                indiceAtencao < 0 ||
                indiceAtencao > 100
            ) {
                return res.status(400).json({
                    error:
                        `indiceAtencao inválido na leitura da posição ${i}`
                });
            }
        }
    
        const segundos = leituras.map(
            leitura => Number(leitura.segundoVideo)
        );
    
        const segundosUnicos = new Set(segundos);
    
        if (segundosUnicos.size !== segundos.length) {
            return res.status(400).json({
                error: "Existem leituras com segundoVideo duplicado no lote"
            });
        }
    
        try {
            const resultado = await leituraAtencaoCRUD.createMany(
                idAula,
                leituras
            );
    
            return res.status(201).json(resultado);
        }
        catch (error) {
            console.log(error);
    
            return res.status(500).json({
                error: "Internal server error"
            });
        }
    };

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
