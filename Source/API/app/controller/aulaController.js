const AulaCRUD = require("../db/aulaCRUD");

class AulaController {
    getByLinkId = async (req, res) => {
        const aulaCRUD = new AulaCRUD();
        const { linkId } = req.params;

        await aulaCRUD
            .getByLinkId(linkId)
            .then((aula) => {
                if (aula) {
                    res.status(200).json(aula);
                } else {
                    res.status(404).json({ message: "Aula not found" });
                }
            })
            .catch((error) => {
                console.log(error);
                res.status(500).json({ error: "Internal server error" });
            });
    };

    create = async (req, res) => {
        const aulaCRUD = new AulaCRUD();
    
        const {
            date,
            content,
            classSubjectTeacherId,
            idContentClassification
        } = req.body;
    
        if (!date || !classSubjectTeacherId) {
            return res.status(400).json({
                error: "date e classSubjectTeacherId são obrigatórios"
            });
        }
    
        try {
            const id = await aulaCRUD.create(
                date,
                content,
                classSubjectTeacherId,
                idContentClassification
            );
    
            return res.status(201).json({ id });
        }
        catch (error) {
            console.log(error);
    
            return res.status(500).json({
                error: "Internal server error"
            });
        }
    };

    updateAnalysisData = async (req, res) => {
        const aulaCRUD = new AulaCRUD();

        const { id } = req.params;

        const {
            arquivoVideo
        } = req.body;

        if (
            arquivoVideo === undefined
        ) {
            return res.status(400).json({
                error:
                    "É preciso adicionar o nome do arquivo do vídeo."
            });
        }


        try {
            const aula = await aulaCRUD.updateAnalysisData(
                id,
                arquivoVideo
            );

            return res.status(200).json(aula);
        }
        catch (error) {
            if (error.name === "Not found") {
                return res.status(404).json({
                    error: "Aula não encontrada"
                });
            }

            console.log(error);

            return res.status(500).json({
                error: "Internal server error"
            });
        }
    };

    delete = async (req, res) => {
        const aulaCRUD = new AulaCRUD();
        const { id } = req.body;

        await aulaCRUD
            .delete(id)
            .then(() => {
                res.status(200).json({ message: "Aula deleted successfully" });
            })
            .catch((error) => {
                if (error.name === "Not found") {
                    res.status(404).json({ message: "Aula not found" });
                } else {
                    console.log(error);
                    res.status(500).json({ error: "Internal server error" });
                }
            });
    };

    getAllClassificacaoConteudo = async (req, res) => {
        const aulaCRUD = new AulaCRUD();

        await aulaCRUD
            .getAllClassificacaoConteudo()
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((error) => {
                if (error.name === "Not found") {
                    res.status(404).json({ message: "Classificacao Conteudo not found" });
                } else {
                    console.log(error);
                    res.status(500).json({ error: "Internal server error" });
                }
            });
    };

    getByInstituicao = async (req, res) => {
        const aulaCRUD = new AulaCRUD();
        const { instituicaoId } = req.query;

        await aulaCRUD
            .getByInstituicao(instituicaoId)
            .then((data) => {
                res.status(200).json(data);
            })
            .catch((error) => {
                if (error.name === "Not found") {
                    res.status(404).json({ message: "Aulas not found for the given instituicaoId" });
                } else {
                    console.log(error);
                    res.status(500).json({ error: "Internal server error" });
                }
            });
    };

}

module.exports = AulaController;
