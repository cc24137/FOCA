const AulaCRUD = require("../db/aulaCRUD");
const LeituraAtencaoCRUD = require("../db/leituraAtencaoCRUD");

const FeedbackService = require(
    "../services/feedback/feedbackService"
);

const feedbackConfig = require(
    "../services/feedback/feedbackConfig"
);


function parseAulaId(value) {
    const aulaId = Number(value);

    if (
        !Number.isInteger(aulaId) ||
        aulaId <= 0
    ) {
        return null;
    }

    return aulaId;
}


function historyUnavailableFeedback() {
    return {
        summary: {
            title: "Análise histórica indisponível",
            description:
                "Esta aula ainda não possui uma média de atenção processada."
        },

        items: [],

        recommendations: []
    };
}

class FeedbackController {

    getLessonFeedback = async (req, res) => {
        const aulaCRUD = new AulaCRUD();

        const leituraAtencaoCRUD =
            new LeituraAtencaoCRUD();

        const feedbackService =
            new FeedbackService();

        const aulaId =
            parseAulaId(req.params.aulaId);

        if (aulaId === null) {
            return res.status(400).json({
                error: "aulaId deve ser um número inteiro positivo"
            });
        }

        try {
            const aula =
                await aulaCRUD.getById(aulaId);

            if (!aula) {
                return res.status(404).json({
                    error: "Aula não encontrada"
                });
            }

            const readings =
                await leituraAtencaoCRUD.getByIdAula(
                    aulaId
                );

            const feedback =
                feedbackService.generateLessonFeedback(
                    readings
                );

            return res.status(200).json({
                context: {
                    type: "lesson",
                    aulaId
                },

                ...feedback
            });
        }
        catch (error) {
            console.log(error);

            return res.status(500).json({
                error: "Internal server error"
            });
        }
    };


    getHistoryFeedback = async (req, res) => {
        const aulaCRUD = new AulaCRUD();

        const feedbackService =
            new FeedbackService();

        const aulaId =
            parseAulaId(req.params.aulaId);

        if (aulaId === null) {
            return res.status(400).json({
                error: "aulaId deve ser um número inteiro positivo"
            });
        }

        try {
            const currentLesson =
                await aulaCRUD.getById(aulaId);

            if (!currentLesson) {
                return res.status(404).json({
                    error: "Aula não encontrada"
                });
            }

            if (
                currentLesson.totalAttentionAverage === null ||
                currentLesson.totalAttentionAverage === undefined
            ) {
                return res.status(200).json({
                    context: {
                        type: "history",
                        aulaId
                    },

                    ...historyUnavailableFeedback()
                });
            }

            const previousLessons =
                await aulaCRUD
                    .getPreviousProcessedLessonsByAulaId(
                        aulaId,
                        feedbackConfig.history.lookbackLessons
                    );

            const feedback =
                feedbackService.generateHistoryFeedback(
                    currentLesson,
                    previousLessons
                );

            return res.status(200).json({
                context: {
                    type: "history",
                    aulaId,
                    previousLessonCount:
                        previousLessons.length
                },

                ...feedback
            });
        }
        catch (error) {
            console.log(error);

            return res.status(500).json({
                error: "Internal server error"
            });
        }
    };


    getCompleteFeedback = async (req, res) => {
        const aulaCRUD = new AulaCRUD();

        const leituraAtencaoCRUD =
            new LeituraAtencaoCRUD();

        const feedbackService =
            new FeedbackService();

        const aulaId =
            parseAulaId(req.params.aulaId);

        if (aulaId === null) {
            return res.status(400).json({
                error: "aulaId deve ser um número inteiro positivo"
            });
        }

        try {
            const currentLesson =
                await aulaCRUD.getById(aulaId);

            if (!currentLesson) {
                return res.status(404).json({
                    error: "Aula não encontrada"
                });
            }

            const readings =
                await leituraAtencaoCRUD.getByIdAula(
                    aulaId
                );

            const lessonFeedback =
                feedbackService.generateLessonFeedback(
                    readings
                );

            let historyFeedback;

            if (
                currentLesson.totalAttentionAverage === null ||
                currentLesson.totalAttentionAverage === undefined
            ) {
                historyFeedback =
                    historyUnavailableFeedback();
            }
            else {
                const previousLessons =
                    await aulaCRUD
                        .getPreviousProcessedLessonsByAulaId(
                            aulaId,
                            feedbackConfig.history.lookbackLessons
                        );

                historyFeedback =
                    feedbackService.generateHistoryFeedback(
                        currentLesson,
                        previousLessons
                    );
            }

            return res.status(200).json({
                context: {
                    aulaId,

                    classSubjectTeacherId:
                        currentLesson.classSubjectTeacherId,

                    totalAttentionAverage:
                        currentLesson.totalAttentionAverage
                },

                lesson: lessonFeedback,

                history: historyFeedback
            });
        }
        catch (error) {
            console.log(error);

            return res.status(500).json({
                error: "Internal server error"
            });
        }
    };

}


module.exports = FeedbackController;
