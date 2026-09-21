const AulaCRUD = require("../db/aulaCRUD");
const LeituraAtencaoCRUD = require("../db/leituraAtencaoCRUD");

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
        const leituraAtencaoCRUD = new LeituraAtencaoCRUD();
    
        const { id } = req.params;
    
        const {
            arquivoVideo,
            analise
        } = req.body;
    
        const idAula = Number(id);
    
        if (!Number.isInteger(idAula) || idAula <= 0) {
            return res.status(400).json({
                error: "ID da aula inválido"
            });
        }
    
        if (
            arquivoVideo === undefined ||
            arquivoVideo === null ||
            arquivoVideo.trim() === ""
        ) {
            return res.status(400).json({
                error: "arquivoVideo é obrigatório"
            });
        }
    
        if (
            analise === undefined ||
            analise === null ||
            typeof analise !== "object"
        ) {
            return res.status(400).json({
                error: "analise é obrigatória"
            });
        }
    
        /*
            Média geral da aula
        */
        if (analise.media_global_aula === undefined) {
            return res.status(400).json({
                error: "media_global_aula é obrigatória"
            });
        }
    
        const mediaGlobalAula = Number(
            analise.media_global_aula
        );
    
        if (
            Number.isNaN(mediaGlobalAula) ||
            mediaGlobalAula < 0 ||
            mediaGlobalAula > 100
        ) {
            return res.status(400).json({
                error: "media_global_aula deve estar entre 0 e 100"
            });
        }
    
        /*
            Linha do tempo
        */
        const leituras = analise.linha_do_tempo;
    
        if (
            !Array.isArray(leituras) ||
            leituras.length === 0
        ) {
            return res.status(400).json({
                error: "linha_do_tempo deve ser uma lista não vazia"
            });
        }
    
        /*
            Validação de cada leitura
        */
        for (let i = 0; i < leituras.length; i++) {
            const leitura = leituras[i];
    
            if (
                leitura.segundo_video === undefined ||
                leitura.media_momento === undefined
            ) {
                return res.status(400).json({
                    error:
                        `Leitura na posição ${i} deve possuir ` +
                        "segundo_video e media_momento"
                });
            }
    
            const segundoVideo = Number(
                leitura.segundo_video
            );
    
            const indiceAtencao = Number(
                leitura.media_momento
            );
    
            if (
                !Number.isInteger(segundoVideo) ||
                segundoVideo < 0
            ) {
                return res.status(400).json({
                    error:
                        `segundo_video inválido na leitura da posição ${i}`
                });
            }
    
            if (
                Number.isNaN(indiceAtencao) ||
                indiceAtencao < 0 ||
                indiceAtencao > 100
            ) {
                return res.status(400).json({
                    error:
                        `media_momento inválida na leitura da posição ${i}`
                });
            }
        }
    
        /*
            Verifica segundos duplicados
        */
        const segundos = leituras.map(
            leitura => Number(leitura.segundo_video)
        );
    
        const segundosUnicos = new Set(segundos);
    
        if (segundosUnicos.size !== segundos.length) {
            return res.status(400).json({
                error:
                    "Existem leituras com segundo_video duplicado no lote"
            });
        }
    
        try {
            /*
                Atualiza informações gerais da aula
            */
            const aula = await aulaCRUD.updateAnalysisData(
                idAula,
                arquivoVideo,
                mediaGlobalAula
            );
    
            /*
                Envia diretamente linha_do_tempo.
    
                Não existe conversão para:
                segundoVideo
                indiceAtencao
            */
            const resultadoLeituras =
                await leituraAtencaoCRUD.createMany(
                    idAula,
                    leituras
                );
    
            return res.status(200).json({
                aula,
                leituras: resultadoLeituras
            });
        }
        catch (error) {
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
